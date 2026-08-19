"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { notificationService, type AppNotification } from "@/application/features/notifications/notificationService";
import { useAuth } from "@/application/context/AuthContext";

interface NotificationContextValue {
  unreadCount: number;
  recentNotifications: AppNotification[];
  refreshUnreadCount: () => Promise<void>;
  refreshRecentNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const MAX_RECENT = 20;
const NOTIFICATION_EVENT_TYPES = new Set([
  "NotificationCreated",
  "NotificationRead",
  "NotificationUnreadCountUpdated",
]);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);
  const { isReady, isAuthenticated, user } = useAuth();
  const processedEventIds = useRef<Set<string>>(new Set());

  // Accounts issued by a Market Owner must change their temporary password
  // before accessing any Booth Owner data. Do not issue notification requests
  // while that mandatory step is pending: the API correctly rejects them.
  const canAccessNotifications = isReady && isAuthenticated && !!user && !user.mustChangePassword;
  const authKey = canAccessNotifications && user ? user.id : null;
  const [prevAuthKey, setPrevAuthKey] = useState<string | null>(authKey);
  if (authKey !== prevAuthKey) {
    setPrevAuthKey(authKey);
    if (authKey === null) {
      setUnreadCount(0);
      setRecentNotifications([]);
    }
  }

  const refreshUnreadCount = useCallback(async () => {
    try {
      const resp = await notificationService.getUnreadCount();
      if (resp.success) {
        setUnreadCount(resp.data.unreadCount);
      }
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const refreshRecentNotifications = useCallback(async () => {
    try {
      const resp = await notificationService.getNotifications(1, MAX_RECENT);
      setRecentNotifications(resp.data.items ?? []);
    } catch {
      // keep stale data
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const prevUnread = unreadCount;
    const prevNotifications = recentNotifications;
    setUnreadCount((c) => Math.max(0, c - 1));
    setRecentNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch {
      setUnreadCount(prevUnread);
      setRecentNotifications(prevNotifications);
    }
  }, [unreadCount, recentNotifications]);

  const markAllAsRead = useCallback(async () => {
    const prevUnread = unreadCount;
    const prevNotifications = recentNotifications;
    setUnreadCount(0);
    setRecentNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllAsRead();
    } catch {
      setUnreadCount(prevUnread);
      setRecentNotifications(prevNotifications);
    }
  }, [unreadCount, recentNotifications]);

  useEffect(() => {
    if (authKey === null) {
      processedEventIds.current.clear();
    }
  }, [authKey]);

  useEffect(() => {
    if (!canAccessNotifications) return;
    let cancelled = false;

    notificationService.getUnreadCount()
      .then(resp => { if (!cancelled && resp.success) setUnreadCount(resp.data.unreadCount); })
      .catch(() => { if (!cancelled) setUnreadCount(0); });

    notificationService.getNotifications(1, MAX_RECENT)
      .then(resp => { if (!cancelled) setRecentNotifications(resp.data.items ?? []); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [canAccessNotifications]);

  useEffect(() => {
    if (!canAccessNotifications) return;

    const onRealtimeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !NOTIFICATION_EVENT_TYPES.has(detail.eventType)) return;

      const eventId: string | undefined = detail.eventId;
      if (eventId) {
        if (processedEventIds.current.has(eventId)) return;
        processedEventIds.current.add(eventId);
        if (processedEventIds.current.size > 200) {
          const first = processedEventIds.current.values().next().value;
          if (first) processedEventIds.current.delete(first);
        }
      }

      const eventType: string = detail.eventType;
      const payload = detail.payload ?? {};

      if (eventType === "NotificationUnreadCountUpdated") {
        const count: number | undefined = payload.unreadCount;
        if (typeof count === "number") setUnreadCount(count);
      } else if (eventType === "NotificationCreated") {
        const notification: AppNotification | undefined = payload.notification;
        const count: number | undefined = payload.unreadCount;
        if (typeof count === "number") {
          setUnreadCount(count);
        } else {
          setUnreadCount((c) => c + 1);
        }
        if (notification) {
          setRecentNotifications((list) => {
            if (list.some((n) => n.id === notification.id)) return list;
            return [notification, ...list].slice(0, MAX_RECENT);
          });
        } else {
          void refreshRecentNotifications();
        }
      } else if (eventType === "NotificationRead") {
        const count: number | undefined = payload.unreadCount;
        if (typeof count === "number") {
          setUnreadCount(count);
        }
        const notificationId: string | undefined = payload.notificationId;
        if (notificationId) {
          setRecentNotifications((list) =>
            list.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
          );
        } else {
          void refreshRecentNotifications();
        }
      }
    };

    const onReconnect = () => {
      void refreshUnreadCount();
      void refreshRecentNotifications();
    };

    window.addEventListener("realtime:event", onRealtimeEvent);
    window.addEventListener("realtime:reconnected", onReconnect);
    return () => {
      window.removeEventListener("realtime:event", onRealtimeEvent);
      window.removeEventListener("realtime:reconnected", onReconnect);
    };
  }, [canAccessNotifications, refreshUnreadCount, refreshRecentNotifications]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, recentNotifications, refreshUnreadCount, refreshRecentNotifications, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
