"use client";

import Image from "next/image";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import { chatService, type ChatMessage, type ChatUser, type Conversation } from "@/application/features/chat/chatService";
import { useAuth } from "@/application/context/AuthContext";
import { getErrorMessage } from "@/shared/errors/errorMapper";
import { resolveMediaUrl } from "@/shared/utils";
import {
  useRealtimeChat,
  useJoinConversation,
  useOnReconnect,
  type RealtimeEventPayload,
} from "@/infrastructure/realtime";

const MAX_MESSAGE_LENGTH = 2000;
const POLL_INTERVAL_MS = 4000;

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
      className="relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"
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

function formatListTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function Messages() {
  const { user } = useAuth();
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
  const messageEndRef = useRef<HTMLDivElement>(null);
  const lastScrolledMessageRef = useRef<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  // ─── Realtime chat integration ───
  // Open Chat Hub connection and join the selected conversation group
  useRealtimeChat({
    enabled: !!selectedId,
    onEvent: (evt: RealtimeEventPayload) => {
      if (evt.eventType === "MessageCreated" && selectedId) {
        void loadMessages(selectedId, undefined, true);
      }
    },
  });
  useJoinConversation(selectedId);

  // On reconnect, refresh messages
  useOnReconnect(() => {
    if (selectedId) void loadMessages(selectedId, undefined, true);
  });

  const loadConversations = useCallback(async (signal?: AbortSignal, background = false) => {
    if (!background) setListLoading(true);
    try {
      const response = await chatService.getConversations({ page: 1, pageSize: 100, keyword: debouncedSearch }, signal);
      if (!response.success || !response.data) throw new Error("Conversation data was unavailable.");
      setConversations(response.data.items);
      setListError("");
      setSelectedId((current) => {
        if (current && response.data.items.some((item) => item.id === current)) return current;
        return response.data.items[0]?.id ?? null;
      });
    } catch (error) {
      if (signal?.aborted) return;
      setListError(getErrorMessage(error));
      if (!background) setConversations([]);
    } finally {
      if (!background && !signal?.aborted) setListLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadConversations(controller.signal));
    const interval = window.setInterval(() => void loadConversations(undefined, true), POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId: string, signal?: AbortSignal, background = false) => {
    if (!background) setMessagesLoading(true);
    try {
      const response = await chatService.getMessages(conversationId, { page: 1, pageSize: 100 }, signal);
      if (!response.success || !response.data) throw new Error("Message data was unavailable.");
      const latest = [...response.data.items].reverse();
      if (background) {
        setMessages((current) => {
          const byId = new Map(current.map((message) => [message.id, message]));
          latest.forEach((message) => byId.set(message.id, message));
          return [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      } else {
        setMessages(latest);
        setMessagePage(1);
      }
      setMessageTotal(response.data.total);
      setMessageError("");
      await chatService.markRead(conversationId).catch(() => undefined);
      setConversations((current) => current.map((item) => item.id === conversationId ? { ...item, unreadCount: 0 } : item));
    } catch (error) {
      if (signal?.aborted) return;
      setMessageError(getErrorMessage(error));
      if (!background) setMessages([]);
    } finally {
      if (!background && !signal?.aborted) setMessagesLoading(false);
    }
  }, []);

  const loadOlderMessages = async () => {
    if (!selectedId || olderMessagesLoading || messages.length >= messageTotal) return;
    const nextPage = messagePage + 1;
    setOlderMessagesLoading(true);
    try {
      const response = await chatService.getMessages(selectedId, { page: nextPage, pageSize: 100 });
      if (!response.success || !response.data) throw new Error("Older messages were unavailable.");
      const older = [...response.data.items].reverse();
      setMessages((current) => {
        const byId = new Map([...older, ...current].map((message) => [message.id, message]));
        return [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
    if (!selectedId) {
      Promise.resolve().then(() => setMessages([]));
      return;
    }
    const controller = new AbortController();
    lastScrolledMessageRef.current = null;
    void Promise.resolve().then(() => loadMessages(selectedId, controller.signal));
    const interval = window.setInterval(() => void loadMessages(selectedId, undefined, true), POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [loadMessages, selectedId]);

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
      await Promise.all([loadMessages(selectedId, undefined, true), loadConversations(undefined, true)]);
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

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <aside className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full flex-col border-r border-slate-200 md:w-[340px] lg:w-[380px]`}>
        <div className="border-b border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Customer chat</h1>
              <p className="mt-1 text-sm text-slate-500">Reply to customers from your booth.</p>
            </div>
            <button type="button" onClick={() => void loadConversations()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600" aria-label="Refresh conversations">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="flex h-full items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading conversations...</div>
          ) : listError ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{listError}</span></div>
              <button type="button" onClick={() => void loadConversations()} className="mt-3 font-semibold text-red-700 underline">Try again</button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-slate-500">
              <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-700">No conversations yet</p>
              <p className="mt-1 text-sm">Customer conversations will appear here after they contact your booth.</p>
            </div>
          ) : conversations.map((conversation) => (
            <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left transition ${selectedId === conversation.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
              <Avatar user={conversation.customer} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{conversation.customer.fullName || "Customer"}</p>
                  <span className="shrink-0 text-xs text-slate-400">{formatListTime(conversation.lastMessageAt ?? conversation.updatedAt)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className={`min-w-0 flex-1 truncate text-sm ${conversation.unreadCount > 0 ? "font-medium text-slate-800" : "text-slate-500"}`}>{conversation.lastMessage?.content || "Conversation started"}</p>
                  {conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className={`${selectedConversation ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-slate-50/60`}>
        {!selectedConversation ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <MessageCircle className="mb-4 h-14 w-14 text-indigo-200" />
            <h2 className="text-lg font-semibold text-slate-800">Select a conversation</h2>
            <p className="mt-1 text-sm">Choose a customer to view and reply to messages.</p>
          </div>
        ) : (
          <>
            <header className="flex h-[76px] items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
              <button type="button" onClick={() => setSelectedId(null)} className="mr-1 rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 md:hidden">Back</button>
              <Avatar user={selectedConversation.customer} size={42} />
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-slate-900">{selectedConversation.customer.fullName || "Customer"}</h2>
                <p className="text-xs text-emerald-600">Customer conversation</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading messages...</div>
              ) : messageError && messages.length === 0 ? (
                <div className="mx-auto mt-8 max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{messageError}</span></div>
                  <button type="button" onClick={() => void loadMessages(selectedConversation.id)} className="mt-3 font-semibold underline">Try again</button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">No messages in this conversation yet.</div>
              ) : (
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {messages.length < messageTotal && (
                    <button type="button" onClick={() => void loadOlderMessages()} disabled={olderMessagesLoading} className="mx-auto mb-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 disabled:cursor-wait disabled:text-slate-400">
                      {olderMessagesLoading ? "Loading..." : "Load older messages"}
                    </button>
                  )}
                  {messages.map((message) => {
                    const mine = message.senderId === user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm md:max-w-[68%] ${mine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                          <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.content}</p>
                          <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {mine && <span>{message.isRead ? "Read" : "Sent"}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-4 md:px-6">
              {messageError && messages.length > 0 && <p className="mb-2 text-sm text-red-600">{messageError}</p>}
              <div className="mx-auto flex max-w-4xl items-end gap-3">
                <div className="min-w-0 flex-1">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))} onKeyDown={handleComposerKeyDown} rows={1} placeholder="Type a message..." className="max-h-32 min-h-[44px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                  {draft.length > 1800 && <p className="mt-1 text-right text-xs text-slate-400">{draft.length}/{MAX_MESSAGE_LENGTH}</p>}
                </div>
                <button type="submit" disabled={!draft.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Send message">
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
