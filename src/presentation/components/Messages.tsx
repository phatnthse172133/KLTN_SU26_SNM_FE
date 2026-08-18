"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, MessageCircle, RefreshCw, Search, Send, Wifi, WifiOff } from "lucide-react";
import { chatService, type ChatMessage, type ChatUser, type Conversation } from "@/application/features/chat/chatService";
import {
  applyConversationRead,
  applyMessageCreated,
  dayKey,
  formatDayLabel,
  formatListTime,
  formatMessageTime,
  normalizeChatMessage,
  normalizeConversationRead,
  totalUnread,
} from "@/application/features/chat/chatRealtime";
import { useAuth } from "@/application/context/AuthContext";
import { useChatRealtime } from "@/application/context/ChatRealtimeContext";
import { getErrorMessage } from "@/shared/errors/errorMapper";
import { resolveMediaUrl } from "@/shared/utils";
import {
  useJoinConversation,
  useOnChatReconnect,
  useRealtimeChat,
  type RealtimeEventPayload,
} from "@/infrastructure/realtime";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Generate an idempotency key for a chat message. `crypto.randomUUID()` is
 * unavailable in insecure browser contexts (for example the HTTP VPS URL),
 * so sending a message must not depend on it being present.
 */
function createClientMessageId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function Avatar({ user, size = 44 }: { user: ChatUser; size?: number }) {
  const avatarUrl = resolveMediaUrl(user.avatarUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(avatarUrl) && failedUrl !== avatarUrl;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground"
      style={{ width: size, height: size }}
      aria-label={`${user.fullName}'s avatar`}
    >
      {showImage ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes={`${size}px`}
          unoptimized
          className="object-cover"
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold">{initials(user.fullName)}</span>
      )}
    </div>
  );
}

function isDesktopLayout() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

