"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useBooth } from "@/application/context/BoothContext";
import { promotionService, type Promotion, type PromotionPayload } from "@/application/features/promotions/promotionService";
import { useToast } from "@/presentation/components/shared/ToastContext";
import { ConfirmDialog } from "@/presentation/components/shared/ConfirmDialog";
import { getErrorMessage } from "@/shared/errors/errorMapper";

const emptyDraft: PromotionPayload = {
  title: "",
  promotionCode: "",
  description: "",
  discountType: "Percentage",
  scope: "EntireBoothOrder",
  discountValue: 10,
  minimumOrderAmount: null,
  maximumDiscountAmount: null,
  totalUsageLimit: null,
  usageLimitPerCustomer: null,
  isPublic: true,
  startDate: "",
  endDate: "",
  foodItemIds: [],
  categoryIds: [],
};

type StatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
};

type FieldErrors = Partial<Record<"title" | "discountValue" | "startDate" | "endDate", string>>;

const money = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
}).format(value);

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date(value));

const toLocalInputValue = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (normalized === "scheduled") return "bg-blue-50 text-blue-700 ring-blue-600/20";
  if (normalized === "expired") return "bg-slate-100 text-slate-600 ring-slate-500/20";
  return "bg-amber-50 text-amber-700 ring-amber-600/20";
};

