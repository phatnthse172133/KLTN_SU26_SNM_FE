/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import { getHereMapsApiKey, loadHereMaps } from "@/infrastructure/maps/hereMapsLoader";
import { getErrorMessage } from "@/shared/errors/errorMapper";

interface MarketLike { id:string; name:string; address?:string; latitude?:number|null; longitude?:number|null; status?:string; thumbnailUrl?:string|null }
interface MapViewProps { markets:MarketLike[]; selectedMarket?:MarketLike|null; onMarketSelect:(market:MarketLike)=>void; onViewDetails?:(id:string)=>void }
const valid=(m:MarketLike)=>Number.isFinite(m.latitude)&&Number.isFinite(m.longitude)&&m.latitude!>=-90&&m.latitude!<=90&&m.longitude!>=-180&&m.longitude!<=180;
const pin=(active:boolean)=>`<div style="width:${active?24:19}px;height:${active?24:19}px;border-radius:50%;background:${active?"#4f46e5":"#ef4444"};border:3px solid white;box-shadow:0 3px 12px #0f172a55;transform:translate(-50%,-50%)"></div>`;

export function MapView({markets,selectedMarket,onMarketSelect,onViewDetails}:MapViewProps){
  const key=getHereMapsApiKey(), container=useRef<HTMLDivElement>(null), map=useRef<any>(null), group=useRef<any>(null);
  const [ready,setReady]=useState(false),[error,setError]=useState<string|null>(null);
  useEffect(()=>{
    if(!container.current)return;
    if(!key){setError("HERE Maps is not configured. Add NEXT_PUBLIC_HERE_MAPS_API_KEY to .env.local.");return;}
    let disposed=false,instance:any,behavior:any,observer:ResizeObserver|undefined;
    loadHereMaps().then(H=>{
      if(disposed||!container.current)return;
      const platform=new H.service.Platform({apikey:key}),layers=platform.createDefaultLayers();
      instance=new H.Map(container.current,layers.vector.normal.map,{center:{lat:10.7721,lng:106.698},zoom:12,pixelRatio:window.devicePixelRatio||1});
      behavior=new H.mapevents.Behavior(new H.mapevents.MapEvents(instance)); H.ui.UI.createDefault(instance,layers); map.current=instance;
      observer=new ResizeObserver(()=>instance.getViewPort().resize());observer.observe(container.current);setReady(true);
    }).catch(e=>!disposed&&setError(getErrorMessage(e)));
    return()=>{disposed=true;observer?.disconnect();behavior?.dispose?.();instance?.dispose?.();map.current=null;group.current=null;};
  },[key]);
  useEffect(()=>{
    if(!ready||!map.current||!window.H)return;const H=window.H,m=map.current;if(group.current)m.removeObject(group.current);
    const items=markets.filter(valid),g=new H.map.Group();group.current=g;
    items.forEach(item=>{const marker=new H.map.DomMarker({lat:item.latitude!,lng:item.longitude!},{icon:new H.map.DomIcon(pin(selectedMarket?.id===item.id))});marker.addEventListener("tap",()=>onMarketSelect(item));g.addObject(marker);});m.addObject(g);
    if(selectedMarket&&valid(selectedMarket)){m.setCenter({lat:selectedMarket.latitude!,lng:selectedMarket.longitude!},true);if(m.getZoom()<14)m.setZoom(14,true);}
    else if(items.length===1){m.setCenter({lat:items[0].latitude!,lng:items[0].longitude!},true);m.setZoom(14,true);}
    else if(items.length>1){const bounds=g.getBoundingBox();if(bounds)m.getViewModel().setLookAtData({bounds},true);}
    return()=>{if(map.current&&group.current)map.current.removeObject(group.current);group.current=null;};
  },[markets,onMarketSelect,ready,selectedMarket]);
  const mapped=markets.filter(valid).length;
  return <div className="grid h-full overflow-hidden rounded-xl border bg-white md:grid-cols-[1fr_320px]">
    <div className="relative min-h-[360px] overflow-hidden bg-slate-100"><div ref={container} className="absolute inset-0"/>
      {!ready&&!error&&<div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-slate-600"><LoaderCircle className="mr-2 h-5 w-5 animate-spin text-indigo-600"/>Loading HERE Maps...</div>}
      {error&&<div className="absolute inset-0 flex items-center justify-center p-8"><div className="rounded-xl border border-red-200 bg-white p-6 text-center shadow"><MapPin className="mx-auto mb-2 h-7 w-7 text-red-500"/><b>Map unavailable</b><p className="mt-1 text-sm text-red-700">{error}</p></div></div>}
      {ready&&mapped===0&&<div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"><span className="rounded-lg border bg-white px-4 py-2 text-sm shadow">No market has valid coordinates.</span></div>}
    </div>
    <div className="overflow-y-auto border-l"><div className="border-b p-4"><h3 className="font-bold">Night markets</h3><p className="text-xs text-gray-500">{markets.length} API result(s) · {mapped} mapped</p></div>
      {markets.length===0?<p className="p-8 text-center text-sm text-gray-500">No markets returned by API.</p>:markets.map(item=><button type="button" key={item.id} onClick={()=>onMarketSelect(item)} className={`w-full border-b p-4 text-left hover:bg-gray-50 ${selectedMarket?.id===item.id?"bg-indigo-50":""}`}><p className="font-semibold">{item.name}</p><p className="mt-1 truncate text-xs text-gray-500">{item.address||"Address not provided"}</p><div className="mt-2 flex justify-between text-xs text-gray-600"><span>{item.status||"Status not provided"}</span>{!valid(item)&&<span className="text-amber-600">No coordinates</span>}</div>{selectedMarket?.id===item.id&&onViewDetails&&<span onClick={e=>{e.stopPropagation();onViewDetails(item.id);}} className="mt-3 inline-flex text-xs font-semibold text-indigo-600">View details</span>}</button>)}
    </div>
  </div>;
}
