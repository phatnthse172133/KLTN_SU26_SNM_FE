"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/application/context/NotificationContext";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function BoothOwnerNotificationsPage() {
  const { recentNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-5 pb-12 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"><Bell className="h-3.5 w-3.5" />Notifications</div>
          <h1 className="text-2xl font-bold text-slate-950">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Updates from administrators and activity related to your booth.</p>
        </div>
        <button type="button" onClick={() => void markAllAsRead()} disabled={unreadCount === 0} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"><CheckCheck className="h-4 w-4" />Mark all as read</button>
      </header>
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        {recentNotifications.length === 0 ? (
          <div className="p-14 text-center"><Bell className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-semibold text-slate-900">No notifications yet</h2><p className="mt-1 text-sm text-slate-500">New announcements will appear here automatically.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentNotifications.map((notification) => (
              <button key={notification.id} type="button" onClick={() => { if (!notification.isRead) void markAsRead(notification.id); }} className={`flex w-full gap-4 p-5 text-left transition hover:bg-slate-50 ${notification.isRead ? "" : "bg-indigo-50/50"}`}>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-slate-200" : "bg-indigo-600"}`} />
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-900">{notification.title}</span><span className="text-xs text-slate-400">{formatDate(notification.createdAt)}</span></span><span className="mt-1 block text-sm leading-6 text-slate-600">{notification.content}</span></span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
