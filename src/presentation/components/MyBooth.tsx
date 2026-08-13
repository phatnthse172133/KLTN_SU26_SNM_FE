"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  FileCheck,
  Lock,
  MapPin,
  Package,
  Pause,
  Pencil,
  Phone,
  Play,
  Save,
  Star,
  Store,
  X,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { ImageFilePicker } from "./shared/ImageFilePicker";
import { MultiImageFilePicker, type GalleryImage } from "./shared/MultiImageFilePicker";
import { useBooth } from "@/application/context/BoothContext";
import { boothService } from "@/application/features/booth/boothService";
import {
  boothMediaService,
  type BoothDocumentType,
  type BoothGalleryImage,
  type BoothOwnerDocument,
} from "@/application/features/booth/boothMediaService";
import {
  ownerSubscriptionService,
  type CurrentSubscription,
  type OwnerPackage,
} from "@/application/features/subscriptions/ownerSubscriptionService";
import { normalizePhoneNumber, validatePhoneNumber } from "@/shared/utils/phoneUtils";
import type { Booth } from "@/shared/types";
import { getErrorMessage } from "@/shared/errors/errorMapper";
import { resolveMediaUrl } from "@/shared/utils";
import { useJoinBooth, useOnReconnect } from "@/infrastructure/realtime";

const NO_DATA = "No data available";

type TabKey = "overview" | "images" | "location" | "documents" | "subscription";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "images", label: "Images" },
  { key: "location", label: "Location" },
  { key: "documents", label: "Documents" },
  { key: "subscription", label: "Subscription" },
];

const DOCUMENT_TYPES: { type: BoothDocumentType; label: string }[] = [
  { type: "BusinessLicense", label: "Business License" },
  { type: "FoodSafetyCertificate", label: "Food Safety Certificate" },
  { type: "OwnerIdentification", label: "Owner Identification" },
];

type BoothDraft = {
  boothName: string;
  description: string;
  phoneNumber: string;
  openTime: string;
  closeTime: string;
};

const emptyDraft: BoothDraft = {
  boothName: "",
  description: "",
  phoneNumber: "",
  openTime: "",
  closeTime: "",
};

// HTML time inputs use HH:mm, while ASP.NET's TimeOnly JSON contract requires
// an ISO time including seconds. Keep each representation explicit so editing
// an existing booth (including overnight hours) does not fail model binding.
const toTimeInputValue = (value?: string | null) => value ? value.slice(0, 5) : "";
const toTimeOnlyPayload = (value: string) => value ? `${value}:00` : null;

