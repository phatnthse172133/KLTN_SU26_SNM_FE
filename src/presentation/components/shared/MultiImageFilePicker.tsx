"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { ImageWithFallback } from "@/presentation/components/ImageWithFallback";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface GalleryImage {
  id: string;
  url: string;
  isCover?: boolean;
}

export interface MultiImageFilePickerProps {
  label: string;
  images: GalleryImage[];
  onAdd: (file: File) => void;
  onRemove: (image: GalleryImage) => void;
  onSetCover?: (image: GalleryImage) => void;
  maxCount?: number;
  maxSizeMb?: number;
  uploading?: boolean;
  error?: string | null;
  disabled?: boolean;
  busyImageId?: string | null;
}

export function MultiImageFilePicker({
  label,
  images,
  onAdd,
  onRemove,
  onSetCover,
  maxCount = 5,
  maxSizeMb = 5,
  uploading = false,
  error,
  disabled = false,
  busyImageId,
}: MultiImageFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const busy = uploading || disabled;
  const atCapacity = images.length >= maxCount;

  const validateFile = (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      return "Only JPG, PNG, or WEBP images are allowed.";
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `The image must be ${maxSizeMb}MB or smaller.`;
    }
    return "";
  };

  const handleFile = (file: File | undefined) => {
    if (!file || busy) return;
    if (atCapacity) {
      setValidationError(`You can upload up to ${maxCount} images. Remove one before adding another.`);
      return;
    }
    const failure = validateFile(file);
    if (failure) {
      setValidationError(failure);
      return;
    }
    setValidationError("");
    setLastFile(file);
    setPendingPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    onAdd(file);
  };

  const openFileDialog = () => {
    if (!busy && !atCapacity) inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFileDialog();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const retry = () => {
    if (lastFile && !busy) onAdd(lastFile);
  };

  const displayMessage = validationError || error || "";

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((image) => {
          const imageBusy = busyImageId === image.id;
          return (
            <div
              key={image.id}
              className={`relative group aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border ${
                image.isCover ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-200"
              }`}
            >
              <ImageWithFallback src={image.url} alt={label} className="w-full h-full object-cover" />
              {image.isCover && (
                <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Cover
                </span>
              )}
              {imageBusy ? (
                <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center text-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-gray-900/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {onSetCover && !image.isCover && (
                    <button
                      type="button"
                      aria-label="Set as cover image"
                      title="Set as cover image"
                      disabled={busy}
                      onClick={() => onSetCover(image)}
                      className="p-1.5 rounded-lg bg-white/90 text-gray-700 hover:bg-white hover:text-indigo-600 disabled:opacity-60"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Remove image"
                    title="Remove image"
                    disabled={busy}
                    onClick={() => onRemove(image)}
                    className="p-1.5 rounded-lg bg-white/90 text-gray-700 hover:bg-white hover:text-red-600 disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {uploading && pendingPreview && (
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <ImageWithFallback src={pendingPreview} alt="Uploading image" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
        {!atCapacity && (
          <div
            role="button"
            tabIndex={busy ? -1 : 0}
            aria-label={`${label}: add an image (${images.length} of ${maxCount})`}
            aria-disabled={busy}
            onClick={openFileDialog}
            onKeyDown={handleKeyDown}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-center outline-none transition-colors ${
              dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300"
            } ${busy ? "opacity-60 cursor-not-allowed" : "cursor-pointer focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100"}`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-xs font-medium text-gray-500">Add image</span>
            <span className="text-[10px] text-gray-400">
              {images.length}/{maxCount}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {displayMessage ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {displayMessage}
          </p>
        ) : (
          <span className="text-xs text-gray-400">JPG, PNG, or WEBP up to {maxSizeMb}MB each</span>
        )}
        {error && lastFile && (
          <button
            type="button"
            onClick={retry}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
