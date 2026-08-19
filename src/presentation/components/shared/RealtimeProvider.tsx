"use client";

import { type ReactNode, useCallback } from "react";
import { useAuth } from "@/application/context/AuthContext";
import {
  useRealtimeNotifications,
  useOnReconnect,
  type RealtimeEventPayload,
} from "@/infrastructure/realtime";

interface RealtimeProviderProps {
  children: ReactNode;
}

const NOTIFICATION_EVENTS = new Set([
  "NotificationCreated",
  "NotificationRead",
  "NotificationUnreadCountUpdated",
  "OrderCreated",
  "OrderStatusChanged",
  "OrderPaymentSucceeded",
  "OrderPaymentFailed",
  "OrderRefundRequested",
  "OrderRefundCompleted",
  "SubscriptionActivated",
  "SubscriptionExpired",
  "SubscriptionCancelled",
  "SupportTicketCreated",
  "SupportTicketReplied",
  "SupportTicketStatusChanged",
  "SupportAttachmentAdded",
  "LayoutActivated",
  "LayoutDeactivated",
  "BoothAssigned",
  "BoothMoved",
  "BoothUnassigned",
]);

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { isAuthenticated, isReady } = useAuth();

  const handleEvent = useCallback((evt: RealtimeEventPayload) => {
    if (!NOTIFICATION_EVENTS.has(evt.eventType)) return;

    // Dispatch a CustomEvent so any component can listen
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("realtime:event", { detail: evt })
      );
    }
  }, []);

  useRealtimeNotifications({
    onEvent: handleEvent,
    enabled: isReady && isAuthenticated,
  });

  const handleReconnect = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("realtime:reconnected"));
    }
  }, []);

  useOnReconnect(handleReconnect);

  return <>{children}</>;
}
