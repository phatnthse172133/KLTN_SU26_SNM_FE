/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { LayoutNode, LayoutEdge, LayoutNodeType, Zone } from "@/application/features/marketLayouts/marketLayoutService";
import { MousePointer2, PlusCircle, Link as LinkIcon, Trash2, Check } from "lucide-react";

interface GraphDesignerCanvasProps {
  layoutId: string;
  width: number;
  height: number;
  initialNodes: LayoutNode[];
  initialEdges: LayoutEdge[];
  zones: Zone[];
  onSave: (nodes: LayoutNode[], edges: LayoutEdge[]) => Promise<void>;
}

type Tool = "SELECT" | "ADD_NODE" | "ADD_EDGE";

export function GraphDesignerCanvas({
  layoutId,
  width,
  height,
  initialNodes,
  initialEdges,
  zones,
  onSave,
}: GraphDesignerCanvasProps) {
  const [nodes, setNodes] = useState<LayoutNode[]>(initialNodes);
  const [edges, setEdges] = useState<LayoutEdge[]>(initialEdges);
  const [tool, setTool] = useState<Tool>("SELECT");
  const [activeNodeType, setActiveNodeType] = useState<LayoutNodeType>("Junction");
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) return;
    if (tool === "SELECT") {
      // Clicked on background
      if ((e.target as Element).tagName === "svg") {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setEdgeStartNodeId(null);
      }
    } else if (tool === "ADD_NODE") {
      if (!svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;
      const svgP = pt.matrixTransform(ctm.inverse());
      
      const newNode: LayoutNode = {
        id: crypto.randomUUID(),
        layoutId,
        nodeType: activeNodeType,
        xCoordinate: Math.max(0, Math.min(width, Math.round(svgP.x * 100) / 100)),
        yCoordinate: Math.max(0, Math.min(height, Math.round(svgP.y * 100) / 100)),
        isAccessible: true,
        isStartingPoint: activeNodeType === "Entrance",
      };
      setNodes([...nodes, newNode]);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (tool === "SELECT") {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
    } else if (tool === "ADD_EDGE") {
      if (!edgeStartNodeId) {
        setEdgeStartNodeId(nodeId);
      } else {
        if (edgeStartNodeId !== nodeId) {
          const exists = edges.some(edge => 
            (edge.fromNodeId === edgeStartNodeId && edge.toNodeId === nodeId) ||
            (edge.fromNodeId === nodeId && edge.toNodeId === edgeStartNodeId)
          );
          if (!exists) {
            const startNode = nodes.find(n => n.id === edgeStartNodeId)!;
            const endNode = nodes.find(n => n.id === nodeId)!;
            const distance = Math.sqrt(Math.pow(startNode.xCoordinate - endNode.xCoordinate, 2) + Math.pow(startNode.yCoordinate - endNode.yCoordinate, 2));
            const newEdge: LayoutEdge = {
              id: crypto.randomUUID(),
              layoutId,
              fromNodeId: edgeStartNodeId,
              toNodeId: nodeId,
              distance: Math.round(distance * 100) / 100,
              isBidirectional: true,
              isAccessible: true,
            };
            setEdges([...edges, newEdge]);
          }
        }
        setEdgeStartNodeId(null); // Reset after connection
      }
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (tool !== "SELECT") return;
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startNode = nodes.find(n => n.id === nodeId)!;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!svgRef.current) return;
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;
      
      const dx = (moveEvent.clientX - startX) / ctm.a;
      const dy = (moveEvent.clientY - startY) / ctm.d;
      
      setNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            xCoordinate: Math.max(0, Math.min(width, startNode.xCoordinate + dx)),
            yCoordinate: Math.max(0, Math.min(height, startNode.yCoordinate + dy)),
          };
        }
        return n;
      }));
    };
    
    const handleMouseUp = () => {
      setTimeout(() => setIsDragging(false), 10);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      setNodes(nodes.filter(n => n.id !== selectedNodeId));
      setEdges(edges.filter(e => e.fromNodeId !== selectedNodeId && e.toNodeId !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges(edges.filter(e => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Prevent deleting if typing in an input
        if (document.activeElement?.tagName === "INPUT") return;
        handleDelete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, nodes, edges]);

  const getNodeColor = (type: LayoutNodeType) => {
    switch (type) {
      case "Entrance": return "#22c55e"; // green
      case "Exit": return "#ef4444"; // red
      case "BoothAccess": return "#3b82f6"; // blue
      case "Landmark": return "#a855f7"; // purple
      default: return "#64748b"; // gray
    }
  };

  return (
    <div className="flex h-[600px] w-full flex-col overflow-hidden rounded-xl border bg-gray-50">
      <div className="flex items-center justify-between border-b bg-white p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => { setTool("SELECT"); setEdgeStartNodeId(null); }} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${tool === "SELECT" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}>
            <MousePointer2 className="h-4 w-4" /> Select
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <button onClick={() => { setTool("ADD_NODE"); setEdgeStartNodeId(null); }} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${tool === "ADD_NODE" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}>
            <PlusCircle className="h-4 w-4" /> Add Node
          </button>
          {tool === "ADD_NODE" && (
            <select value={activeNodeType} onChange={e => setActiveNodeType(e.target.value as LayoutNodeType)} className="rounded-lg border px-2 py-1 text-sm outline-none">
              <option value="Junction">Junction</option>
              <option value="Entrance">Entrance</option>
              <option value="Exit">Exit</option>
              <option value="BoothAccess">BoothAccess</option>
              <option value="Landmark">Landmark</option>
            </select>
          )}
          <div className="h-6 w-px bg-gray-300" />
          <button onClick={() => { setTool("ADD_EDGE"); setEdgeStartNodeId(null); }} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${tool === "ADD_EDGE" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}>
            <LinkIcon className="h-4 w-4" /> Connect
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={!selectedNodeId && !selectedEdgeId} onClick={handleDelete} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
            <Trash2 className="h-5 w-5" />
          </button>
          <button onClick={() => void onSave(nodes, edges)} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            <Check className="h-4 w-4" /> Save Graph
          </button>
        </div>
      </div>
      
      <div className="relative flex-1 overflow-auto bg-gray-100" style={{ cursor: tool === "ADD_NODE" ? "crosshair" : "default" }}>
        {/* SVG Canvas representing physical dimensions. E.g. 1 meter = 10px? 
            Let's use viewBox to scale width/height to SVG coordinates 1:1, so SVG native coordinates are exactly meters.
        */}
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          className="bg-white shadow-sm"
          style={{ width: `${Math.max(width * 5, 800)}px`, height: `${Math.max(height * 5, 600)}px`, margin: '20px auto' }} // Base scaling 5px per meter, just for display, viewBox keeps logical units.
          onMouseDown={handleSVGClick}
        >
          <defs>
            <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e5e7eb" strokeWidth="0.05"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Edges */}
          {edges.map(edge => {
            const startNode = nodes.find(n => n.id === edge.fromNodeId);
            const endNode = nodes.find(n => n.id === edge.toNodeId);
            if (!startNode || !endNode) return null;
            return (
              <line
                key={edge.id}
                x1={startNode.xCoordinate}
                y1={startNode.yCoordinate}
                x2={endNode.xCoordinate}
                y2={endNode.yCoordinate}
                stroke={selectedEdgeId === edge.id ? "#6366f1" : (edgeStartNodeId === edge.fromNodeId || edgeStartNodeId === edge.toNodeId) ? "#a5b4fc" : "#94a3b8"}
                strokeWidth={selectedEdgeId === edge.id ? 0.8 : 0.4}
                className="cursor-pointer transition-colors duration-200"
                onClick={(e) => { e.stopPropagation(); if(tool === "SELECT") setSelectedEdgeId(edge.id); }}
              />
            );
          })}
          
          {/* Nodes */}
          {nodes.map(node => (
            <g 
              key={node.id} 
              transform={`translate(${node.xCoordinate}, ${node.yCoordinate})`}
              className={`cursor-pointer ${isDragging && selectedNodeId === node.id ? 'opacity-75' : ''}`}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
            >
              <circle
                r={selectedNodeId === node.id ? 1.5 : 1.2}
                fill={getNodeColor(node.nodeType)}
                stroke={selectedNodeId === node.id || edgeStartNodeId === node.id ? "#000" : "transparent"}
                strokeWidth={0.2}
                className="transition-all duration-200 hover:opacity-80"
              />
              {tool === "SELECT" && selectedNodeId === node.id && (
                <text x="2" y="-2" fontSize="0.8" fill="#333" className="pointer-events-none font-medium">
                  {node.nodeType} {node.nodeName ? `(${node.nodeName})` : ''}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      
      {/* Node Properties Panel */}
      {selectedNodeId && tool === "SELECT" && (
        <div className="absolute bottom-4 left-4 z-10 w-64 rounded-xl border bg-white p-4 shadow-lg">
          <h4 className="mb-2 font-semibold">Node Properties</h4>
          <div className="space-y-2 text-sm">
            {(() => {
              const node = nodes.find(n => n.id === selectedNodeId);
              if (!node) return null;
              return (
                <>
                  <div>
                    <label className="block text-gray-500">Name</label>
                    <input 
                      type="text" 
                      value={node.nodeName || ""} 
                      onChange={e => setNodes(nodes.map(n => n.id === node.id ? { ...n, nodeName: e.target.value } : n))}
                      className="w-full rounded border px-2 py-1" 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500">Zone</label>
                    <select 
                      value={node.zoneId || ""} 
                      onChange={e => setNodes(nodes.map(n => n.id === node.id ? { ...n, zoneId: e.target.value || undefined } : n))}
                      className="w-full rounded border px-2 py-1"
                    >
                      <option value="">None</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.zoneName}</option>)}
                    </select>
                  </div>
                  <div className="text-gray-600">
                    X: {node.xCoordinate.toFixed(2)}m, Y: {node.yCoordinate.toFixed(2)}m
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
