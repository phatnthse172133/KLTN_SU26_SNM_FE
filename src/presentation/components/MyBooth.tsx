"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  FileCheck,
  Image,
  MapPin,
  Pencil,
  Phone,
  Save,
  Star,
  Store,
  X,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { useBooth } from "@/application/context/BoothContext";
import { boothService } from "@/application/features/booth/boothService";
import type { Booth } from "@/shared/types";

const NO_DATA = "No data available";

type BoothDraft = {
  boothName: string;
  description: string;
  phoneNumber: string;
  thumbnailUrl: string;
  openTime: string;
  closeTime: string;
};

const emptyDraft: BoothDraft = {
  boothName: "",
  description: "",
  phoneNumber: "",
  thumbnailUrl: "",
  openTime: "",
  closeTime: "",
};

const getStatusBadge = (status?: string | null) => {
  switch ((status ?? "").toLowerCase()) {
    case "active":
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const toDraft = (booth: Booth | null): BoothDraft => ({
  boothName: booth?.boothName ?? "",
  description: booth?.description ?? "",
  phoneNumber: booth?.phoneNumber ?? "",
  thumbnailUrl: booth?.thumbnailUrl ?? "",
  openTime: booth?.openTime ?? "",
  closeTime: booth?.closeTime ?? "",
});

const display = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return NO_DATA;
  return String(value);
};

export function MyBooth() {
  const { selectedBooth, loading, refreshBooths } = useBooth();
  const [draftBooth, setDraftBooth] = useState<BoothDraft>(emptyDraft);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftBooth(toDraft(selectedBooth));
    setNotice("");
    setError("");
  }, [selectedBooth]);

  const boothImages = useMemo(() => {
    return selectedBooth?.thumbnailUrl ? [selectedBooth.thumbnailUrl] : [];
  }, [selectedBooth?.thumbnailUrl]);

  const openEdit = () => {
    setDraftBooth(toDraft(selectedBooth));
    setError("");
    setIsEditOpen(true);
  };

  const saveBooth = async () => {
    if (!selectedBooth?.id) return;
    setSaving(true);
    setError("");
    try {
      await boothService.updateMyBooth(selectedBooth.id, {
        boothName: draftBooth.boothName,
        description: draftBooth.description || null,
        phoneNumber: draftBooth.phoneNumber || null,
        thumbnailUrl: draftBooth.thumbnailUrl || null,
        openTime: draftBooth.openTime || null,
        closeTime: draftBooth.closeTime || null,
      });
      await refreshBooths();
      setIsEditOpen(false);
      setNotice("Booth information updated successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update booth.");
    } finally {
      setSaving(false);
    }
  };

  const details = [
    { label: "Night Market", value: selectedBooth?.nightMarketId, icon: MapPin },
    { label: "Market Zone", value: selectedBooth?.zoneId, icon: MapPin },
    { label: "Phone Number", value: selectedBooth?.phoneNumber, icon: Phone },
    {
      label: "Opening Hours",
      value: selectedBooth?.openTime || selectedBooth?.closeTime
        ? `${selectedBooth.openTime || "No data"} - ${selectedBooth.closeTime || "No data"}`
        : null,
      icon: Clock,
    },
    {
      label: "Map Position",
      value: selectedBooth?.mapPositionX !== null && selectedBooth?.mapPositionX !== undefined
        ? `X ${selectedBooth.mapPositionX}, Y ${selectedBooth.mapPositionY ?? "No data"}`
        : null,
      icon: MapPin,
    },
    { label: "Average Rating", value: selectedBooth?.averageRating, icon: Star },
    { label: "Featured Booth", value: selectedBooth ? (selectedBooth.isFeatured ? "Yes" : "No") : null, icon: Store },
  ];

  if (loading) {
    return (
      <div className="p-8 pb-12 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          Loading data...
        </div>
      </div>
    );
  }

  if (!selectedBooth) {
    return (
      <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Booth</h2>
          <p className="text-sm text-gray-500 mt-1">Manage booth profile, location, hours, package, and verification</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-12 text-center">
          <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">{NO_DATA}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Booth</h2>
          <p className="text-sm text-gray-500 mt-1">Manage booth profile, location, hours, package, and verification</p>
        </div>
        <button
          onClick={openEdit}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Pencil className="w-4 h-4" />
          Edit Booth
        </button>
      </div>

      {(notice || error) && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium ${error ? "bg-red-50 border border-red-200 text-red-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>
          <span className="inline-flex items-center gap-2">
            {error ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {error || notice}
          </span>
          <button onClick={() => { setNotice(""); setError(""); }} className="hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="h-64 bg-gray-100 relative">
          {selectedBooth.thumbnailUrl ? (
            <ImageWithFallback
              src={selectedBooth.thumbnailUrl}
              alt={selectedBooth.boothName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-400">{NO_DATA}</div>
          )}
          <div className="absolute left-6 bottom-6 flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <Store className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-white drop-shadow-sm">{display(selectedBooth.boothName)}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedBooth.status)}`}>
                  {display(selectedBooth.status)}
                </span>
              </div>
              <p className="text-sm font-medium text-white/90 drop-shadow-sm">Booth {display(selectedBooth.boothCode ?? selectedBooth.slotNumber)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">Booth Description</h4>
              <p className="text-sm text-gray-600 leading-6">{display(selectedBooth.description)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {details.map((item) => (
                <div key={item.label} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <item.icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{display(item.value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-base font-bold text-gray-900 mb-4">Zone Layout</h4>
              <div className="relative rounded-xl border-4 border-indigo-200 bg-white min-h-[280px] flex items-center justify-center">
                <div className="absolute -top-4 left-5 bg-indigo-600 text-white px-5 py-2 rounded-xl shadow-sm font-bold">
                  Zone {display(selectedBooth.zoneId)}
                </div>
                <div className="text-center px-6">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">{NO_DATA}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-gray-900">Booth Images</h4>
                <button
                  onClick={() => setIsImageManagerOpen(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Image className="w-4 h-4" />
                  Manage Images
                </button>
              </div>
              {boothImages.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg py-10 text-center text-sm text-gray-500">{NO_DATA}</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {boothImages.map((src, index) => (
                    <div key={src} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-indigo-500 ring-2 ring-indigo-100">
                      <ImageWithFallback src={src} alt={`Booth image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-5">
              <h4 className="text-base font-bold text-gray-900 mb-4">Subscription</h4>
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-gray-500">Package</span>
                  <span className="text-sm font-medium text-gray-900">{NO_DATA}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-gray-500">Expires</span>
                  <span className="text-sm font-medium text-gray-900">{NO_DATA}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-gray-900">Documents</h4>
                <FileCheck className="w-5 h-5 text-gray-400" />
              </div>
              <div className="py-6 text-center text-sm text-gray-500">{NO_DATA}</div>
            </div>

          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Edit Booth</h3>
              <button onClick={() => setIsEditOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Booth Name</span>
                <input value={draftBooth.boothName} onChange={(e) => setDraftBooth({ ...draftBooth, boothName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Phone Number</span>
                <input value={draftBooth.phoneNumber} onChange={(e) => setDraftBooth({ ...draftBooth, phoneNumber: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Open Time</span>
                <input type="time" value={draftBooth.openTime} onChange={(e) => setDraftBooth({ ...draftBooth, openTime: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Close Time</span>
                <input type="time" value={draftBooth.closeTime} onChange={(e) => setDraftBooth({ ...draftBooth, closeTime: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </label>
              <label className="md:col-span-2 space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Thumbnail URL</span>
                <input value={draftBooth.thumbnailUrl} onChange={(e) => setDraftBooth({ ...draftBooth, thumbnailUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </label>
              <label className="md:col-span-2 space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea value={draftBooth.description} onChange={(e) => setDraftBooth({ ...draftBooth, description: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none" />
              </label>
              <div className="md:col-span-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500">
                Booth code, status, zone, package, documents, and featured status are managed by the system. This form only updates editable booth fields.
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button disabled={saving} onClick={saveBooth} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageManagerOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Manage Images</h3>
              <button onClick={() => setIsImageManagerOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {boothImages.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg py-12 text-center text-sm text-gray-500">{NO_DATA}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {boothImages.map((src, index) => (
                    <div key={src} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="aspect-[4/3] bg-gray-100">
                        <ImageWithFallback src={src} alt={`Booth image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 text-xs font-medium text-indigo-600 bg-indigo-50 text-center">Cover image</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
