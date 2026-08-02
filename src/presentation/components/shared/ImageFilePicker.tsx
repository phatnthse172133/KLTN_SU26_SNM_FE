"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { AlertCircle, FileText, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { ImageWithFallback } from "@/presentation/components/ImageWithFallback";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PDF_TYPE = "application/pdf";

export interface ImageFilePickerProps {
  label: string;
  value?: string | null;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  allowPdf?: boolean;
  maxSizeMb?: number;
  uploading?: boolean;
  error?: string | null;
  disabled?: boolean;
  previewClassName?: string;
}

type LocalPreview = {
  url: string;
  name: string;
  isPdf: boolean;
};

export function ImageFilePicker({
  label,
  value,
  onSelect,
  onRemove,
  allowPdf = false,
  maxSizeMb = 5,
  uploading = false,
  error,
  disabled = false,
  previewClassName = "aspect-[4/3]",
}: ImageFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<LocalPreview | null>(null);
  const [validationError, setValidationError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const acceptedTypes = allowPdf ? [...IMAGE_TYPES, PDF_TYPE] : IMAGE_TYPES;
  const accept = acceptedTypes.join(",");
  const busy = uploading || disabled;

  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      return allowPdf
        ? "Only JPG, PNG, WEBP images or PDF files are allowed."
        : "Only JPG, PNG, or WEBP images are allowed.";
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `The file must be ${maxSizeMb}MB or smaller.`;
    }
    return "";
  };

  const handleFile = (file: File | undefined) => {
    if (!file || busy) return;
    const failure = validateFile(file);
    if (failure) {
      setValidationError(failure);
      return;
    }
    setValidationError("");
    setLastFile(file);
    setPreview({ url: URL.createObjectURL(file), name: file.name, isPdf: file.type === PDF_TYPE });
    onSelect(file);
  };

  const openFileDialog = () => {
    if (!busy) inputRef.current?.click();
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

  const handleRemove = () => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setValidationError("");
    setLastFile(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  const retry = () => {
    if (lastFile && !busy) onSelect(lastFile);
  };

  const displayMessage = validationError || error || "";
  const hasContent = Boolean(preview || value);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {hasContent ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className={`relative bg-gray-100 ${previewClassName}`}>
            {preview?.isPdf ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 px-4">
                <FileText className="w-8 h-8 text-indigo-500" />
                <span className="text-xs font-medium text-center break-all">{preview.name}</span>
              </div>
            ) : (
              <ImageWithFallback
                src={preview?.url ?? value ?? ""}
                alt={label}
                className="w-full h-full object-cover"
              />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center gap-2 text-sm font-medium text-white">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            )}
          </div>
          <div className="p-2 flex flex-wrap gap-2 bg-white">
            <button
              type="button"
              onClick={openFileDialog}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
            {error && lastFile && (
              <button
                type="button"
                onClick={retry}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label={`${label}: choose a file or drag and drop`}
          aria-disabled={busy}
          onClick={openFileDialog}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center outline-none transition-colors ${
            dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300"
          } ${busy ? "opacity-60 cursor-not-allowed" : "cursor-pointer focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100"}`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-gray-400" />
          )}
          <p className="text-sm font-medium text-gray-600">
            {uploading ? "Uploading..." : "Drag and drop a file here, or click to browse"}
          </p>
          <p className="text-xs text-gray-400">
            {allowPdf ? "JPG, PNG, WEBP, or PDF" : "JPG, PNG, or WEBP"} up to {maxSizeMb}MB
          </p>
        </div>
      )}
      {displayMessage && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {displayMessage}
        </p>
      )}
    </div>
  );
}
