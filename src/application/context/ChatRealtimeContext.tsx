"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/application/context/AuthContext";
import { chatService } from "@/application/features/chat/chatService";
import {
  normalizeChatMessage,
  totalUnread,
  type ChatConnectionState,
} from "@/application/features/chat/chatRealtime";
import {
  useOnChatReconnect,
  useRealtimeChat,
  type RealtimeEventPayload,
} from "@/infrastructure/realtime";

interface ChatRealtimeContextValue {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  connectionState: ChatConnectionState;
  connected: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  refreshUnread: () => Promise<void>;
}

const ChatRealtimeContext = createContext<ChatRealtimeContextValue | undefined>(undefined);

function isBoothOwner(role?: string | null) {
  return role?.replace(/[_\s-]/g, "").toLowerCase() === "boothowner";
}

export function ChatRealtimeProvider({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated, user } = useAuth();
  const enabled = isReady && isAuthenticated && isBoothOwner(user?.role) && !user?.mustChangePassword;
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const seenMessageIds = useRef(new Set<string>());
  const activeIdRef = useRef<string | null>(null);
  const userId = user?.id ?? "";

  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const refreshUnread = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await chatService.getConversations({ page: 1, pageSize: 100 });
      if (response.success && response.data) {
        setUnreadCount(totalUnread(response.data.items));
      }
    } catch {
      // keep last known count
    }
  }, [enabled]);

  const handleEvent = useCallback((evt: RealtimeEventPayload) => {
    if (evt.eventType !== "MessageCreated") return;
    const incoming = normalizeChatMessage(evt.payload);
    if (!incoming || seenMessageIds.current.has(incoming.id)) return;
    seenMessageIds.current.add(incoming.id);
    if (!userId || incoming.senderId === userId) return;
    if (activeIdRef.current === incoming.conversationId) return;
    setUnreadCount((count) => count + 1);
  }, [userId]);

  const { connected, connectionState } = useRealtimeChat({
    enabled,
    onEvent: handleEvent,
  });

  const handleReconnect = useCallback(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useOnChatReconnect(handleReconnect);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      seenMessageIds.current.clear();
      return;
    }
    void refreshUnread();
  }, [enabled, refreshUnread]);

  const value = useMemo<ChatRealtimeContextValue>(() => ({
    unreadCount,
    setUnreadCount,
    connectionState,
    connected,
    activeConversationId,
    setActiveConversationId,
    refreshUnread,
  }), [unreadCount, connectionState, connected, activeConversationId, refreshUnread]);

  return <ChatRealtimeContext.Provider value={value}>{children}</ChatRealtimeContext.Provider>;
}

export function useChatRealtime() {
  const value = useContext(ChatRealtimeContext);
  if (!value) {
    return {
      unreadCount: 0,
      setUnreadCount: () => undefined,
      connectionState: "disconnected" as ChatConnectionState,
      connected: false,
      activeConversationId: null,
      setActiveConversationId: () => undefined,
      refreshUnread: async () => undefined,
    };
  }
  return value;
}
