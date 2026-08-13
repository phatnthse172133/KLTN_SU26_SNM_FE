"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";
import {
  RealtimeEventPayload,
  RealtimeEventHandler,
  createNotificationHubConnection,
  createChatHubConnection,
  startConnection,
  stopConnection,
  onRealtimeEvent,
  joinGroup,
  leaveGroup,
  isDuplicate,
  registerNotificationGroup,
  registerChatGroup,
  registerReconnectHandler,
  registerChatReconnectHandler,
  fireReconnect,
  fireChatReconnect,
  rejoinAllNotificationGroups,
  rejoinAllChatGroups,
} from "./signalrClient";

export type ChatConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

const chatStateListeners = new Set<(state: ChatConnectionState) => void>();
let chatConnectionState: ChatConnectionState = "disconnected";

function setChatConnectionState(state: ChatConnectionState) {
  chatConnectionState = state;
  chatStateListeners.forEach((listener) => listener(state));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function typedChatEvent(eventType: string, payload: unknown): RealtimeEventPayload {
  const record = asRecord(payload);
  const id = String(record?.id ?? record?.Id ?? record?.conversationId ?? record?.ConversationId ?? "");
  return {
    eventId: id ? `${eventType}:${id}` : "",
    eventType,
    occurredAt: String(record?.createdAt ?? record?.CreatedAt ?? record?.readAt ?? record?.ReadAt ?? new Date().toISOString()),
    recipientId: null,
    groupName: null,
    role: null,
    payload,
  };
}

function emitChatEvent(evt: RealtimeEventPayload) {
  if (!evt || !evt.eventType) return;
  if (isDuplicate(evt.eventId)) return;
  chatHandlers.forEach((handler) => handler(evt));
}

export interface UseRealtimeOptions {
  onEvent?: RealtimeEventHandler;
  enabled?: boolean;
}

export interface UseRealtimeResult {
  connected: boolean;
  reconnect: () => Promise<void>;
}

let notificationConn: HubConnection | null = null;
let chatConn: HubConnection | null = null;
let notificationStartPromise: Promise<void> | null = null;
let chatStartPromise: Promise<void> | null = null;
let notificationRefCount = 0;
let chatRefCount = 0;
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000] as const;
const notificationHandlers = new Set<RealtimeEventHandler>();
const chatHandlers = new Set<RealtimeEventHandler>();

async function ensureNotificationConnection() {
  if (!notificationConn) {
    const connection = createNotificationHubConnection();
    connection.onreconnected(async () => {
      if (notificationConn !== connection) return;
      await rejoinAllNotificationGroups(connection);
      fireReconnect();
    });
    connection.on("RealtimeEvent", (evt: RealtimeEventPayload) => {
      if (!evt || !evt.eventType) return;
      if (isDuplicate(evt.eventId)) return;
      notificationHandlers.forEach((h) => h(evt));
    });
    notificationConn = connection;
  }

  const connection = notificationConn;
  if (connection.state === HubConnectionState.Connected) return;
  if (connection.state !== HubConnectionState.Disconnected) return;

  if (!notificationStartPromise) {
    const startPromise = startConnection(connection)
      .then(async () => {
        if (notificationConn === connection) {
          await rejoinAllNotificationGroups(connection);
          fireReconnect();
        }
      })
      .finally(() => {
        if (notificationStartPromise === startPromise) {
          notificationStartPromise = null;
        }
      });
    notificationStartPromise = startPromise;
  }
  await notificationStartPromise;
}

async function ensureChatConnection() {
  if (!chatConn) {
    const connection = createChatHubConnection();
    connection.onreconnecting(() => {
      if (chatConn !== connection) return;
      setChatConnectionState("reconnecting");
    });
    connection.onreconnected(async () => {
      if (chatConn !== connection) return;
      await rejoinAllChatGroups(connection);
      setChatConnectionState("connected");
      fireChatReconnect();
    });
    connection.onclose(() => {
      if (chatConn !== connection) return;
      setChatConnectionState("disconnected");
    });
    connection.on("MessageCreated", (message: unknown) => {
      if (chatConn !== connection) return;
      emitChatEvent(typedChatEvent("MessageCreated", message));
    });
    connection.on("ConversationRead", (payload: unknown) => {
      if (chatConn !== connection) return;
      emitChatEvent(typedChatEvent("ConversationRead", payload));
    });
    connection.on("RealtimeEvent", (evt: RealtimeEventPayload) => {
      if (chatConn !== connection) return;
      emitChatEvent(evt);
    });
    chatConn = connection;
  }

  const connection = chatConn;
  if (connection.state === HubConnectionState.Connected) return;
  if (connection.state !== HubConnectionState.Disconnected) return;

  if (!chatStartPromise) {
    setChatConnectionState("connecting");
    const startPromise = startConnection(connection)
      .then(async () => {
        if (chatConn === connection) {
          await rejoinAllChatGroups(connection);
          setChatConnectionState("connected");
          fireChatReconnect();
        }
      })
      .catch((error) => {
        setChatConnectionState("disconnected");
        throw error;
      })
      .finally(() => {
        if (chatStartPromise === startPromise) {
          chatStartPromise = null;
        }
      });
    chatStartPromise = startPromise;
  }
  await chatStartPromise;
}

