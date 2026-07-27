/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

const HERE_SCRIPT_URLS = [
  "https://js.api.here.com/v3/3.1/mapsjs-core.js",
  "https://js.api.here.com/v3/3.1/mapsjs-service.js",
  "https://js.api.here.com/v3/3.1/mapsjs-ui.js",
  "https://js.api.here.com/v3/3.1/mapsjs-mapevents.js",
] as const;
const HERE_STYLESHEET_URL = "https://js.api.here.com/v3/3.1/mapsjs-ui.css";

declare global {
  interface Window { H?: any; __hereMapsLoaderPromise?: Promise<any>; }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") { resolve(); return; }
    const script = existing ?? document.createElement("script");
    script.src = src; script.async = false; script.defer = true;
    script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load HERE Maps SDK.")), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

export function getHereMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_HERE_MAPS_API_KEY?.trim() ?? "";
}

export async function loadHereMaps(): Promise<any> {
  if (typeof window === "undefined") throw new Error("HERE Maps can only be loaded in the browser.");
  if (window.H?.service && window.H?.mapevents && window.H?.ui) return window.H;
  if (!window.__hereMapsLoaderPromise) {
    window.__hereMapsLoaderPromise = (async () => {
      if (!document.querySelector(`link[href="${HERE_STYLESHEET_URL}"]`)) {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet"; stylesheet.href = HERE_STYLESHEET_URL;
        document.head.appendChild(stylesheet);
      }
      for (const scriptUrl of HERE_SCRIPT_URLS) await loadScript(scriptUrl);
      if (!window.H?.service || !window.H?.mapevents || !window.H?.ui) throw new Error("HERE Maps SDK loaded without all required modules.");
      return window.H;
    })().catch((error) => { window.__hereMapsLoaderPromise = undefined; throw error; });
  }
  return window.__hereMapsLoaderPromise;
}
