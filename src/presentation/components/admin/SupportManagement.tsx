"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Headphones, MessageSquare, Search, Send, TimerReset, type LucideIcon } from "lucide-react";
import { supportService, type SupportMetrics, type SupportTicketDetail, type SupportTicketListItem } from "@/application/features/support/supportService";
import { getErrorMessage } from "@/shared/errors/errorMapper";
import { resolveMediaUrl } from "@/shared/utils";
import { useJoinSupportTicket, useOnReconnect } from "@/infrastructure/realtime";

const statuses = ["Open", "InProgress", "WaitingForRequester", "Resolved", "Closed"];
const displayStatus = (status: string) => status.replace(/([a-z])([A-Z])/g, "$1 $2");
const tone = (status: string) => status === "Resolved" || status === "Closed" ? "bg-emerald-50 text-emerald-700" : status === "WaitingForRequester" ? "bg-amber-50 text-amber-700" : status === "InProgress" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700";
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
type MetricCard = { label: string; value: number; icon: LucideIcon; style: string };

export function SupportManagement() {
  const [items, setItems] = useState<SupportTicketListItem[]>([]);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [selected, setSelected] = useState<SupportTicketDetail | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ticketPage, metricData] = await Promise.all([
        supportService.getAdmin({ Page: 1, PageSize: 50, Keyword: query.trim() || null, Status: status || null }),
        supportService.getMetrics(),
      ]);
      setItems(ticketPage.items ?? []); setMetrics(metricData);
    } catch (loadError) { setError(getErrorMessage(loadError)); }
    finally { setLoading(false); }
  }, [query, status]);

  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);

  // Join support ticket group when viewing detail
  useJoinSupportTicket(selected?.id ?? null);

  // Listen for realtime support events
  useEffect(() => {
    const onRealtimeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const type: string = detail.eventType;
      if (type === "SupportTicketCreated" || type === "SupportTicketReplied" ||
          type === "SupportTicketStatusChanged" || type === "SupportAttachmentAdded") {
        void load();
        if (selected?.id) void open(selected.id);
      }
    };
    window.addEventListener("realtime:event", onRealtimeEvent);
    return () => window.removeEventListener("realtime:event", onRealtimeEvent);
  }, [load, selected?.id]);

  // On reconnect, refresh data
  useOnReconnect(() => {
    void load();
    if (selected?.id) void open(selected.id);
  });

  const open = async (id: string) => { try { setSelected(await supportService.getAdminDetail(id)); } catch (detailError) { setError(getErrorMessage(detailError)); } };
  const updateStatus = async (next: string) => { if (!selected) return; setSaving(true); try { setSelected(await supportService.updateAdmin(selected.id, next)); await load(); } catch (updateError) { setError(getErrorMessage(updateError)); } finally { setSaving(false); } };
  const send = async () => { if (!selected || !reply.trim()) return; setSaving(true); try { setSelected(await supportService.replyAdmin(selected.id, reply.trim(), internalNote)); setReply(""); setInternalNote(false); await load(); } catch (replyError) { setError(getErrorMessage(replyError)); } finally { setSaving(false); } };

  if (selected) return <div className="mx-auto max-w-7xl space-y-5 p-6 lg:p-8"><button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Back to support queue</button>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="rounded-3xl border border-slate-100 bg-white shadow-sm"><div className="border-b border-slate-100 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">{selected.ticketCode}</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{selected.title}</h1><p className="mt-2 text-sm text-slate-500">{selected.requesterName} · {selected.requesterEmail} · {selected.requesterRole}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${tone(selected.status)}`}>{displayStatus(selected.status)}</span></div></div><div className="space-y-6 p-6"><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase text-slate-400">Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.description}</p></div>{selected.attachments.length > 0 && <div><h2 className="text-sm font-bold">Evidence</h2><div className="mt-3 flex flex-wrap gap-2">{selected.attachments.map((file) => <a key={file.id} href={resolveMediaUrl(file.fileUrl)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-blue-700">{file.originalFileName}</a>)}</div></div>}<div><h2 className="text-sm font-bold">Conversation</h2><div className="mt-3 space-y-3">{selected.messages.map((message) => <div key={message.id} className={`rounded-2xl p-4 ${message.isInternalNote ? "border border-amber-200 bg-amber-50" : message.senderRole === "Admin" ? "ml-auto max-w-[88%] bg-blue-600 text-white" : "max-w-[88%] bg-slate-100 text-slate-800"}`}><div className="flex justify-between gap-3 text-xs font-semibold opacity-70"><span>{message.senderName}{message.isInternalNote ? " · Internal note" : ""}</span><span>{formatDate(message.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p></div>)}</div></div>{selected.status !== "Closed" && <div><textarea rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={internalNote ? "Write an internal note..." : "Reply to the requester..."} className="w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><label className="inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={internalNote} onChange={(event) => setInternalNote(event.target.checked)} />Internal note</label><button type="button" disabled={saving || !reply.trim()} onClick={() => void send()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300"><Send className="h-4 w-4" />{internalNote ? "Add note" : "Send reply"}</button></div></div>}</div></div><aside className="space-y-5"><div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">Ticket controls</h2><label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-400">Status<select disabled={saving} value={selected.status} onChange={(event) => void updateStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700">{statuses.map((value) => <option key={value} value={value}>{displayStatus(value)}</option>)}</select></label><div className="mt-5 space-y-3 text-sm"><p><span className="text-slate-500">Category</span><span className="block font-semibold text-slate-900">{selected.category}</span></p><p><span className="text-slate-500">Due</span><span className={`block font-semibold ${selected.isOverdue ? "text-red-600" : "text-slate-900"}`}>{formatDate(selected.dueAt)}{selected.isOverdue ? " · Overdue" : ""}</span></p><p><span className="text-slate-500">Assigned admin</span><span className="block font-semibold text-slate-900">{selected.assignedAdminName || "Assigned when status changes"}</span></p></div></div><div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold">Status history</h2><div className="mt-4 space-y-4">{selected.statusHistory.map((entry, index) => <div key={`${entry.createdAt}-${index}`} className="border-l-2 border-blue-100 pl-3"><p className="text-sm font-semibold">{displayStatus(entry.toStatus)}</p><p className="text-xs text-slate-500">{entry.actorName} · {formatDate(entry.createdAt)}</p>{entry.note && <p className="mt-1 text-xs text-slate-600">{entry.note}</p>}</div>)}</div></div></aside></div></div>;

  const cards: MetricCard[] = [
    { label: "Open", value: metrics?.open ?? 0, icon: Headphones, style: "bg-indigo-50 text-indigo-600" },
    { label: "In Progress", value: metrics?.inProgress ?? 0, icon: MessageSquare, style: "bg-blue-50 text-blue-600" },
    { label: "Waiting", value: metrics?.waitingForRequester ?? 0, icon: Clock3, style: "bg-amber-50 text-amber-600" },
    { label: "Overdue", value: metrics?.overdue ?? 0, icon: TimerReset, style: "bg-red-50 text-red-600" },
    { label: "Resolved Today", value: metrics?.resolvedToday ?? 0, icon: CheckCircle2, style: "bg-emerald-50 text-emerald-600" },
  ];
  return <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8"><div><h1 className="text-2xl font-bold text-slate-950">Support Requests</h1><p className="mt-1 text-sm text-slate-500">Respond to owner requests and monitor the 24-hour first-response target.</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map(({ label, value, icon: Icon, style }) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${style}`}><Icon className="h-4 w-4" /></div><p className="mt-3 text-2xl font-bold">{value}</p><p className="text-xs text-slate-500">{label}</p></div>)}</div>{error && <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}<div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket, title, or requester email" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{displayStatus(value)}</option>)}</select></div>{loading ? <div className="p-14 text-center text-sm text-slate-500">Loading support queue...</div> : items.length === 0 ? <div className="p-14 text-center text-sm text-slate-500">No support requests match these filters.</div> : <div className="divide-y divide-slate-100">{items.map((item) => <button key={item.id} type="button" onClick={() => void open(item.id)} className="grid w-full gap-3 p-5 text-left transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_180px_130px] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-blue-600">{item.ticketCode}</span>{item.isOverdue && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">Overdue</span>}</div><p className="mt-1 font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.requesterName} · {item.requesterEmail} · {item.requesterRole}</p></div><div className="text-xs text-slate-500"><p className="font-semibold text-slate-700">{item.category}</p><p className="mt-1">Due {formatDate(item.dueAt)}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${tone(item.status)}`}>{displayStatus(item.status)}</span></button>)}</div>}</div></div>;
}