export function useRealtimeNotifications(
  options: UseRealtimeOptions = {}
): UseRealtimeResult {
  const { onEvent, enabled = true } = options;
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    const handler: RealtimeEventHandler = (evt) => {
      handlerRef.current?.(evt);
    };

    notificationHandlers.add(handler);
    notificationRefCount++;

    let cancelled = false;
    let connecting = false;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = () => {
      if (cancelled || retryTimer) return;
      const delay = RETRY_DELAYS_MS[
        Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)
      ];
      retryAttempt++;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (cancelled || connecting) return;
      connecting = true;
      try {
        await ensureNotificationConnection();
        const isConnected =
          notificationConn?.state === HubConnectionState.Connected;
        if (!cancelled) setConnected(isConnected);
        if (isConnected) retryAttempt = 0;
        else scheduleRetry();
      } catch {
        if (!cancelled) setConnected(false);
        scheduleRetry();
      } finally {
        connecting = false;
      }
    };

    void connect();

    const checkInterval = setInterval(() => {
      const isConnected =
        notificationConn?.state === HubConnectionState.Connected;
      setConnected(isConnected);
      if (!isConnected && !retryTimer) void connect();
    }, 2000);

    return () => {
      cancelled = true;
      notificationHandlers.delete(handler);
      notificationRefCount = Math.max(0, notificationRefCount - 1);
      clearInterval(checkInterval);
      if (retryTimer) clearTimeout(retryTimer);

      if (notificationRefCount <= 0 && notificationConn) {
        const connectionToStop = notificationConn;
        const pendingStart = notificationStartPromise;
        notificationConn = null;
        notificationStartPromise = null;
        notificationRefCount = 0;
        void (pendingStart ?? Promise.resolve())
          .catch(() => undefined)
          .finally(() => stopConnection(connectionToStop).catch(() => undefined));
      }
    };
  }, [enabled]);

  const reconnect = useCallback(async () => {
    if (notificationConn) {
      try {
        await stopConnection(notificationConn);
        await startConnection(notificationConn);
        await rejoinAllNotificationGroups(notificationConn);
        fireReconnect();
        setConnected(true);
      } catch {
        setConnected(false);
      }
    }
  }, []);

  return { connected, reconnect };
}

export function useRealtimeChat(
  options: UseRealtimeOptions = {}
): UseRealtimeResult & { connectionState: ChatConnectionState } {
  const { onEvent, enabled = true } = options;
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ChatConnectionState>(chatConnectionState);
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const unsubscribeState = (() => {
      const listener = (state: ChatConnectionState) => setConnectionState(state);
      chatStateListeners.add(listener);
      setConnectionState(chatConnectionState);
      return () => { chatStateListeners.delete(listener); };
    })();
    return unsubscribeState;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handler: RealtimeEventHandler = (evt) => {
      handlerRef.current?.(evt);
    };

    chatHandlers.add(handler);
    chatRefCount++;

    let cancelled = false;
    let connecting = false;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = () => {
      if (cancelled || retryTimer) return;
      const delay = RETRY_DELAYS_MS[
        Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)
      ];
      retryAttempt++;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (cancelled || connecting) return;
      connecting = true;
      try {
        await ensureChatConnection();
        const isConnected = chatConn?.state === HubConnectionState.Connected;
        if (!cancelled) setConnected(isConnected);
        if (isConnected) retryAttempt = 0;
        else scheduleRetry();
      } catch {
        if (!cancelled) setConnected(false);
        scheduleRetry();
      } finally {
        connecting = false;
      }
    };

    void connect();

    const checkInterval = setInterval(() => {
      const isConnected = chatConn?.state === HubConnectionState.Connected;
      setConnected(isConnected);
      if (!isConnected && !retryTimer) void connect();
    }, 2000);

    return () => {
      cancelled = true;
      chatHandlers.delete(handler);
      chatRefCount = Math.max(0, chatRefCount - 1);
      clearInterval(checkInterval);
      if (retryTimer) clearTimeout(retryTimer);

      if (chatRefCount <= 0 && chatConn) {
        const connectionToStop = chatConn;
        const pendingStart = chatStartPromise;
        chatConn = null;
        chatStartPromise = null;
        chatRefCount = 0;
        void (pendingStart ?? Promise.resolve())
          .catch(() => undefined)
          .finally(() => stopConnection(connectionToStop).catch(() => undefined));
      }
    };
  }, [enabled]);

  const reconnect = useCallback(async () => {
    if (chatConn) {
      try {
        await stopConnection(chatConn);
        await startConnection(chatConn);
        await rejoinAllChatGroups(chatConn);
        fireChatReconnect();
        setChatConnectionState("connected");
        setConnected(true);
      } catch {
        setChatConnectionState("disconnected");
        setConnected(false);
      }
    }
  }, []);

  return { connected, reconnect, connectionState };
}