const getStatusBadge = (status?: string | null) => {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    case "banned":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getDocumentStatusBadge = (status?: string | null) => {
  switch ((status ?? "").toLowerCase()) {
    case "verified":
      return { className: "bg-emerald-100 text-emerald-700", label: "Verified" };
    case "rejected":
      return { className: "bg-red-100 text-red-700", label: "Rejected" };
    case "pending":
    case "pendingreview":
      return { className: "bg-amber-100 text-amber-700", label: "Pending" };
    default:
      return { className: "bg-gray-100 text-gray-600", label: status || "Not uploaded" };
  }
};

const toDraft = (booth: Booth | null): BoothDraft => ({
  boothName: booth?.boothName ?? "",
  description: booth?.description ?? "",
  phoneNumber: booth?.phoneNumber ?? "",
  openTime: toTimeInputValue(booth?.openTime),
  closeTime: toTimeInputValue(booth?.closeTime),
});

const display = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return NO_DATA;
  return String(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return NO_DATA;
  return new Date(value).toLocaleDateString("en-US");
};

const isDefaultBoothPlan = (code?: string | null) => code?.toUpperCase() === "BOOTH_FREE";

const daysRemainingFromEndDate = (endDate?: string | null) => {
  if (!endDate) return null;
  const remaining = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  return Math.max(0, remaining);
};

export function MyBooth() {
  const { selectedBooth, loading, error: boothLoadError, notFound: boothNotFound, refreshBooths } = useBooth();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [draftBooth, setDraftBooth] = useState<BoothDraft>(emptyDraft);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Join booth group for realtime updates
  useJoinBooth(selectedBooth?.id ?? null);

  // Listen for realtime booth events
  useEffect(() => {
    const onRealtimeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const type: string = detail.eventType;
      if (type === "BoothAssigned" || type === "BoothMoved" || type === "BoothUnassigned" ||
          type === "LayoutActivated" || type === "LayoutDeactivated") {
        void refreshBooths();
      }
    };
    window.addEventListener("realtime:event", onRealtimeEvent);
    return () => window.removeEventListener("realtime:event", onRealtimeEvent);
  }, [refreshBooths]);

  // On reconnect, refresh data
  useOnReconnect(() => {
    void refreshBooths();
  });

  const [galleryImages, setGalleryImages] = useState<BoothGalleryImage[]>([]);
  const [galleryError, setGalleryError] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryActionError, setGalleryActionError] = useState("");
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");

  const [documents, setDocuments] = useState<BoothOwnerDocument[]>([]);
  const [documentsError, setDocumentsError] = useState("");
  const [uploadingDocumentType, setUploadingDocumentType] = useState<BoothDocumentType | null>(null);
  const [documentErrors, setDocumentErrors] = useState<Partial<Record<BoothDocumentType, string>>>({});
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [packages, setPackages] = useState<OwnerPackage[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    setDraftBooth(toDraft(selectedBooth));
    setNotice("");
    setError("");
  }, [selectedBooth]);

  const loadGallery = useCallback(async () => {
    setGalleryError("");
    try {
      const response = await boothMediaService.getImages();
      setGalleryImages(response.data ?? []);
    } catch (loadError) {
      setGalleryImages([]);
      setGalleryError(getErrorMessage(loadError));
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setDocumentsError("");
    try {
      const response = await boothMediaService.getDocuments();
      setDocuments(response.data ?? []);
    } catch (loadError) {
      setDocuments([]);
      setDocumentsError(getErrorMessage(loadError));
    }
  }, []);

  const loadSubscription = useCallback(async (boothId: string) => {
    setSubscriptionLoading(true);
    setSubscriptionError("");
    try {
      const [currentResult, packagesResult] = await Promise.allSettled([
        ownerSubscriptionService.getBoothCurrent(boothId),
        ownerSubscriptionService.getPublicPackages(0),
      ]);
      setSubscription(currentResult.status === "fulfilled" ? currentResult.value : null);
      setPackages(packagesResult.status === "fulfilled" ? packagesResult.value : []);
      if (currentResult.status === "rejected") {
        setSubscriptionError("We couldn't load this booth's subscription details. Please try again.");
      }
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBooth?.id) {
      setGalleryImages([]);
      setDocuments([]);
      setSubscription(null);
      setPackages([]);
      return;
    }
    void loadGallery();
    void loadDocuments();
    void loadSubscription(selectedBooth.id);
  }, [selectedBooth?.id, loadGallery, loadDocuments, loadSubscription]);

  const openEdit = () => {
    setDraftBooth(toDraft(selectedBooth));
    setError("");
    setIsEditOpen(true);
  };

  const toggleBoothStatus = async () => {
    if (!selectedBooth?.id || toggling) return;
    const wasActive = selectedBooth.status === "Active";
    setToggling(true);
    setNotice("");
    setError("");
    try {
      await boothService.togglePauseMyBooth();
      await refreshBooths();
      setNotice(wasActive ? "Booth paused successfully." : "Booth activated successfully.");
    } catch (toggleError) {
      setError(getErrorMessage(toggleError));
    } finally {
      setToggling(false);
    }
  };

  const saveBooth = async () => {
    if (!selectedBooth?.id) return;
    const nextErrors: Record<string, string> = {};
    if (!draftBooth.boothName.trim()) nextErrors.boothName = "Booth name is required.";
    if (draftBooth.phoneNumber && !validatePhoneNumber(draftBooth.phoneNumber)) {
      nextErrors.phoneNumber = "Enter a valid Vietnamese phone number starting with 0 or +84.";
    }
    if ((draftBooth.openTime && !draftBooth.closeTime) || (!draftBooth.openTime && draftBooth.closeTime)) {
      nextErrors.openTime = "Opening and closing times must be provided together.";
    }
    setEditFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError("");
    try {
      await boothService.updateMyBooth({
        boothName: draftBooth.boothName,
        description: draftBooth.description || null,
        phoneNumber: draftBooth.phoneNumber ? normalizePhoneNumber(draftBooth.phoneNumber) : null,
        thumbnailUrl: selectedBooth.thumbnailUrl ?? null,
        paymentQrImage: selectedBooth.paymentQrImage ?? null,
        openTime: toTimeOnlyPayload(draftBooth.openTime),
        closeTime: toTimeOnlyPayload(draftBooth.closeTime),
      });
      await refreshBooths();
      setIsEditOpen(false);
      setNotice("Booth information updated successfully.");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    setLogoError("");
    try {
      await boothMediaService.updateLogo(file);
      await refreshBooths();
      setNotice("Booth logo updated successfully.");
    } catch (uploadError) {
      setLogoError(getErrorMessage(uploadError));
    } finally {
      setLogoUploading(false);
    }
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    setCoverError("");
    try {
      if (galleryImages.length >= 5) {
        setCoverError("The gallery is full (5 images). Remove an image before uploading a new cover.");
        return;
      }
      const previousIds = new Set(galleryImages.map((image) => image.id));
      const response = await boothMediaService.uploadImage(file);
      const updated = response.data ?? [];
      setGalleryImages(updated);
      const added = updated.find((image) => !previousIds.has(image.id)) ?? updated[updated.length - 1];
      if (added) {
        await boothMediaService.setCoverImage(added.id);
      }
      await refreshBooths();
      setNotice("Cover image updated successfully.");
    } catch (uploadError) {
      setCoverError(getErrorMessage(uploadError));
    } finally {
      setCoverUploading(false);
    }
  };

  const addGalleryImage = async (file: File) => {
    setGalleryUploading(true);
    setGalleryActionError("");
    try {
      const response = await boothMediaService.uploadImage(file);
      setGalleryImages(response.data ?? []);
      setNotice("Booth image uploaded successfully.");
    } catch (uploadError) {
      setGalleryActionError(getErrorMessage(uploadError));
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryImage = async (image: GalleryImage) => {
    setBusyImageId(image.id);
    setGalleryActionError("");
    try {
      await boothMediaService.deleteImage(image.id);
      setGalleryImages((current) => current.filter((entry) => entry.id !== image.id));
      if (image.isCover) {
        await refreshBooths();
      }
      setNotice("Booth image removed successfully.");
    } catch (deleteError) {
      setGalleryActionError(getErrorMessage(deleteError));
    } finally {
      setBusyImageId(null);
    }
  };

  const setCoverFromGallery = async (image: GalleryImage) => {
    setBusyImageId(image.id);
    setGalleryActionError("");
    try {
      await boothMediaService.setCoverImage(image.id);
      await refreshBooths();
      setNotice("Cover image updated successfully.");
    } catch (coverErr) {
      setGalleryActionError(getErrorMessage(coverErr));
    } finally {
      setBusyImageId(null);
    }
  };

  const uploadDocument = async (documentType: BoothDocumentType, file: File) => {
    setUploadingDocumentType(documentType);
    setDocumentErrors((current) => ({ ...current, [documentType]: "" }));
    try {
      await boothMediaService.uploadDocument(documentType, file);
      await loadDocuments();
      setNotice("Document uploaded successfully. Verification is now pending.");
    } catch (uploadError) {
      setDocumentErrors((current) => ({ ...current, [documentType]: getErrorMessage(uploadError) }));
    } finally {
      setUploadingDocumentType(null);
    }
  };

  const deleteDocument = async (documentType: BoothDocumentType, document: BoothOwnerDocument) => {
    setDeletingDocumentId(document.id);
    setDocumentErrors((current) => ({ ...current, [documentType]: "" }));
    try {
      await boothMediaService.deleteDocument(document.id);
      await loadDocuments();
      setNotice("Document deleted successfully.");
    } catch (deleteError) {
      setDocumentErrors((current) => ({ ...current, [documentType]: getErrorMessage(deleteError) }));
    } finally {
      setDeletingDocumentId(null);
    }
  };

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
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-10 text-center">
          <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          {boothNotFound ? (
            <>
              <p className="text-sm font-semibold text-gray-700">Your Booth Owner account is ready, but no booth has been created yet.</p>
              <p className="mt-2 text-sm text-gray-500">Ask the Market Owner to create and assign a booth to your account. Once it is created, you can enter its name, description, contact details, hours, images, and documents here.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-red-700">We couldn&apos;t load your booth information.</p>
              <p className="mt-2 text-sm text-gray-500">{boothLoadError ?? "Please try again. If the problem continues, contact Support."}</p>
              <button type="button" onClick={() => void refreshBooths()} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isBanned = selectedBooth.status === "Banned";
  const isActive = selectedBooth.status === "Active";
  const coverUrl = selectedBooth.thumbnailUrl ? resolveMediaUrl(selectedBooth.thumbnailUrl) : "";
  const logoUrl = selectedBooth.logoUrl ? resolveMediaUrl(selectedBooth.logoUrl) : "";

  const galleryItems: GalleryImage[] = galleryImages.map((image) => ({
    id: image.id,
    url: resolveMediaUrl(image.imageUrl),
    isCover: Boolean(selectedBooth.thumbnailUrl) && resolveMediaUrl(image.imageUrl) === coverUrl,
  }));

  const overviewDetails = [
    { label: "Phone Number", value: selectedBooth.phoneNumber, icon: Phone },
    {
      label: "Operating Hours",
      value: selectedBooth.openTime || selectedBooth.closeTime
        ? `${selectedBooth.openTime || "No data"} - ${selectedBooth.closeTime || "No data"}`
        : null,
      icon: Clock,
    },
    { label: "Average Rating", value: selectedBooth.averageRating, icon: Star },
    { label: "Featured Booth", value: selectedBooth.isFeatured ? "Yes" : "No", icon: Store },
  ];

  const locationDetails = [
    { label: "Night Market", value: selectedBooth.nightMarketName ?? selectedBooth.nightMarketId },
    { label: "Market Zone", value: selectedBooth.zoneName ?? selectedBooth.zoneId },
    { label: "Slot Code", value: selectedBooth.slotNumber },
    { label: "Booth Code", value: selectedBooth.boothCode },
    {
      label: "Map Position",
      value: selectedBooth.mapPositionX !== null && selectedBooth.mapPositionX !== undefined
        ? `X ${selectedBooth.mapPositionX}, Y ${selectedBooth.mapPositionY ?? "No data"}`
        : null,
    },
  ];

  const currentPackage = subscription
    ? packages.find((pkg) => pkg.code === subscription.packageCode) ?? null
    : null;
  const remainingDays = subscription
    ? daysRemainingFromEndDate(subscription.endDate) ?? subscription.daysRemaining
    : null;

  const renderOverviewTab = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="h-64 bg-gray-100 relative">
        {coverUrl ? (
          <ImageWithFallback src={coverUrl} alt={selectedBooth.boothName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-400">{NO_DATA}</div>
        )}
        <div className="absolute left-6 bottom-6 flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <ImageWithFallback src={logoUrl} alt={`${selectedBooth.boothName} logo`} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-7 h-7 text-indigo-600" />
            )}
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
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-base font-bold text-gray-900 mb-2">Booth Description</h4>
          <p className="text-sm text-gray-600 leading-6">{display(selectedBooth.description)}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overviewDetails.map((item) => (
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
      </div>
    </div>
  );

  const renderImagesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 space-y-3">
        <div>
          <h4 className="text-base font-bold text-gray-900">Logo</h4>
          <p className="text-xs text-gray-500 mt-1">Shown next to your booth name across the platform.</p>
        </div>
        <ImageFilePicker
          label="Booth logo"
          value={logoUrl || null}
          onSelect={(file) => void uploadLogo(file)}
          uploading={logoUploading}
          error={logoError || null}
          previewClassName="aspect-square"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 space-y-3">
        <div>
          <h4 className="text-base font-bold text-gray-900">Cover Image</h4>
          <p className="text-xs text-gray-500 mt-1">Uploaded into the gallery and set as your booth cover.</p>
        </div>
        <ImageFilePicker
          label="Booth cover image"
          value={coverUrl || null}
          onSelect={(file) => void uploadCover(file)}
          uploading={coverUploading}
          error={coverError || null}
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 space-y-3">
        <div>
          <h4 className="text-base font-bold text-gray-900">Gallery</h4>
          <p className="text-xs text-gray-500 mt-1">Up to 5 images. Pick any image as the cover.</p>
        </div>
        {galleryError ? (
          <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
            {galleryError}
            <button onClick={() => void loadGallery()} className="underline hover:opacity-70">Retry</button>
          </div>
        ) : (
          <MultiImageFilePicker
            label="Booth gallery"
            images={galleryItems}
            onAdd={(file) => void addGalleryImage(file)}
            onRemove={(image) => void removeGalleryImage(image)}
            onSetCover={(image) => void setCoverFromGallery(image)}
            uploading={galleryUploading}
            error={galleryActionError || null}
            busyImageId={busyImageId}
          />
        )}
      </div>
    </div>
  );

  const renderLocationTab = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locationDetails.map((item) => (
          <div key={item.label} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50">
                <MapPin className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{item.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{display(item.value)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500">
        Market, zone, and slot assignments are managed by the market owner and cannot be edited here.
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-4">
      {documentsError && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">
          {documentsError}
          <button onClick={() => void loadDocuments()} className="underline hover:opacity-70">Retry</button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {DOCUMENT_TYPES.map(({ type, label }) => {
          const document = documents.find((entry) => entry.documentType === type) ?? null;
          const badge = getDocumentStatusBadge(document?.verificationStatus ?? null);
          const isVerified = (document?.verificationStatus ?? "").toLowerCase() === "verified";
          const documentError = documentErrors[type] || "";
          const isPdf = Boolean(document?.fileUrl && document.fileUrl.toLowerCase().endsWith(".pdf"));
          return (
            <div key={type} className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-bold text-gray-900">{label}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>{badge.label}</span>
              </div>
              {document ? (
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {isPdf ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500">
                        <FileCheck className="w-8 h-8 text-indigo-500" />
                        <span className="text-xs font-medium">PDF document</span>
                      </div>
                    ) : (
                      <ImageWithFallback src={resolveMediaUrl(document.fileUrl)} alt={label} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Updated {formatDate(document.updatedAt || document.createdAt)}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={resolveMediaUrl(document.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-500">
                        <Lock className="w-3.5 h-3.5" />
                        Verified documents cannot be deleted
                      </span>
                    ) : (
                      <button
                        onClick={() => void deleteDocument(type, document)}
                        disabled={deletingDocumentId === document.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <X className="w-3.5 h-3.5" />
                        {deletingDocumentId === document.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-500">Upload a new file to replace this document. Verification resets to Pending.</p>
                    <ImageFilePicker
                      label={`Replace ${label}`}
                      onSelect={(file) => void uploadDocument(type, file)}
                      allowPdf
                      maxSizeMb={10}
                      uploading={uploadingDocumentType === type}
                      error={documentError || null}
                    />
                  </div>
                </div>
              ) : (
                <ImageFilePicker
                  label={`Upload ${label}`}
                  onSelect={(file) => void uploadDocument(type, file)}
                  allowPdf
                  maxSizeMb={10}
                  uploading={uploadingDocumentType === type}
                  error={documentError || null}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSubscriptionTab = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-6 space-y-6">
      {subscriptionLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading data...</div>
      ) : subscriptionError ? (
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">
          {subscriptionError}
          <button onClick={() => { if (selectedBooth.id) void loadSubscription(selectedBooth.id); }} className="underline hover:opacity-70">Retry</button>
        </div>
      ) : !subscription ? (
        <div className="py-8 text-center text-sm text-gray-500">{NO_DATA}</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">{display(subscription.packageName)}</h4>
                <p className="text-xs text-gray-500">Current package</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(subscription.status)}`}>
              {display(subscription.status)}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start Date</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {isDefaultBoothPlan(subscription.packageCode) ? "Included automatically" : formatDate(subscription.startDate)}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> End Date</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {isDefaultBoothPlan(subscription.packageCode) ? "No expiration" : formatDate(subscription.endDate)}
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Days Remaining</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {isDefaultBoothPlan(subscription.packageCode)
                  ? "Always available"
                  : remainingDays !== null
                    ? `${remainingDays} days`
                    : NO_DATA}
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Included Features</h4>
            {currentPackage?.features?.length ? (
              <ul className="space-y-2">
                {currentPackage.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="mt-0.5 w-4 h-4 shrink-0 text-indigo-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">{NO_DATA}</p>
            )}
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500">
            Visit Fees &amp; Subscription to upgrade, renew, or review payment history.
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="p-8 pb-12 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Booth</h2>
          <p className="text-sm text-gray-500 mt-1">Manage booth profile, location, hours, package, and verification</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isBanned ? (
            <button
              disabled
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 px-4 py-2.5 rounded-lg font-medium cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Activate Booth
            </button>
          ) : (
            <button
              onClick={toggleBoothStatus}
              disabled={toggling}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-60 ${
                isActive
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isActive ? "Pause Booth" : "Activate Booth"}
            </button>
          )}
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit Booth
          </button>
        </div>
      </div>

      {isBanned && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">This booth has been banned by the platform.</p>
            {selectedBooth.banReason && <p className="mt-1">Reason: {selectedBooth.banReason}</p>}
          </div>
        </div>
      )}

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

      <div className="flex bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-indigo-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "images" && renderImagesTab()}
      {activeTab === "location" && renderLocationTab()}
      {activeTab === "documents" && renderDocumentsTab()}
      {activeTab === "subscription" && renderSubscriptionTab()}

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
                <input value={draftBooth.boothName} onChange={(e) => {
                  setDraftBooth({ ...draftBooth, boothName: e.target.value });
                  setEditFieldErrors((current) => ({ ...current, boothName: "" }));
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                {editFieldErrors.boothName && <p className="text-xs text-red-600">{editFieldErrors.boothName}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Phone Number</span>
                <input type="tel" value={draftBooth.phoneNumber} onChange={(e) => {
                  setDraftBooth({ ...draftBooth, phoneNumber: e.target.value });
                  setEditFieldErrors((current) => ({ ...current, phoneNumber: "" }));
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                {editFieldErrors.phoneNumber && <p className="text-xs text-red-600">{editFieldErrors.phoneNumber}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Open Time</span>
                <input type="time" value={draftBooth.openTime} onChange={(e) => {
                  setDraftBooth({ ...draftBooth, openTime: e.target.value });
                  setEditFieldErrors((current) => ({ ...current, openTime: "" }));
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                {editFieldErrors.openTime && <p className="text-xs text-red-600">{editFieldErrors.openTime}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Close Time</span>
                <input type="time" value={draftBooth.closeTime} onChange={(e) => {
                  setDraftBooth({ ...draftBooth, closeTime: e.target.value });
                  setEditFieldErrors((current) => ({ ...current, openTime: "" }));
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </label>
              <label className="md:col-span-2 space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Description</span>
                <textarea value={draftBooth.description} onChange={(e) => setDraftBooth({ ...draftBooth, description: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none" />
              </label>
              <div className="md:col-span-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500">
                Booth code, status, zone, package, documents, and featured status are managed by the system. Logo, cover, and gallery images are managed from the Images tab.
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

    </div>
  );
}
