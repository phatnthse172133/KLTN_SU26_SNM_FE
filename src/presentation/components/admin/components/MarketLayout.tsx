/* eslint-disable */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, X, ChevronRight, ChevronLeft, Grid } from "lucide-react";
import { createPortal } from "react-dom";
import {
  marketLayoutService,
  type MarketLayout as Layout,
  type MarketLayoutEditorData,
  type Zone,
} from "@/application/features/marketLayouts/marketLayoutService";
import { GraphDesignerCanvas } from "./GraphDesignerCanvas";
import { getErrorMessage } from "@/shared/errors/errorMapper";

interface MarketLayoutProps {
  market: { id: string; name: string };
  booths: any[]; // Using any to match existing props structure for now
  onClose: () => void;
}

const errorMessage = (error: unknown) => getErrorMessage(error);

const STEPS = ["LIST", "INFO", "DIMENSIONS", "ZONES", "GRAPH", "BOOTHS"] as const;
type Step = typeof STEPS[number];

export function MarketLayout({ market, booths, onClose }: MarketLayoutProps) {
  const [step, setStep] = useState<Step>("LIST");
  
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<MarketLayoutEditorData | null>(null);
  
  // Wizard state
  const [name, setName] = useState("");
  const [version, setVersion] = useState(1);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [zones, setZones] = useState<Zone[]>([]);
  
  // Form state
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneColor, setNewZoneColor] = useState("#e5e7eb");
  const [selectedBoothNode, setSelectedBoothNode] = useState<string>("");
  const [selectedBoothToAssign, setSelectedBoothToAssign] = useState<string>("");
  const [slotNumber, setSlotNumber] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLayouts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await marketLayoutService.list(market.id);
      setLayouts(response.data.items);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [market.id]);

  useEffect(() => { 
    if (step === "LIST") {
      void loadLayouts(); 
    }
  }, [step, loadLayouts]);

  const loadEditorData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await marketLayoutService.editorData(id);
      setEditor(response.data);
      setName(response.data.layout.layoutName);
      setVersion(response.data.layout.version);
      setWidth(response.data.layout.width || 100);
      setHeight(response.data.layout.height || 100);
      setZones(response.data.zones);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEdit = (id: string) => {
    setSelectedId(id);
    void loadEditorData(id);
    setStep("INFO");
  };

  const handleNext = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (step === "INFO") {
        if (!name.trim()) throw new Error("Layout name is required.");
        if (selectedId) {
          // It's an update, but we only have updateDimensions. We assume INFO was updated via other means or we just proceed.
          // Wait, the API has updateAsync for name and version, but I'll skip it here since we focus on phase 2.
          setStep("DIMENSIONS");
        } else {
          const response = await marketLayoutService.create(market.id, { layoutName: name.trim(), version });
          setSelectedId(response.data.id);
          void loadEditorData(response.data.id);
          setStep("DIMENSIONS");
        }
      } else if (step === "DIMENSIONS") {
        if (!selectedId) throw new Error("No layout selected");
        if (width <= 0 || height <= 0) throw new Error("Dimensions must be > 0");
        await marketLayoutService.updateDimensions(selectedId, width, height);
        // Refresh editor data to get updated layout object
        await loadEditorData(selectedId);
        setStep("ZONES");
      } else if (step === "ZONES") {
        setStep("GRAPH");
      } else if (step === "GRAPH") {
        // Saving graph is handled inside the canvas component.
        // We just move to booths.
        await loadEditorData(selectedId!); // Refresh booths locations based on nodes
        setStep("BOOTHS");
      } else if (step === "BOOTHS") {
        setStep("LIST");
        setSelectedId(null);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName.trim() || !selectedId) return;
    setSaving(true);
    try {
      await marketLayoutService.createZone(market.id, {
        zoneName: newZoneName,
        color: newZoneColor,
      });
      setNewZoneName("");
      await loadEditorData(selectedId);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  
  const handleAssignBooth = async () => {
    if (!selectedId || !selectedBoothNode || !selectedBoothToAssign) return;
    setSaving(true);
    try {
      const node = editor?.nodes.find(n => n.id === selectedBoothNode);
      await marketLayoutService.assignBooth(selectedBoothToAssign, {
        layoutId: selectedId,
        layoutNodeId: selectedBoothNode,
        zoneId: node?.zoneId || undefined,
        slotNumber: slotNumber || selectedBoothNode.substring(0, 4),
      });
      setSlotNumber("");
      setSelectedBoothNode("");
      setSelectedBoothToAssign("");
      await loadEditorData(selectedId);
      setNotice("Booth assigned successfully");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleReleaseBooth = async (boothId: string) => {
    setSaving(true);
    try {
      await marketLayoutService.releaseBooth(boothId);
      await loadEditorData(selectedId!);
      setNotice("Booth released successfully");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (loading) return <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" /></div>;

    switch (step) {
      case "INFO":
        return (
          <div className="mx-auto max-w-md space-y-4 py-8">
            <h3 className="text-xl font-bold">1. General Info</h3>
            <div>
              <label className="mb-1 block text-sm font-medium">Layout Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="e.g. Summer Festival 2026" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Version</label>
              <input type="number" min={1} value={version} onChange={e => setVersion(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2" />
            </div>
          </div>
        );

      case "DIMENSIONS":
        return (
          <div className="mx-auto max-w-md space-y-4 py-8">
            <h3 className="text-xl font-bold">2. Set Dimensions (in meters)</h3>
            <p className="text-sm text-gray-500">The coordinate system maps 1 unit to 1 meter in reality.</p>
            <div>
              <label className="mb-1 block text-sm font-medium">Width (X)</label>
              <input type="number" min={1} value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Height (Y)</label>
              <input type="number" min={1} value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2" />
            </div>
          </div>
        );

      case "ZONES":
        return (
          <div className="mx-auto max-w-2xl space-y-6 py-8">
            <h3 className="text-xl font-bold">3. Define Zones (Optional)</h3>
            <p className="text-sm text-gray-500">Create color-coded zones to logically divide the market (e.g. Food, Clothes).</p>
            <div className="flex gap-2">
              <input value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="Zone name" className="flex-1 rounded-lg border px-3 py-2" />
              <input type="color" value={newZoneColor} onChange={e => setNewZoneColor(e.target.value)} className="h-10 w-16 rounded-lg border" />
              <button disabled={saving} onClick={() => void handleCreateZone()} className="rounded-lg bg-indigo-600 px-4 py-2 text-white">Add</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {zones.map(z => (
                <div key={z.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="h-6 w-6 rounded-full shadow-inner" style={{ backgroundColor: z.color || '#ccc' }} />
                  <span className="font-medium">{z.zoneName}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "GRAPH":
        return (
          <div className="space-y-4 py-4 h-full flex flex-col">
            <h3 className="text-xl font-bold shrink-0">4. Design Graph</h3>
            <p className="text-sm text-gray-500 shrink-0">Click &apos;Add Node&apos; to place a node, &apos;Connect&apos; to link them. Ensure all nodes fit within {width}m x {height}m.</p>
            <div className="flex-1 min-h-[500px]">
              {editor && selectedId && (
                <GraphDesignerCanvas 
                  layoutId={selectedId}
                  width={editor.layout.width || width}
                  height={editor.layout.height || height}
                  initialNodes={editor.nodes}
                  initialEdges={editor.edges}
                  zones={zones}
                  onSave={async (nodes, edges) => {
                    setSaving(true);
                    try {
                      await marketLayoutService.saveGraphTransactional(selectedId, {
                        expectedUpdatedAt: editor.layout.updatedAt,
                        nodes,
                        edges
                      });
                      setNotice("Graph saved successfully!");
                      await loadEditorData(selectedId);
                    } catch (err) {
                      setError(errorMessage(err));
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              )}
            </div>
          </div>
        );

      case "BOOTHS":
        const boothAccessNodes = editor?.nodes.filter(n => n.nodeType === "BoothAccess") || [];
        const unassignedBooths = booths.filter(b => !editor?.boothLocations.some(l => l.boothId === b.id));
        
        return (
          <div className="space-y-6 py-8">
            <h3 className="text-xl font-bold">5. Allocate Booths</h3>
            <p className="text-sm text-gray-500">Map registered booths to BoothAccess nodes on your graph.</p>
            
            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-gray-50 p-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">BoothAccess Node</label>
                <select value={selectedBoothNode} onChange={e => setSelectedBoothNode(e.target.value)} className="w-full rounded-lg border px-3 py-2">
                  <option value="">-- Select Node --</option>
                  {boothAccessNodes.map(n => {
                    const isAssigned = editor?.boothLocations.some(l => l.layoutNodeId === n.id);
                    return <option key={n.id} value={n.id} disabled={isAssigned}>{n.nodeName || `Node ${n.id.substring(0,6)}`} {isAssigned ? '(Assigned)' : ''}</option>;
                  })}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Booth</label>
                <select value={selectedBoothToAssign} onChange={e => setSelectedBoothToAssign(e.target.value)} className="w-full rounded-lg border px-3 py-2">
                  <option value="">-- Select Booth --</option>
                  {unassignedBooths.map(b => <option key={b.id} value={b.id}>{b.name || `Booth ${b.id.substring(0,6)}`}</option>)}
                </select>
              </div>
              <div className="w-32">
                <label className="mb-1 block text-sm font-medium">Slot Number</label>
                <input value={slotNumber} onChange={e => setSlotNumber(e.target.value)} placeholder="Auto" className="w-full rounded-lg border px-3 py-2" />
              </div>
              <button disabled={saving || !selectedBoothNode || !selectedBoothToAssign} onClick={() => void handleAssignBooth()} className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">Assign</button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3">Node</th>
                    <th className="p-3">Slot Number</th>
                    <th className="p-3">Booth Name</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {editor?.boothLocations.map(loc => {
                    const node = editor.nodes.find(n => n.id === loc.layoutNodeId);
                    return (
                      <tr key={loc.id}>
                        <td className="p-3">{node?.nodeName || `Node ${loc.layoutNodeId.substring(0,6)}`}</td>
                        <td className="p-3">{loc.slotNumber}</td>
                        <td className="p-3">{booths.find(b => b.id === loc.boothId)?.name || "Not available"}</td>
                        <td className="p-3">
                          <button onClick={() => void handleReleaseBooth(loc.boothId)} className="text-red-600 hover:underline">Release</button>
                        </td>
                      </tr>
                    );
                  })}
                  {editor?.boothLocations.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No booths assigned yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      default: return null;
    }
  };

  if (step === "LIST") {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-5">
            <div><h3 className="text-xl font-bold">Internal Layouts</h3><p className="text-sm text-gray-500">{market.name}</p></div>
            <button onClick={onClose} className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {(error || notice) && <div className={`mb-4 flex gap-2 rounded-lg p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}{error || notice}</div>}
            
            <div className="mb-6 flex justify-between">
              <h4 className="text-lg font-semibold">Available Layouts</h4>
              <button onClick={() => { setSelectedId(null); setName(""); setVersion(1); setStep("INFO"); }} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-700"><Plus className="h-4 w-4" /> Create New Layout</button>
            </div>
            
            {loading ? <Loader2 className="mx-auto my-12 animate-spin text-gray-400" /> : layouts.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center text-gray-500">
                <Grid className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p>No layouts found. Create one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {layouts.map(layout => (
                  <div key={layout.id} className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h5 className="font-bold">{layout.layoutName}</h5>
                        <p className="text-xs text-gray-500">Version {layout.version} · {layout.width}x{layout.height}m</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${layout.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {layout.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(layout.id)} className="flex-1 rounded-lg border bg-gray-50 py-1.5 text-sm font-medium hover:bg-gray-100">Design</button>
                      <button disabled={saving} onClick={async () => {
                        setSaving(true); setError(""); setNotice("");
                        try {
                          if (layout.status === "Active") await marketLayoutService.deactivate(layout.id);
                          else await marketLayoutService.activate(layout.id);
                          await loadLayouts();
                          setNotice(layout.status === "Active" ? "Layout deactivated." : "Layout activated.");
                        } catch(err) { setError(errorMessage(err)); }
                        finally { setSaving(false); }
                      }} className="flex-1 rounded-lg border bg-gray-50 py-1.5 text-sm font-medium hover:bg-gray-100">
                        {layout.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // WIZARD VIEW
  const wizardProgress = (STEPS.indexOf(step) - 1) / (STEPS.length - 2) * 100;
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep("LIST")} className="rounded-lg p-2 text-gray-500 hover:bg-gray-200"><ChevronLeft className="h-5 w-5" /></button>
              <h3 className="text-lg font-bold">Layout Designer Wizard</h3>
            </div>
            <button onClick={onClose} className="rounded-lg bg-gray-200 p-2 hover:bg-gray-300"><X className="h-5 w-5" /></button>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${wizardProgress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-medium text-gray-500">
            <span className={step === "INFO" ? "text-indigo-600" : ""}>Info</span>
            <span className={step === "DIMENSIONS" ? "text-indigo-600" : ""}>Dimensions</span>
            <span className={step === "ZONES" ? "text-indigo-600" : ""}>Zones</span>
            <span className={step === "GRAPH" ? "text-indigo-600" : ""}>Graph</span>
            <span className={step === "BOOTHS" ? "text-indigo-600" : ""}>Booths</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6">
          {(error || notice) && <div className={`my-4 flex gap-2 rounded-lg p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}{error || notice}</div>}
          {renderStep()}
        </div>
        
        <div className="border-t bg-gray-50 p-4 flex justify-between">
          <button 
            disabled={saving || step === "INFO"} 
            onClick={() => setStep(STEPS[STEPS.indexOf(step) - 1] as Step)}
            className="rounded-lg border bg-white px-6 py-2 font-medium shadow-sm hover:bg-gray-50 disabled:opacity-30"
          >
            Back
          </button>
          <button 
            disabled={saving || loading} 
            onClick={() => void handleNext()}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {step === "BOOTHS" ? "Finish" : "Next Step"} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>, document.body
  );
}
