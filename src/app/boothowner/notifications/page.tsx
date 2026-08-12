"use client";

import { useState } from "react";
import { Bell, ChevronRight, Loader2, X } from "lucide-react";
import { useNotifications } from "@/application/context/NotificationContext";
import type { AppNotification } from "@/application/features/notifications/notificationService";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function BoothOwnerNotificationsPage() {
  const { recentNotifications } = useNotifications();
  const [selected, setSelected] = useState<AppNotification | null>(null);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-5 pb-12 sm:p-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600"><Bell className="h-5 w-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-slate-950">Notifications</h1><p className="mt-1 text-sm text-slate-500">Updates from administrators and activity related to your booth.</p></div>
      </header>
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        {recentNotifications.length === 0 ? (
          <div className="p-14 text-center"><Bell className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-semibold text-slate-900">No notifications yet</h2><p className="mt-1 text-sm text-slate-500">New announcements will appear here automatically.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentNotifications.map((notification) => (
              <button key={notification.id} type="button" onClick={() => setSelected(notification)} className={`flex w-full gap-4 p-5 text-left transition hover:bg-slate-50 ${notification.isRead ? "" : "bg-violet-50/50"}`}>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-slate-200" : "bg-violet-600"}`} />
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-900">{notification.title}</span><span className="text-xs text-slate-400">{formatDate(notification.createdAt)}</span></span><span className="mt-1 block line-clamp-2 text-sm leading-6 text-slate-600">{notification.content}</span></span>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-violet-500" />
              </button>
            ))}
          </div>
        )}
      </section>
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)" }} onClick={() => setSelected(null)}>
          <section className="w-full max-w-xl rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Bell className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-violet-600">{selected.type || "Notification"}</p><h2 className="font-bold text-slate-950">Notification details</h2></div></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></header>
            <div className="space-y-5 px-6 py-6"><div><h3 className="text-lg font-bold text-slate-950">{selected.title}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(selected.createdAt)}</p></div><div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 text-sm leading-7 text-slate-700 whitespace-pre-wrap">{selected.content}</div></div>
          </section>
        </div>
      )}
    </main>
  );
}
