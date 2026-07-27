/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import { getHereMapsApiKey, loadHereMaps } from "@/infrastructure/maps/hereMapsLoader";
import { autosuggestHereLocations, reverseGeocodeHereLocation, type HereSearchResult } from "@/infrastructure/maps/hereMapsSearch";
import { Modal } from "./Modal";
import { getErrorMessage } from "@/shared/errors/errorMapper";

interface Props { isOpen:boolean; onClose:()=>void; onConfirm:(lat:number,lng:number)=>void; initialLat?:number; initialLng?:number }
const fallback={lat:10.7721,lng:106.698};
const safe=(value:number,other:number)=>Number.isFinite(value)?value:other;

export function MapPicker({isOpen,onClose,onConfirm,initialLat=fallback.lat,initialLng=fallback.lng}:Props){
  const key=getHereMapsApiKey(),container=useRef<HTMLDivElement>(null),map=useRef<any>(null),marker=useRef<any>(null),behavior=useRef<any>(null),reverseRequest=useRef<AbortController|null>(null);
  const [coords,setCoords]=useState({lat:initialLat,lng:initialLng}),[address,setAddress]=useState(""),[query,setQuery]=useState(""),[results,setResults]=useState<HereSearchResult[]>([]);
  const [loading,setLoading]=useState(false),[searching,setSearching]=useState(false),[error,setError]=useState<string|null>(null);

  useEffect(()=>{if(isOpen){setCoords({lat:safe(initialLat,fallback.lat),lng:safe(initialLng,fallback.lng)});setAddress("");setQuery("");setResults([]);setError(null);}},[initialLat,initialLng,isOpen]);
  useEffect(()=>{
    if(!isOpen||query.trim().length<3||!key){setResults([]);setSearching(false);return;}
    const controller=new AbortController(),timer=window.setTimeout(async()=>{setSearching(true);try{setResults(await autosuggestHereLocations(query.trim(),coords.lat,coords.lng,key,controller.signal));}catch(e){if(!controller.signal.aborted)setError(getErrorMessage(e));}finally{if(!controller.signal.aborted)setSearching(false);}},400);
    return()=>{clearTimeout(timer);controller.abort();};
  },[coords.lat,coords.lng,isOpen,key,query]);
  useEffect(()=>{
    if(!isOpen||!container.current)return;
    if(!key){setError("HERE Maps is not configured. Add NEXT_PUBLIC_HERE_MAPS_API_KEY to .env.local.");return;}
    let disposed=false,observer:ResizeObserver|undefined;const cleanups:Array<()=>void>=[];
    const update=async(lat:number,lng:number)=>{const next={lat:Number(lat.toFixed(6)),lng:Number(lng.toFixed(6))};setCoords(next);marker.current?.setGeometry(next);setError(null);reverseRequest.current?.abort();const controller=new AbortController();reverseRequest.current=controller;try{const found=await reverseGeocodeHereLocation(next.lat,next.lng,key,controller.signal);if(!controller.signal.aborted)setAddress(found?.address??"");}catch{if(!controller.signal.aborted)setAddress("");}};
    setLoading(true);
    loadHereMaps().then(H=>{
      if(disposed||!container.current)return;const platform=new H.service.Platform({apikey:key}),layers=platform.createDefaultLayers(),center={lat:safe(initialLat,fallback.lat),lng:safe(initialLng,fallback.lng)};
      const instance=new H.Map(container.current,layers.vector.normal.map,{center,zoom:14,pixelRatio:window.devicePixelRatio||1});map.current=instance;behavior.current=new H.mapevents.Behavior(new H.mapevents.MapEvents(instance));H.ui.UI.createDefault(instance,layers);
      const point=new H.map.Marker(center,{volatility:true});point.draggable=true;marker.current=point;instance.addObject(point);
      const tap=(event:any)=>{if(event.target===point)return;const p=event.currentPointer,geo=instance.screenToGeo(p.viewportX,p.viewportY);void update(geo.lat,geo.lng);};
      const start=(event:any)=>{if(event.target===point)behavior.current.disable();};
      const drag=(event:any)=>{if(event.target===point){const p=event.currentPointer;point.setGeometry(instance.screenToGeo(p.viewportX,p.viewportY));}};
      const end=(event:any)=>{if(event.target===point){behavior.current.enable();const geo=point.getGeometry();void update(geo.lat,geo.lng);}};
      instance.addEventListener("tap",tap);instance.addEventListener("dragstart",start);instance.addEventListener("drag",drag);instance.addEventListener("dragend",end);
      cleanups.push(()=>instance.removeEventListener("tap",tap),()=>instance.removeEventListener("dragstart",start),()=>instance.removeEventListener("drag",drag),()=>instance.removeEventListener("dragend",end));
      observer=new ResizeObserver(()=>instance.getViewPort().resize());observer.observe(container.current);setTimeout(()=>instance.getViewPort().resize(),100);void update(center.lat,center.lng);
    }).catch(e=>!disposed&&setError(getErrorMessage(e))).finally(()=>!disposed&&setLoading(false));
    return()=>{disposed=true;reverseRequest.current?.abort();cleanups.forEach(fn=>fn());observer?.disconnect();behavior.current?.dispose?.();map.current?.dispose?.();behavior.current=null;marker.current=null;map.current=null;};
  },[initialLat,initialLng,isOpen,key]);

  const choose=(item:HereSearchResult)=>{const next={lat:item.latitude,lng:item.longitude};setCoords(next);setAddress(item.address);setQuery(item.title);setResults([]);marker.current?.setGeometry(next);map.current?.setCenter(next,true);map.current?.setZoom(16,true);};
  return <Modal isOpen={isOpen} onClose={onClose} title="Select Location on HERE Maps" size="md"><div className="flex flex-col gap-4">
    <p className="m-0 text-sm text-slate-500">Search for an address, click the map, or drag the marker to select the exact night market location.</p>
    <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={query} onChange={e=>{setQuery(e.target.value);setError(null);}} placeholder="Search an address or place" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-indigo-500"/>{searching&&<LoaderCircle className="absolute right-3 top-3 h-4 w-4 animate-spin text-indigo-600"/>}
      {results.length>0&&<div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border bg-white shadow-xl">{results.map(item=><button type="button" key={item.id} onClick={()=>choose(item)} className="block w-full border-b px-3 py-2.5 text-left hover:bg-indigo-50"><b className="block text-sm">{item.title}</b><span className="block text-xs text-slate-500">{item.address}</span></button>)}</div>}
    </div>
    <div className="relative overflow-hidden rounded-xl border bg-slate-100"><div ref={container} className="h-[350px] w-full"/>{loading&&<div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm"><LoaderCircle className="mr-2 h-5 w-5 animate-spin text-indigo-600"/>Loading HERE Maps...</div>}</div>
    {error&&<p className="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    {address&&<div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2"><span className="block text-[11px] font-semibold uppercase text-indigo-500">Nearest address</span><span className="text-sm text-indigo-900">{address}</span></div>}
    <div className="grid grid-cols-2 gap-4 rounded-lg border bg-slate-50 p-3"><div><span className="block text-[11px] font-semibold text-slate-500">LATITUDE</span><span className="font-mono text-sm font-semibold">{coords.lat}</span></div><div><span className="block text-[11px] font-semibold text-slate-500">LONGITUDE</span><span className="font-mono text-sm font-semibold">{coords.lng}</span></div></div>
    <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold">Cancel</button><button type="button" disabled={!key||loading} onClick={()=>{onConfirm(coords.lat,coords.lng);onClose();}} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><MapPin className="h-4 w-4"/>Confirm Location</button></div>
  </div></Modal>;
}
