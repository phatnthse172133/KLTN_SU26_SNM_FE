"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Loader2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

export interface ChatPreviewImage {
  id: string;
  url: string;
  name: string;
}

interface ChatImageLightboxProps {
  images: ChatPreviewImage[];
  activeId: string | null;
  onActiveIdChange: (id: string) => void;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function safeDownloadName(name: string) {
  const trimmed = name.trim();
  return trimmed || "chat-image";
}

export function ChatImageLightbox({ images, activeId, onActiveIdChange, onClose }: ChatImageLightboxProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const activeIndex = useMemo(
    () => (activeId ? images.findIndex((image) => image.id === activeId) : -1),
    [activeId, images],
  );
  const activeImage = activeIndex >= 0 ? images[activeIndex] : null;

  const selectRelative = useCallback((offset: number) => {
    if (activeIndex < 0 || images.length < 2) return;
    const nextIndex = (activeIndex + offset + images.length) % images.length;
    onActiveIdChange(images[nextIndex].id);
  }, [activeIndex, images, onActiveIdChange]);

  useEffect(() => {
    if (!activeImage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") selectRelative(-1);
      if (event.key === "ArrowRight") selectRelative(1);
      if (event.key === "+" || event.key === "=") setZoom((current) => clampZoom(current + ZOOM_STEP));
      if (event.key === "-") setZoom((current) => clampZoom(current - ZOOM_STEP));
      if (event.key === "0") setZoom(MIN_ZOOM);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, onClose, selectRelative]);

  const downloadImage = async () => {
    if (!activeImage || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(activeImage.url);
      if (!response.ok) throw new Error("The image could not be downloaded.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeDownloadName(activeImage.name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError("The image could not be downloaded. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!activeImage || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${activeImage.name}`}
    >
      <header className="relative z-10 flex min-h-16 items-center gap-3 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur md:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{activeImage.name}</p>
          <p className="mt-0.5 text-xs text-white/60">
            {images.length > 1 ? `${activeIndex + 1} of ${images.length}` : "Chat image"}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            className="rounded-lg p-2 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="w-14 text-center text-xs font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            className="rounded-lg p-2 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(MIN_ZOOM)}
            disabled={zoom === MIN_ZOOM}
            className="rounded-lg p-2 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => void downloadImage()}
          disabled={downloading}
          className="rounded-xl border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
          aria-label="Download image"
        >
          {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/15"
          aria-label="Close image preview"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain" onWheel={(event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        setZoom((current) => clampZoom(current + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
      }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 h-full w-full cursor-default"
          aria-label="Close image preview"
        />

        <div className="relative flex min-h-full min-w-full items-center justify-center p-4 md:p-10">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setZoom((current) => current === MIN_ZOOM ? 2 : MIN_ZOOM);
            }}
            className={`relative z-10 flex items-center justify-center ${zoom > MIN_ZOOM ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            aria-label={zoom > MIN_ZOOM ? "Reset image zoom" : "Zoom image to 200 percent"}
          >
            <Image
              src={activeImage.url}
              alt={activeImage.name}
              width={1600}
              height={1200}
              unoptimized
              priority
              draggable={false}
              className="max-h-[calc(100vh-8rem)] max-w-[calc(100vw-2rem)] select-none object-contain transition-transform duration-150 md:max-w-[calc(100vw-8rem)]"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            />
          </button>
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); selectRelative(-1); }}
              className="fixed left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 shadow-xl backdrop-blur transition hover:bg-white/20 md:left-6"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); selectRelative(1); }}
              className="fixed right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-3 shadow-xl backdrop-blur transition hover:bg-white/20 md:right-6"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}
      </div>

      {downloadError ? (
        <p className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium shadow-xl">
          {downloadError}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