export function Promotions() {
  const { showToast } = useToast();
  const { selectedBooth, loading: boothLoading } = useBooth();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<PromotionPayload>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = useCallback(async () => {
    if (!selectedBooth?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await promotionService.getByBooth(selectedBooth.id);
      setItems(response.data.items ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBooth?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalizedQuery
        || item.title.toLowerCase().includes(normalizedQuery)
        || (item.promotionCode ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === "Active").length,
    scheduled: items.filter((item) => item.status === "Scheduled").length,
    used: items.reduce((sum, item) => sum + item.usedCount, 0),
  }), [items]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setFieldErrors({});
    setError("");
    setFormOpen(true);
  };

  const openEdit = (item: Promotion) => {
    setEditing(item);
    setDraft({
      promotionCode: item.promotionCode ?? "",
      title: item.title,
      description: item.description ?? "",
      discountType: item.discountType,
      scope: item.scope,
      discountValue: item.discountValue,
      minimumOrderAmount: item.minimumOrderAmount ?? null,
      maximumDiscountAmount: item.maximumDiscountAmount ?? null,
      totalUsageLimit: item.totalUsageLimit ?? null,
      usageLimitPerCustomer: item.usageLimitPerCustomer ?? null,
      isPublic: item.isPublic,
      startDate: toLocalInputValue(item.startDate),
      endDate: toLocalInputValue(item.endDate),
      foodItemIds: item.foodItems.map((food) => food.foodItemId),
      categoryIds: item.categories.map((category) => category.categoryId),
    });
    setFieldErrors({});
    setError("");
    setFormOpen(true);
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (!draft.title.trim()) next.title = "Enter a promotion title.";
    if (!Number.isFinite(draft.discountValue) || draft.discountValue <= 0) next.discountValue = "Discount must be greater than 0.";
    if (draft.discountType === "Percentage" && draft.discountValue > 100) next.discountValue = "Percentage discount cannot exceed 100%.";
    if (!draft.startDate) next.startDate = "Select a start date and time.";
    if (!draft.endDate) next.endDate = "Select an end date and time.";
    if (draft.startDate && draft.endDate && new Date(draft.endDate) <= new Date(draft.startDate)) next.endDate = "End date must be later than start date.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!selectedBooth?.id || !validate()) return;
    const savingKey = editing?.id ?? "create";
    setSavingId(savingKey);
    setError("");
    const payload: PromotionPayload = {
      ...draft,
      title: draft.title.trim(),
      promotionCode: draft.promotionCode?.trim() || null,
      description: draft.description?.trim() || null,
    };
    try {
      if (editing) await promotionService.update(editing.id, payload);
      else await promotionService.create(selectedBooth.id, payload);
      setFormOpen(false);
      setEditing(null);
      showToast("success", editing ? "The promotion has been updated." : "The promotion has been created.");
      await load();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingId(null);
    }
  };

  const toggle = async (item: Promotion) => {
    setSavingId(item.id);
    setError("");
    try {
      if (item.status === "Active") await promotionService.deactivate(item.id);
      else await promotionService.activate(item.id);
      showToast("success", item.status === "Active" ? "The promotion has been paused." : "The promotion is now active.");
      await load();
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setSavingId(null);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSavingId(deleteTarget.id);
    try {
      await promotionService.delete(deleteTarget.id);
      setDeleteTarget(null);
      showToast("success", "The promotion has been deleted.");
      await load();
    } catch (deleteError) {
      showToast("error", getErrorMessage(deleteError));
    } finally {
      setSavingId(null);
    }
  };

  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-5 pb-12 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"><Sparkles className="h-3.5 w-3.5" />Grow your booth</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Promotions</h1>
          <p className="mt-1 text-sm text-slate-500">Create clear, time-limited offers for your customers.</p>
        </div>
        <button type="button" disabled={!selectedBooth} onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Plus className="h-4 w-4" />Create Promotion</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { label: "Total", value: stats.total, icon: Tag, tone: "bg-indigo-50 text-indigo-600" },
          { label: "Active", value: stats.active, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
          { label: "Scheduled", value: stats.scheduled, icon: CalendarDays, tone: "bg-blue-50 text-blue-600" },
          { label: "Total uses", value: stats.used, icon: Clock3, tone: "bg-amber-50 text-amber-600" },
        ] satisfies StatCard[]).map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></div>
            <p className="text-2xl font-bold text-slate-950">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {error && <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span className="inline-flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</span><button type="button" onClick={() => setError("")}><X className="h-4 w-4" /></button></div>}

      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or voucher code" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500">
            {['All', 'Active', 'Scheduled', 'Inactive', 'Expired'].map((status) => <option key={status} value={status}>{status === 'All' ? 'All statuses' : status}</option>)}
          </select>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-xs uppercase tracking-wide text-slate-400"><th className="px-5 py-3 font-semibold">Promotion</th><th className="px-5 py-3 font-semibold">Discount</th><th className="px-5 py-3 font-semibold">Period</th><th className="px-5 py-3 font-semibold">Usage</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {(loading || boothLoading) && <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Loading promotions...</td></tr>}
              {!loading && !boothLoading && filteredItems.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500"><Tag className="mx-auto mb-3 h-9 w-9 text-slate-300" />{selectedBooth ? "No promotions match your filters." : "No booth is assigned to this account."}</td></tr>}
              {!loading && !boothLoading && filteredItems.map((item) => {
                const percentage = item.totalUsageLimit ? Math.min(100, item.usedCount / item.totalUsageLimit * 100) : 0;
                return <tr key={item.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.promotionCode || "No voucher code"}</p></td><td className="px-5 py-4 font-semibold text-indigo-700">{item.discountType === "Percentage" ? `${item.discountValue}%` : money(item.discountValue)}</td><td className="px-5 py-4 text-xs text-slate-600">{formatDate(item.startDate)}<span className="mx-1 text-slate-300">to</span>{formatDate(item.endDate)}</td><td className="px-5 py-4"><p className="text-xs font-medium text-slate-700">{item.usedCount}{item.totalUsageLimit ? ` / ${item.totalUsageLimit}` : " uses"}</p>{item.totalUsageLimit && <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${percentage}%` }} /></div>}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(item.status)}`}>{item.status}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" aria-label={`Edit ${item.title}`} onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"><Edit3 className="h-4 w-4" /></button><button type="button" disabled={savingId === item.id} onClick={() => void toggle(item)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">{item.status === "Active" ? "Pause" : "Activate"}</button><button type="button" aria-label={`Delete ${item.title}`} disabled={savingId === item.id} onClick={() => setDeleteTarget(item)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td></tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {filteredItems.map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.promotionCode || "No voucher code"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(item.status)}`}>{item.status}</span></div><p className="mt-4 text-xl font-bold text-indigo-700">{item.discountType === "Percentage" ? `${item.discountValue}% off` : money(item.discountValue)}</p><p className="mt-2 text-xs text-slate-500">{formatDate(item.startDate)} to {formatDate(item.endDate)}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => openEdit(item)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Edit</button><button type="button" onClick={() => void toggle(item)} className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold">{item.status === "Active" ? "Pause" : "Activate"}</button></div></div>)}
        </div>
      </div>

      {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur"><div><h2 className="text-lg font-bold text-slate-950">{editing ? "Edit promotion" : "Create promotion"}</h2><p className="mt-1 text-xs text-slate-500">Set a clear discount and availability period.</p></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="grid gap-5 p-6 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Title<input value={draft.title} onChange={(event) => { setDraft({ ...draft, title: event.target.value }); setFieldErrors({ ...fieldErrors, title: undefined }); }} className={inputClass} placeholder="Weekend special" />{fieldErrors.title && <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.title}</span>}</label>
        <label className="text-sm font-medium text-slate-700">Voucher code<input value={draft.promotionCode ?? ""} onChange={(event) => setDraft({ ...draft, promotionCode: event.target.value.toUpperCase() })} className={inputClass} placeholder="WEEKEND20" /></label>
        <label className="text-sm font-medium text-slate-700">Discount type<select value={draft.discountType} onChange={(event) => setDraft({ ...draft, discountType: event.target.value as PromotionPayload["discountType"] })} className={inputClass}><option value="Percentage">Percentage</option><option value="FixedAmount">Fixed amount</option></select></label>
        <label className="text-sm font-medium text-slate-700">Discount value<input type="number" min="0.01" value={draft.discountValue} onChange={(event) => { setDraft({ ...draft, discountValue: Number(event.target.value) }); setFieldErrors({ ...fieldErrors, discountValue: undefined }); }} className={inputClass} />{fieldErrors.discountValue && <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.discountValue}</span>}</label>
        <label className="text-sm font-medium text-slate-700">Minimum order<input type="number" min="0" value={draft.minimumOrderAmount ?? ""} onChange={(event) => setDraft({ ...draft, minimumOrderAmount: event.target.value ? Number(event.target.value) : null })} className={inputClass} placeholder="Optional" /></label>
        <label className="text-sm font-medium text-slate-700">Total usage limit<input type="number" min="1" value={draft.totalUsageLimit ?? ""} onChange={(event) => setDraft({ ...draft, totalUsageLimit: event.target.value ? Number(event.target.value) : null })} className={inputClass} placeholder="Unlimited" /></label>
        <label className="text-sm font-medium text-slate-700">Usage per customer<input type="number" min="1" value={draft.usageLimitPerCustomer ?? ""} onChange={(event) => setDraft({ ...draft, usageLimitPerCustomer: event.target.value ? Number(event.target.value) : null })} className={inputClass} placeholder="Unlimited" /></label>
        <label className="text-sm font-medium text-slate-700">Start date<input type="datetime-local" value={draft.startDate} onChange={(event) => { setDraft({ ...draft, startDate: event.target.value }); setFieldErrors({ ...fieldErrors, startDate: undefined }); }} className={inputClass} />{fieldErrors.startDate && <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.startDate}</span>}</label>
        <label className="text-sm font-medium text-slate-700">End date<input type="datetime-local" value={draft.endDate} onChange={(event) => { setDraft({ ...draft, endDate: event.target.value }); setFieldErrors({ ...fieldErrors, endDate: undefined }); }} className={inputClass} />{fieldErrors.endDate && <span className="mt-1.5 block text-xs text-red-600">{fieldErrors.endDate}</span>}</label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description<textarea rows={3} value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className={inputClass} placeholder="Explain the offer in a few words." /></label>
      </div>{error && <div className="mx-6 mb-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" disabled={savingId === (editing?.id ?? "create")} onClick={() => void save()} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{savingId === (editing?.id ?? "create") ? "Saving..." : editing ? "Save changes" : "Create promotion"}</button></div></div></div>}

      <ConfirmDialog open={!!deleteTarget} title="Delete Promotion" message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`} confirmLabel="Delete" confirmStyle="danger" loading={!!savingId && deleteTarget?.id === savingId} onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
