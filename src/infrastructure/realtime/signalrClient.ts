import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

export interface RealtimeEventPayload {
  eventId: string;
  eventType: string;
  occurredAt: string;
  recipientId: string | null;
  groupName: string | null;
  role: string | null;
  payload: unknown;
}

export type RealtimeEventHandler = (evt: RealtimeEventPayload) => void;
export type ReconnectHandler = () => void;

const HUB_NOTIFICATIONS = "/hubs/notifications";
const HUB_CHATS = "/hubs/chats";

const seenEventIds = new Set<string>();
const MAX_DEDUP = 500;

function pruneDedup() {
  if (seenEventIds.size > MAX_DEDUP) {
    const arr = Array.from(seenEventIds);
    seenEventIds.clear();
    for (let i = Math.floor(arr.length / 2); i < arr.length; i++)
      seenEventIds.add(arr[i]);
  }
}

export function isDuplicate(eventId: string): boolean {
  if (!eventId) return false;
  if (seenEventIds.has(eventId)) return true;
  seenEventIds.add(eventId);
  pruneDedup();
  return false;
}

function buildHubUrl(baseUrl: string, hubPath: string): string {
  const base = baseUrl.replace(/\/api\/?$/, "");
  return `${base}${hubPath}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function createNotificationHubConnection(): HubConnection {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5282/api";
  const hubUrl = buildHubUrl(baseUrl, HUB_NOTIFICATIONS);

  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}

export function createChatHubConnection(): HubConnection {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5282/api";
  const hubUrl = buildHubUrl(baseUrl, HUB_CHATS);

  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}

export function startConnection(conn: HubConnection): Promise<void> {
  if (conn.state === HubConnectionState.Connected) return Promise.resolve();
  if (conn.state !== HubConnectionState.Disconnected) return Promise.resolve();
  return conn.start().catch((err) => {
    console.warn("[SignalR] Failed to start connection:", err);
    throw err;
  });
}

export function stopConnection(conn: HubConnection): Promise<void> {
  if (conn.state === HubConnectionState.Disconnected) return Promise.resolve();
  return conn.stop();
}

export function onRealtimeEvent(
  conn: HubConnection,
  handler: RealtimeEventHandler
): () => void {
  const wrapped = (evt: RealtimeEventPayload) => {
    if (!evt || !evt.eventType) return;
    if (isDuplicate(evt.eventId)) return;
    handler(evt);
  };

  conn.on("RealtimeEvent", wrapped);

  return () => {
    conn.off("RealtimeEvent", wrapped);
  };
}

// ─── Active group registry for reconnect re-join (refCounted) ───

interface ActiveGroup {
  method: string;
  id: string;
  leaveMethod: string;
}

interface RefCountedGroup {
  group: ActiveGroup;
  count: number;
}

function groupKey(g: { method: string; id: string }): string {
  return `${g.method}:${g.id}`;
}

const activeNotificationGroups = new Map<string, RefCountedGroup>();
const activeChatGroups = new Map<string, RefCountedGroup>();
const reconnectHandlers: ReconnectHandler[] = [];

export function registerReconnectHandler(handler: ReconnectHandler): () => void {
  reconnectHandlers.push(handler);
  return () => {
    const idx = reconnectHandlers.indexOf(handler);
    if (idx >= 0) reconnectHandlers.splice(idx, 1);
  };
}

export function fireReconnect() {
  reconnectHandlers.forEach((h) => {
    try { h(); } catch (e) { console.warn("[SignalR] Reconnect handler error:", e); }
  });
}

export async function joinGroup(
  conn: HubConnection,
  method: string,
  id: string
): Promise<void> {
  if (conn.state !== HubConnectionState.Connected) return;
  try {
    await conn.invoke(method, id);
  } catch (err) {
    console.warn(`[SignalR] Failed to invoke ${method}(${id}):`, err);
  }
}

export async function leaveGroup(
  conn: HubConnection,
  method: string,
  id: string
): Promise<void> {
  if (conn.state !== HubConnectionState.Connected) return;
  try {
    await conn.invoke(method, id);
  } catch {
    // best-effort
  }
}

// ─── Notification group registry (refCounted) ───

export function registerNotificationGroup(group: ActiveGroup): () => boolean {
  const key = groupKey(group);
  const existing = activeNotificationGroups.get(key);
  if (existing) {
    existing.count++;
  } else {
    activeNotificationGroups.set(key, { group, count: 1 });
  }
  let disposed = false;
  return () => {
    if (disposed) return false;
    disposed = true;
    const entry = activeNotificationGroups.get(key);
    if (!entry) return false;
    entry.count--;
    if (entry.count <= 0) {
      activeNotificationGroups.delete(key);
      return true;
    }
    return false;
  };
}

export async function rejoinAllNotificationGroups(conn: HubConnection): Promise<void> {
  for (const entry of activeNotificationGroups.values()) {
    await joinGroup(conn, entry.group.method, entry.group.id);
  }
}

export function getActiveNotificationGroups(): ActiveGroup[] {
  return Array.from(activeNotificationGroups.values()).map((e) => e.group);
}

export function getNotificationGroupRefCount(method: string, id: string): number {
  return activeNotificationGroups.get(groupKey({ method, id }))?.count ?? 0;
}

// ─── Chat group registry (refCounted) ───

export function registerChatGroup(group: ActiveGroup): () => boolean {
  const key = groupKey(group);
  const existing = activeChatGroups.get(key);
  if (existing) {
    existing.count++;
  } else {
    activeChatGroups.set(key, { group, count: 1 });
  }
  let disposed = false;
  return () => {
    if (disposed) return false;
    disposed = true;
    const entry = activeChatGroups.get(key);
    if (!entry) return false;
    entry.count--;
    if (entry.count <= 0) {
      activeChatGroups.delete(key);
      return true;
    }
    return false;
  };
}

export async function rejoinAllChatGroups(conn: HubConnection): Promise<void> {
  for (const entry of activeChatGroups.values()) {
    await joinGroup(conn, entry.group.method, entry.group.id);
  }
}

export function getActiveChatGroups(): ActiveGroup[] {
  return Array.from(activeChatGroups.values()).map((e) => e.group);
}

export function getChatGroupRefCount(method: string, id: string): number {
  return activeChatGroups.get(groupKey({ method, id }))?.count ?? 0;
}
