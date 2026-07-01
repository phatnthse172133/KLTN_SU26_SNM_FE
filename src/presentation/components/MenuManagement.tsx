"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Edit2, Plus, Search, Star, Trash2, X } from "lucide-react";
import { useBooth } from "@/application/context/BoothContext";
import { foodCategoryService } from "@/application/features/menu/foodCategoryService";
import { menuService } from "@/application/features/menu/menuService";
import { priceService, type PriceResponse } from "@/application/features/prices/priceService";
import type { FoodCategory, FoodItem } from "@/shared/types";
import { ImageWithFallback } from "./ImageWithFallback";
import { Pagination } from "./Pagination";

type MenuDraft = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  thumbnailUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  salePrice: string;
  saleStart: string;
  saleEnd: string;
};

const emptyDraft: MenuDraft = { categoryId: "", name: "", description: "", price: "", thumbnailUrl: "", isAvailable: true, isFeatured: false, salePrice: "", saleStart: "", saleEnd: "" };
const formatVND = (value: number) => `${value.toLocaleString()} VND`;

export function MenuManagement() {
  const { selectedBooth, loading: boothLoading } = useBooth();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceResponse[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detailItem, setDetailItem] = useState<FoodItem | null>(null);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<MenuDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    if (!selectedBooth?.id) { setItems([]); setCategories([]); setPrices({}); return; }
    setLoading(true);
    try {
      const [menuResponse, categoryResponse] = await Promise.all([menuService.getMenu(selectedBooth.id), foodCategoryService.getAllCategories(selectedBooth.id)]);
      const menuItems = menuResponse.data.items ?? [];
      setItems(menuItems);
      setCategories(categoryResponse.data.items ?? []);
      const priceEntries = await Promise.all(menuItems.map(async (item) => {
        try { const response = await priceService.getFoodPrices(selectedBooth.id, item.id); return [item.id, response.data.items ?? []] as const; }
        catch { return [item.id, []] as const; }
      }));
      setPrices(Object.fromEntries(priceEntries));
    } catch (loadError) {
      setItems([]); setCategories([]); setPrices({});
      setError(loadError instanceof Error ? loadError.message : "Failed to load menu data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadData(); }, [selectedBooth?.id]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesSearch = `${item.name} ${item.description ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || item.categoryId === categoryFilter;
    const matchesStatus = statusFilter === "All" || (statusFilter === "Available" && item.isAvailable) || (statusFilter === "Unavailable" && !item.isAvailable);
    return matchesSearch && matchesCategory && matchesStatus;
  }), [items, searchTerm, categoryFilter, statusFilter]);
  const safePage = Math.min(currentPage, Math.max(1, Math.ceil(filteredItems.length / itemsPerPage)));
  const visibleItems = filteredItems.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const getSale = (itemId: string) => prices[itemId]?.[0] ?? null;
  const openAdd = () => { setEditingItem(null); setDraft({ ...emptyDraft, categoryId: categories[0]?.id ?? "" }); setError(""); setShowForm(true); };
  const openEdit = (item: FoodItem) => { const sale = getSale(item.id); setEditingItem(item); setDraft({ categoryId: item.categoryId, name: item.name, description: item.description ?? "", price: String(item.price), thumbnailUrl: item.thumbnailUrl ?? "", isAvailable: item.isAvailable, isFeatured: item.isFeatured, salePrice: sale ? String(sale.price) : "", saleStart: sale?.startDate?.slice(0,10) ?? "", saleEnd: sale?.endDate?.slice(0,10) ?? "" }); setError(""); setShowForm(true); };

  const saveItem = async () => {
    if (!selectedBooth?.id) return;
    if (!draft.categoryId || !draft.name.trim() || Number(draft.price) <= 0) { setError("Category, item name, and a valid price are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = { categoryId: draft.categoryId, name: draft.name.trim(), description: draft.description.trim() || null, price: Number(draft.price), thumbnailUrl: draft.thumbnailUrl.trim() || null, isAvailable: draft.isAvailable, isFeatured: draft.isFeatured };
      const response = editingItem ? await menuService.updateFoodItem(selectedBooth.id, editingItem.id, payload) : await menuService.createFoodItem(selectedBooth.id, payload);
      const foodItemId = response.data.id;
      if (Number(draft.salePrice) > 0) {
        const pricePayload = { price: Number(draft.salePrice), startDate: draft.saleStart || null, endDate: draft.saleEnd || null };
        const existingPrice = editingItem ? getSale(editingItem.id) : null;
        if (existingPrice) await priceService.updateFoodPrice(selectedBooth.id, foodItemId, existingPrice.id, pricePayload);
        else await priceService.createFoodPrice(selectedBooth.id, foodItemId, pricePayload);
      }
      setShowForm(false); setNotice(editingItem ? "Menu item updated." : "Menu item created."); await loadData();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Failed to save menu item."); }
    finally { setSaving(false); }
  };

  const toggleAvailability = async (item: FoodItem) => { if (!selectedBooth?.id) return; try { await menuService.updateAvailability(selectedBooth.id, item.id, !item.isAvailable); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isAvailable: !entry.isAvailable } : entry)); } catch (toggleError) { setError(toggleError instanceof Error ? toggleError.message : "Failed to update availability."); } };
  const deleteItem = async (item: FoodItem) => { if (!selectedBooth?.id || !window.confirm(`Delete ${item.name}?`)) return; try { await menuService.deleteFoodItem(selectedBooth.id, item.id); if (detailItem?.id === item.id) setDetailItem(null); setNotice("Menu item deleted."); await loadData(); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Failed to delete menu item."); } };

  if (detailItem) {
    const sale = getSale(detailItem.id);
    return <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6"><button onClick={() => setDetailItem(null)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"><ChevronLeft className="w-4 h-4" /> Back to Menu</button><div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden"><div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">{detailItem.thumbnailUrl ? <ImageWithFallback src={detailItem.thumbnailUrl} alt={detailItem.name} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400">No image from API</div>}</div><div><div className="flex flex-wrap items-center gap-2"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{detailItem.categoryName ?? "No category data"}</span>{detailItem.isFeatured && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">Featured</span>}<span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${detailItem.isAvailable?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-600"}`}>{detailItem.isAvailable?"Available":"Unavailable"}</span></div><h2 className="text-2xl font-black text-gray-900 mt-4">{detailItem.name}</h2><p className="text-sm text-gray-600 mt-3 leading-6">{detailItem.description || "No data from API"}</p><div className="grid grid-cols-2 gap-4 mt-6"><div className="border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Regular Price</p><p className="text-lg font-bold text-gray-900 mt-1">{formatVND(detailItem.price)}</p></div><div className="border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Sale Price</p><p className="text-lg font-bold text-emerald-600 mt-1">{sale ? formatVND(sale.price) : "No data"}</p></div><div className="border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Sold Today</p><p className="text-lg font-bold text-gray-900 mt-1">No data</p></div><div className="border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Featured</p><p className="text-lg font-bold text-gray-900 mt-1">{detailItem.isFeatured ? "Yes" : "No"}</p></div></div><div className="flex gap-3 mt-6"><button onClick={() => openEdit(detailItem)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium"><Edit2 className="w-4 h-4" />Edit Item</button><button onClick={() => deleteItem(detailItem)} className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium"><Trash2 className="w-4 h-4" />Delete</button></div></div></div></div>{showForm && renderForm()}</div>;
  }

  function renderForm() {
    return <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center p-6"><div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"><div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-900">{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h3><button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div><div className="p-6 space-y-4">{error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="text-sm font-medium text-gray-700">Item Name<input value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5" /></label><label className="text-sm font-medium text-gray-700">Category<select value={draft.categoryId} onChange={(e)=>setDraft({...draft,categoryId:e.target.value})} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white"><option value="">Select category</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div><label className="text-sm font-medium text-gray-700 block">Description<textarea value={draft.description} onChange={(e)=>setDraft({...draft,description:e.target.value})} rows={3} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 resize-none" /></label><label className="text-sm font-medium text-gray-700 block">Image URL<input value={draft.thumbnailUrl} onChange={(e)=>setDraft({...draft,thumbnailUrl:e.target.value})} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5" /></label><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><label className="text-sm font-medium text-gray-700">Regular Price<input type="number" value={draft.price} onChange={(e)=>setDraft({...draft,price:e.target.value})} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5" /></label><label className="text-sm font-medium text-gray-700">Sale Price<input type="number" value={draft.salePrice} onChange={(e)=>setDraft({...draft,salePrice:e.target.value})} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5" /></label><div className="flex items-end gap-4 pb-2"><label className="inline-flex gap-2 text-sm"><input type="checkbox" checked={draft.isAvailable} onChange={(e)=>setDraft({...draft,isAvailable:e.target.checked})} />Available</label><label className="inline-flex gap-2 text-sm"><input type="checkbox" checked={draft.isFeatured} onChange={(e)=>setDraft({...draft,isFeatured:e.target.checked})} />Featured</label></div></div><div className="grid grid-cols-2 gap-4"><label className="text-sm font-medium text-gray-700">Sale Start<input type="date" value={draft.saleStart} onChange={(e)=>setDraft({...draft,saleStart:e.target.value})} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5" /></label><label className="text-sm font-medium text-gray-700">Sale End<input type="date" value={draft.saleEnd} onChange={(e)=>setDraft({...draft,saleEnd:e.target.value})} className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5" /></label></div></div><div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3"><button onClick={()=>setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button><button disabled={saving} onClick={saveItem} className="px-5 py-2.5 bg-indigo-600 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium">{saving?"Saving...":"Save Item"}</button></div></div></div>;
  }

  return <div className="p-8 pb-12 max-w-7xl mx-auto space-y-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h2 className="text-2xl font-bold text-gray-900">Menu Management</h2><p className="text-sm text-gray-500 mt-1">Manage items, descriptions, availability and sale pricing</p></div><button onClick={openAdd} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm"><Plus className="w-5 h-5" />Add Item</button></div>{(error||notice)&&<div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${error?"bg-red-50 border border-red-200 text-red-700":"bg-emerald-50 border border-emerald-200 text-emerald-700"}`}><span className="inline-flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error||notice}</span><button onClick={()=>{setError("");setNotice("");}}><X className="w-4 h-4" /></button></div>}<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] space-y-4"><div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><button onClick={()=>{setCategoryFilter("All");setCurrentPage(1);}} className={`px-3 py-2 rounded-lg text-sm font-medium ${categoryFilter==="All"?"bg-indigo-600 text-white":"bg-gray-50 text-gray-600"}`}>All Items <span className="ml-2 text-xs opacity-70">{items.length}</span></button>{categories.map((category)=><button key={category.id} onClick={()=>{setCategoryFilter(category.id);setCurrentPage(1);}} className={`px-3 py-2 rounded-lg text-sm font-medium ${categoryFilter===category.id?"bg-indigo-600 text-white":"bg-gray-50 text-gray-600"}`}>{category.name}<span className="ml-2 text-xs opacity-70">{items.filter((item)=>item.categoryId===category.id).length}</span></button>)}</div><div className="relative w-full lg:w-80"><Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={searchTerm} onChange={(e)=>{setSearchTerm(e.target.value);setCurrentPage(1);}} placeholder="Search menu items..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" /></div></div><div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">{["All","Available","Unavailable"].map((status)=><button key={status} onClick={()=>{setStatusFilter(status);setCurrentPage(1);}} className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusFilter===status?"bg-emerald-100 text-emerald-700":"bg-gray-50 text-gray-600"}`}>{status}<span className="ml-1 text-xs opacity-70">{status==="All"?items.length:items.filter((item)=>status==="Available"?item.isAvailable:!item.isAvailable).length}</span></button>)}</div></div><div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-5 py-3">Item</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Sale Price</th><th className="px-5 py-3">Sold Today</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{loading||boothLoading?<tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">Loading data from API...</td></tr>:visibleItems.length===0?<tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">No data from API</td></tr>:visibleItems.map((item)=>{const sale=getSale(item.id);return <tr key={item.id} className="hover:bg-gray-50"><td className="px-5 py-3"><div className="flex items-center gap-3 min-w-[220px]"><div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">{item.thumbnailUrl?<ImageWithFallback src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />:<div className="h-full flex items-center justify-center text-[10px] text-gray-400">No image</div>}</div><div className="min-w-0"><div className="flex items-center gap-1.5"><p className="font-bold text-gray-900 truncate">{item.name}</p>{item.isFeatured&&<Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}</div><p className="text-xs text-gray-400 truncate max-w-[200px]">{item.description||"No data from API"}</p></div></div></td><td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{item.categoryName||"No category"}</span></td><td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{formatVND(item.price)}</td><td className="px-5 py-3">{sale?<div><p className="font-bold text-emerald-600 whitespace-nowrap">{formatVND(sale.price)}</p><p className="text-xs text-gray-400 whitespace-nowrap">{sale.startDate?.slice(0,10)||"No start"} to {sale.endDate?.slice(0,10)||"No end"}</p></div>:<span className="text-gray-400 text-xs">No data</span>}</td><td className="px-5 py-3 text-gray-500">No data</td><td className="px-5 py-3"><button onClick={()=>toggleAvailability(item)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${item.isAvailable?"bg-emerald-500":"bg-gray-300"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white ${item.isAvailable?"translate-x-6":"translate-x-1"}`} /></button></td><td className="px-5 py-3"><div className="flex justify-end gap-1"><button onClick={()=>setDetailItem(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><ChevronRight className="w-4 h-4" /></button><button onClick={()=>openEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={()=>deleteItem(item)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td></tr>;})}</tbody></table><Pagination currentPage={safePage} totalItems={filteredItems.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(size)=>{setItemsPerPage(size);setCurrentPage(1);}} /></div>{showForm&&renderForm()}</div>;
}