export function useJoinMarket(marketId: string | null | undefined) {
  useEffect(() => {
    if (!marketId) return;
    const group = { method: "JoinMarket", id: marketId, leaveMethod: "LeaveMarket" };
    const unregister = registerNotificationGroup(group);

    if (notificationConn && notificationConn.state === HubConnectionState.Connected) {
      joinGroup(notificationConn, "JoinMarket", marketId);
    }

    return () => {
      const isLastSubscriber = unregister();
      if (isLastSubscriber && notificationConn && notificationConn.state === HubConnectionState.Connected) {
        leaveGroup(notificationConn, "LeaveMarket", marketId);
      }
    };
  }, [marketId]);
}

export function useJoinLayout(layoutId: string | null | undefined) {
  useEffect(() => {
    if (!layoutId) return;
    const group = { method: "JoinLayout", id: layoutId, leaveMethod: "LeaveLayout" };
    const unregister = registerNotificationGroup(group);

    if (notificationConn && notificationConn.state === HubConnectionState.Connected) {
      joinGroup(notificationConn, "JoinLayout", layoutId);
    }

    return () => {
      const isLastSubscriber = unregister();
      if (isLastSubscriber && notificationConn && notificationConn.state === HubConnectionState.Connected) {
        leaveGroup(notificationConn, "LeaveLayout", layoutId);
      }
    };
  }, [layoutId]);
}

export function useJoinBooth(boothId: string | null | undefined) {
  useEffect(() => {
    if (!boothId) return;
    const group = { method: "JoinBooth", id: boothId, leaveMethod: "LeaveBooth" };
    const unregister = registerNotificationGroup(group);

    if (notificationConn && notificationConn.state === HubConnectionState.Connected) {
      joinGroup(notificationConn, "JoinBooth", boothId);
    }

    return () => {
      const isLastSubscriber = unregister();
      if (isLastSubscriber && notificationConn && notificationConn.state === HubConnectionState.Connected) {
        leaveGroup(notificationConn, "LeaveBooth", boothId);
      }
    };
  }, [boothId]);
}

export function useJoinSupportTicket(ticketId: string | null | undefined) {
  useEffect(() => {
    if (!ticketId) return;
    const group = { method: "JoinSupportTicket", id: ticketId, leaveMethod: "LeaveSupportTicket" };
    const unregister = registerNotificationGroup(group);

    if (notificationConn && notificationConn.state === HubConnectionState.Connected) {
      joinGroup(notificationConn, "JoinSupportTicket", ticketId);
    }

    return () => {
      const isLastSubscriber = unregister();
      if (isLastSubscriber && notificationConn && notificationConn.state === HubConnectionState.Connected) {
        leaveGroup(notificationConn, "LeaveSupportTicket", ticketId);
      }
    };
  }, [ticketId]);
}

export function useJoinConversation(conversationId: string | null | undefined) {
  useEffect(() => {
    if (!conversationId) return;
    const group = { method: "JoinConversation", id: conversationId, leaveMethod: "LeaveConversation" };
    const unregister = registerChatGroup(group);

    if (chatConn && chatConn.state === HubConnectionState.Connected) {
      joinGroup(chatConn, "JoinConversation", conversationId);
    }

    return () => {
      const isLastSubscriber = unregister();
      if (isLastSubscriber && chatConn && chatConn.state === HubConnectionState.Connected) {
        leaveGroup(chatConn, "LeaveConversation", conversationId);
      }
    };
  }, [conversationId]);
}

// ─── Reconnect hook: call onReconnect after SignalR reconnects ───

export function useOnReconnect(onReconnect: () => void) {
  useEffect(() => {
    const unregister = registerReconnectHandler(onReconnect);
    return unregister;
  }, [onReconnect]);
}

export function useOnChatReconnect(onReconnect: () => void) {
  useEffect(() => {
    const unregister = registerChatReconnectHandler(onReconnect);
    return unregister;
  }, [onReconnect]);
}

export { onRealtimeEvent };
