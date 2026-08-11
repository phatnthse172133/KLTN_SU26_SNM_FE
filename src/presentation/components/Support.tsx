"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Clock3, FileText, Headphones, MessageSquare, Paperclip, Plus, Send, UploadCloud, X } from "lucide-react";
import { supportService, type SupportTicketDetail, type SupportTicketListItem } from "@/application/features/support/supportService";
import { getErrorMessage } from "@/shared/errors/errorMapper";
import { resolveMediaUrl } from "@/shared/utils";
import { useJoinSupportTicket, useOnReconnect } from "@/infrastructure/realtime";

const categories = [
  ["Account", "Account"], ["Subscription", "Subscription"], ["Payment", "Payment"], ["Booth", "Booth"],
  ["NightMarket", "Night Market"], ["LayoutAssignment", "Layout & Assignment"], ["Menu", "Menu"],
  ["Order", "Order"], ["Promotion", "Promotion"], ["TechnicalIssue", "Technical Issue"], ["Other", "Other"],
];
const badge = (status: string) => status === "Resolved" ? "bg-emerald-50 text-emerald-700" : status === "Rejected" ? "bg-red-50 text-red-700" : status === "InProgress" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700";
const displayStatus = (status: string) => status.replace(/([a-z])([A-Z])/g, "$1 $2");
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function Support({ boothId = null }: { boothId?: string | null }) {
  const [tickets, setTickets] = useState<SupportTicketListItem[]>([]);
  const [selected, setSelected] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("TechnicalIssue");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await supportService.getMine(); setTickets(response.items ?? []); }
    catch (loadError) { setError(getErrorMessage(loadError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Join support ticket group when viewing a ticket detail
  useJoinSupportTicket(selected?.id ?? null);

  // Listen for realtime support events to refresh
  useEffect(() => {
    const onRealtimeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const type: string = detail.eventType;
      if (type === "SupportTicketCreated" || type === "SupportTicketReplied" ||
          type === "SupportTicketStatusChanged" || type === "SupportAttachmentAdded") {
        void load();
        if (selected?.id) void openDetail(selected.id);
      }
    };
    window.addEventListener("realtime:event", onRealtimeEvent);
    return () => window.removeEventListener("realtime:event", onRealtimeEvent);
  }, [load, selected?.id]);

  // On reconnect, refresh data
  useOnReconnect(() => {
    void load();
    if (selected?.id) void openDetail(selected.id);
  });

  const openDetail = async (id: string) => {
    setError("");
    try { setSelected(await supportService.getMineDetail(id)); }
    catch (detailError) { setError(getErrorMessage(detailError)); }
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 5) next.title = "Enter a title with at least 5 characters.";
    if (description.trim().length < 10) next.description = "Describe the issue with at least 10 characters.";
    if (files.length > 5) next.files = "You can attach up to 5 evidence files.";
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true); setError("");
    try {
      const created = await supportService.create({ title: title.trim(), category, description: description.trim(), boothId, pageUrl: window.location.href });
      for (const file of files) await supportService.uploadMine(created.id, file);
      setTitle(""); setDescription(""); setFiles([]); setFormOpen(false);
      await load(); await openDetail(created.id);
    } catch (submitError) { setError(getErrorMessage(submitError)); }
    finally { setSaving(false); }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    try { setSelected(await supportService.replyMine(selected.id, reply.trim())); setReply(""); await load(); }
    catch (replyError) { setError(getErrorMessage(replyError)); }
    finally { setSaving(false); }
  };

  if (selected) return <div className="mx-auto max-w-5xl space-y-5 p-5 sm:p-8"><button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Back to support requests</button><div className="rounded-3xl border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]"><div className="border-b border-slate-100 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{selected.ticketCode}</p><h1 className="mt-2 text-2xl font-bold text-slate-950">{selected.title}</h1><p className="mt-2 text-sm text-slate-500">Created {formatDate(selected.createdAt)} · Reply expected within 24 hours</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${badge(selected.status)}`}>{displayStatus(selected.status)}</span></div></div><div className="space-y-6 p-6"><div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Issue description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.description}</p></div>{selected.attachments.length > 0 && <div><h2 className="text-sm font-bold text-slate-900">Evidence</h2><div className="mt-3 flex flex-wrap gap-2">{selected.attachments.map((file) => <a key={file.id} href={resolveMediaUrl(file.fileUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-700"><FileText className="h-4 w-4" />{file.originalFileName}</a>)}</div></div>}<div><h2 className="text-sm font-bold text-slate-900">Conversation</h2><div className="mt-3 space-y-3">{selected.messages.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No replies yet. Our team will respond within 24 hours.</p> : selected.messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-2xl p-4 ${message.senderRole === "Admin" ? "bg-indigo-50 text-indigo-950" : "ml-auto bg-slate-900 text-white"}`}><div className="flex items-center justify-between gap-4 text-xs font-semibold opacity-70"><span>{message.senderName}</span><span>{formatDate(message.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p></div>)}</div></div>{selected.status !== "Closed" && <div className="flex gap-3"><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Add more information or reply to Support..." className="min-w-0 flex-1 rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /><button type="button" disabled={saving || !reply.trim()} onClick={() => void sendReply()} className="self-end rounded-xl bg-indigo-600 p-3 text-white hover:bg-indigo-700 disabled:bg-slate-300"><Send className="h-5 w-5" /></button></div>}</div></div></div>;

  return <div className="mx-auto max-w-7xl space-y-6 p-5 pb-12 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"><Headphones className="h-3.5 w-3.5" />Help center</div><h1 className="text-2xl font-bold text-slate-950">Support</h1><p className="mt-1 text-sm text-slate-500">Send an issue with evidence. Our team responds within 24 hours.</p></div><button type="button" onClick={() => setFormOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />New support request</button></div>{error && <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" />{error}</div>}<div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">{loading ? <div className="p-14 text-center text-sm text-slate-500">Loading support requests...</div> : tickets.length === 0 ? <div className="p-14 text-center"><MessageSquare className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-semibold text-slate-900">No support requests yet</h2><p className="mt-1 text-sm text-slate-500">Create a request when you need help from an administrator.</p></div> : <div className="divide-y divide-slate-100">{tickets.map((ticket) => <button type="button" key={ticket.id} onClick={() => void openDetail(ticket.id)} className="flex w-full flex-col gap-3 p-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-indigo-600">{ticket.ticketCode}</span>{ticket.isOverdue && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">Overdue</span>}</div><p className="mt-1 font-semibold text-slate-900">{ticket.title}</p><p className="mt-1 text-xs text-slate-500">{ticket.category} · Updated {formatDate(ticket.updatedAt)}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${badge(ticket.status)}`}>{displayStatus(ticket.status)}</span><Clock3 className="h-4 w-4 text-slate-300" /></div></button>)}</div>}</div>
    {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold text-slate-950">New support request</h2><p className="mt-1 text-xs text-slate-500">Include evidence so we can help faster.</p></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="space-y-5 p-6"><label className="block text-sm font-semibold text-slate-700">Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Briefly describe what you need help with" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />{fieldErrors.title && <span className="mt-1 block text-xs text-red-600">{fieldErrors.title}</span>}</label><label className="block text-sm font-semibold text-slate-700">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Description<textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain the issue and what you were trying to do." className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />{fieldErrors.description && <span className="mt-1 block text-xs text-red-600">{fieldErrors.description}</span>}</label><label className="block rounded-2xl border border-dashed border-slate-300 p-5 text-center hover:border-indigo-400"><UploadCloud className="mx-auto h-7 w-7 text-indigo-500" /><span className="mt-2 block text-sm font-semibold text-slate-700">Add evidence</span><span className="mt-1 block text-xs text-slate-500">JPG, PNG, WEBP or PDF · up to 5 files</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /></label>{files.length > 0 && <div className="space-y-2">{files.map((file) => <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="inline-flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{file.name}</span></span><button type="button" onClick={() => setFiles(files.filter((item) => item !== file))}><X className="h-4 w-4 text-slate-400" /></button></div>)}</div>}{fieldErrors.files && <p className="text-xs text-red-600">{fieldErrors.files}</p>}</div><div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="button" disabled={saving} onClick={() => void submit()} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "Sending..." : "Send request"}</button></div></div></div>}
  </div>;
}