export function Messages() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const { connectionState, setUnreadCount, setActiveConversationId } = useChatRealtime();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [olderMessagesLoading, setOlderMessagesLoading] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [messageTotal, setMessageTotal] = useState(0);
  const [sending, setSending] = useState(false);
  const [listError, setListError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [markedReadFor, setMarkedReadFor] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const lastScrolledMessageRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
    setActiveConversationId(selectedId);
    return () => setActiveConversationId(null);
  }, [selectedId, setActiveConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
    setUnreadCount(totalUnread(conversations));
  }, [conversations, setUnreadCount]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadConversations = useCallback(async (signal?: AbortSignal, background = false) => {
    if (!background) setListLoading(true);
    try {
      const response = await chatService.getConversations({ page: 1, pageSize: 100, keyword: debouncedSearch }, signal);
      if (!response.success || !response.data) throw new Error("Conversation data was unavailable.");
      setConversations(response.data.items);
      setListError("");
      setSelectedId((current) => {
        if (current && response.data.items.some((item) => item.id === current)) return current;
        if (isDesktopLayout()) return response.data.items[0]?.id ?? null;
        return null;
      });
    } catch (error) {
      if (signal?.aborted) return;
      setListError(getErrorMessage(error));
      if (!background) setConversations([]);
    } finally {
      if (!background && !signal?.aborted) setListLoading(false);
    }
  }, [debouncedSearch]);

  const loadMessages = useCallback(async (conversationId: string, signal?: AbortSignal, background = false) => {
    if (!background) setMessagesLoading(true);
    try {
      const response = await chatService.getMessages(conversationId, { page: 1, pageSize: 100 }, signal);
      if (!response.success || !response.data) throw new Error("Message data was unavailable.");
      const latest = [...response.data.items].reverse();
      if (background) {
        setMessages((current) => {
          const byId = new Map(current.map((item) => [item.id, item]));
          latest.forEach((item) => byId.set(item.id, item));
          return [...byId.values()].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
        });
      } else {
        setMessages(latest);
        setMessagePage(1);
      }
      setMessageTotal(response.data.total);
      setMessageError("");
    } catch (error) {
      if (signal?.aborted) return;
      setMessageError(getErrorMessage(error));
      if (!background) setMessages([]);
    } finally {
      if (!background && !signal?.aborted) setMessagesLoading(false);
    }
  }, []);

  const markConversationRead = useCallback(async (conversationId: string) => {
    await chatService.markRead(conversationId).catch(() => undefined);
    setConversations((current) => current.map((item) => item.id === conversationId ? { ...item, unreadCount: 0 } : item));
    setMarkedReadFor(conversationId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadConversations(controller.signal);
    return () => controller.abort();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setMarkedReadFor(null);
      return;
    }
    const controller = new AbortController();
    lastScrolledMessageRef.current = null;
    void loadMessages(selectedId, controller.signal);
    return () => controller.abort();
  }, [loadMessages, selectedId]);

  useEffect(() => {
    if (!selectedId || markedReadFor === selectedId) return;
    void markConversationRead(selectedId);
  }, [markConversationRead, markedReadFor, selectedId]);

  const handleRealtimeEvent = useCallback((evt: RealtimeEventPayload) => {
    if (evt.eventType === "MessageCreated") {
      const incoming = normalizeChatMessage(evt.payload);
      if (!incoming) return;
      const result = applyMessageCreated({
        conversations: conversationsRef.current,
        messages: messagesRef.current,
        selectedId: selectedIdRef.current,
        incoming,
        currentUserId,
      });
      setConversations(result.conversations);
      setMessages(result.messages);
      if (result.unknownConversation) void loadConversations(undefined, true);
      if (result.shouldMarkRead && incoming.conversationId) void markConversationRead(incoming.conversationId);
      return;
    }
    if (evt.eventType === "ConversationRead") {
      const read = normalizeConversationRead(evt.payload);
      if (!read) return;
      setMessages((current) => applyConversationRead({
        messages: current,
        selectedId: selectedIdRef.current,
        conversationId: read.conversationId,
        readerId: read.readerId,
        currentUserId,
        readAt: read.readAt,
      }));
    }
  }, [currentUserId, loadConversations, markConversationRead]);

  useRealtimeChat({ enabled: true, onEvent: handleRealtimeEvent });
  useJoinConversation(selectedId);
  useOnChatReconnect(useCallback(() => {
    void loadConversations(undefined, true);
    if (selectedIdRef.current) void loadMessages(selectedIdRef.current, undefined, true);
  }, [loadConversations, loadMessages]));

  const loadOlderMessages = async () => {
    if (!selectedId || olderMessagesLoading || messages.length >= messageTotal) return;
    const nextPage = messagePage + 1;
    setOlderMessagesLoading(true);
    try {
      const response = await chatService.getMessages(selectedId, { page: nextPage, pageSize: 100 });
      if (!response.success || !response.data) throw new Error("Older messages were unavailable.");
      const older = [...response.data.items].reverse();
      setMessages((current) => {
        const byId = new Map([...older, ...current].map((item) => [item.id, item]));
        return [...byId.values()].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
      });
      setMessagePage(nextPage);
      setMessageTotal(response.data.total);
    } catch (error) {
      setMessageError(getErrorMessage(error));
    } finally {
      setOlderMessagesLoading(false);
    }
  };

  useEffect(() => {
    const latestMessageId = messages.at(-1)?.id ?? null;
    if (latestMessageId && latestMessageId !== lastScrolledMessageRef.current) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    lastScrolledMessageRef.current = latestMessageId;
  }, [messages]);

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!selectedId || !content || sending || content.length > MAX_MESSAGE_LENGTH) return;
    setSending(true);
    setMessageError("");
    try {
      const response = await chatService.sendMessage(selectedId, content, createClientMessageId());
      if (!response.success || !response.data) throw new Error("The message was not accepted.");
      setDraft("");
      const result = applyMessageCreated({
        conversations: conversationsRef.current,
        messages: messagesRef.current,
        selectedId,
        incoming: response.data,
        currentUserId,
      });
      setConversations(result.conversations);
      setMessages(result.messages);
    } catch (error) {
      setMessageError(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const connectionLabel = connectionState === "connected"
    ? "Realtime connected"
    : connectionState === "reconnecting" || connectionState === "connecting"
      ? "Reconnecting…"
      : "Realtime disconnected · messages still send";

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[620px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <aside className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full flex-col border-r border-border md:w-[340px] lg:w-[380px]`}>
        <div className="border-b border-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Customer chat</h1>
              <p className="mt-1 text-sm text-muted-foreground">Reply to customers from your booth.</p>
            </div>
            <button type="button" onClick={() => void loadConversations()} className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Refresh conversations">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" className="w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex animate-pulse gap-3">
                  <div className="h-11 w-11 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : listError ? (
            <div className="m-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{listError}</span></div>
              <button type="button" onClick={() => void loadConversations()} className="mt-3 font-semibold underline">Try again</button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-muted-foreground">
              <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No conversations yet</p>
              <p className="mt-1 text-sm">Customer conversations will appear here after they contact your booth.</p>
            </div>
          ) : conversations.map((conversation) => (
            <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`flex w-full gap-3 border-b border-border/60 p-4 text-left transition ${selectedId === conversation.id ? "bg-accent" : "hover:bg-accent/50"}`}>
              <Avatar user={conversation.customer} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-sm ${conversation.unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>{conversation.customer.fullName || "Customer"}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatListTime(conversation.lastMessageAt ?? conversation.updatedAt)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className={`min-w-0 flex-1 truncate text-sm ${conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{conversation.lastMessage?.content || "Conversation started"}</p>
                  {conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className={`${selectedConversation ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-muted/40`}>
        {!selectedConversation ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <MessageCircle className="mb-4 h-14 w-14 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold text-foreground">Select a conversation</h2>
            <p className="mt-1 text-sm">Choose a customer to view and reply to messages.</p>
          </div>
        ) : (
          <>
            <header className="flex h-[76px] items-center gap-3 border-b border-border bg-card px-4 md:px-6">
              <button type="button" onClick={() => setSelectedId(null)} className="mr-1 rounded-lg px-2 py-1 text-sm font-medium text-foreground md:hidden">Back</button>
              <Avatar user={selectedConversation.customer} size={42} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-foreground">{selectedConversation.customer.fullName || "Customer"}</h2>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {connectionState === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span>{connectionLabel}</span>
                </p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
              {messagesLoading ? (
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className={`h-12 w-2/3 animate-pulse rounded-2xl bg-muted ${index % 2 ? "ml-auto" : ""}`} />
                  ))}
                </div>
              ) : messageError && messages.length === 0 ? (
                <div className="mx-auto mt-8 max-w-md rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  <div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{messageError}</span></div>
                  <button type="button" onClick={() => void loadMessages(selectedConversation.id)} className="mt-3 font-semibold underline">Try again</button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No messages in this conversation yet. Send the first reply below.</div>
              ) : (
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {messages.length < messageTotal && (
                    <button type="button" onClick={() => void loadOlderMessages()} disabled={olderMessagesLoading} className="mx-auto mb-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent disabled:cursor-wait disabled:text-muted-foreground">
                      {olderMessagesLoading ? "Loading..." : "Load older messages"}
                    </button>
                  )}
                  {messages.map((item, index) => {
                    const mine = item.senderId === currentUserId;
                    const showDay = index === 0 || dayKey(item.createdAt) !== dayKey(messages[index - 1].createdAt);
                    return (
                      <div key={item.id}>
                        {showDay && <div className="mb-3 mt-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{formatDayLabel(item.createdAt)}</div>}
                        <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm md:max-w-[68%] ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card text-foreground"}`}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-5">{item.content}</p>
                            <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              <span>{formatMessageTime(item.createdAt)}</span>
                              {mine && <span>{item.isRead ? "Read" : "Sent"}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="border-t border-border bg-card p-4 md:px-6">
              {messageError && messages.length > 0 && <p className="mb-2 text-sm text-destructive">{messageError}</p>}
              <div className="mx-auto flex max-w-4xl items-end gap-3">
                <div className="min-w-0 flex-1">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))} onKeyDown={handleComposerKeyDown} rows={1} placeholder="Type a message..." className="max-h-32 min-h-[44px] w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30" />
                  {draft.length > 1800 && <p className="mt-1 text-right text-xs text-muted-foreground">{draft.length}/{MAX_MESSAGE_LENGTH}</p>}
                </div>
                <button type="submit" disabled={!draft.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground" aria-label="Send message">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
