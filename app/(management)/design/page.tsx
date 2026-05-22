"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Pencil,
  Brush,
  Minus,
  Square,
  Circle,
  Type,
  Eraser,
  PaintBucket,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Layers,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

const TOOLS = [
  { id: "pen", label: "Pen", icon: Pencil },
  { id: "brush", label: "Brush", icon: Brush },
  { id: "line", label: "Line", icon: Minus },
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "text", label: "Text", icon: Type },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "fill", label: "Fill", icon: PaintBucket },
];

const COLORS = [
  "#C9A84C",
  "#E8C97A",
  "#8B6E2E",
  "#F0E8D5",
  "#FFFFFF",
  "#1A1610",
  "#4A4236",
  "#8A7D65",
  "#D4AF37",
  "#FFD700",
  "#B8860B",
  "#A0522D",
  "#CD853F",
  "#DEB887",
  "#F5DEB3",
  "#2C2C2A",
  "#C0C0C0",
  "#708090",
  "#DC143C",
  "#4169E1",
];

const TEMPLATES = [
  { id: "necklace", label: "Necklace" },
  { id: "ring", label: "Ring" },
  { id: "bangle", label: "Bangle" },
  { id: "earring", label: "Earring" },
];

type Layer = {
  id: string;
  name: string;
  visible: boolean;
  data: string | null;
};

export default function DesignPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#C9A84C");
  const [brushSize, setBrushSize] = useState(4);
  const [opacity, setOpacity] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [drawing, setDrawing] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    { id: "1", name: "Background", visible: true, data: null },
    { id: "2", name: "Sketch", visible: true, data: null },
    { id: "3", name: "Details", visible: true, data: null },
  ]);
  const [activeLayer, setActiveLayer] = useState("2");

  const startRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUndoStack((prev) => [...prev.slice(-29), canvas.toDataURL()]);
    setRedoStack([]);
  }, []);

  const setStyle = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
      ctx.fillStyle = color;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity / 100;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
    },
    [tool, color, brushSize, opacity],
  );

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const ctx = getCtx();
    if (!ctx) return;
    const p = getCanvasPos(e);
    startRef.current = p;
    snapshotRef.current = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
    );
    saveState();
    setDrawing(true);
    if (tool === "pen" || tool === "brush") {
      setStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = getCanvasPos(e);
    setPos(p);
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    setStyle(ctx);
    const s = startRef.current;

    if (tool === "pen" || tool === "brush") {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.clearRect(
        p.x - brushSize,
        p.y - brushSize,
        brushSize * 2,
        brushSize * 2,
      );
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
      if (tool === "line") {
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (tool === "rect") {
        ctx.strokeRect(s.x, s.y, p.x - s.x, p.y - s.y);
      } else if (tool === "circle") {
        const rx = (p.x - s.x) / 2;
        const ry = (p.y - s.y) / 2;
        ctx.ellipse(
          s.x + rx,
          s.y + ry,
          Math.abs(rx),
          Math.abs(ry),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }
  };

  const onMouseUp = () => {
    setDrawing(false);
    getCtx()?.closePath();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || undoStack.length === 0) return;
    setRedoStack((prev) => [...prev, canvas.toDataURL()]);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    const img = new Image();
    img.src = prev;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const redo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || redoStack.length === 0) return;
    setUndoStack((prev) => [...prev, canvas.toDataURL()]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    const img = new Image();
    img.src = next;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const exportCanvas = () => {
  const canvas = canvasRef.current
  if (!canvas) return
  const a = document.createElement('a')
  a.download = 'fatemi-gold-design.png'
  a.href = canvas.toDataURL()
  a.click()
}

const [saveTitle, setSaveTitle]   = useState('')
const [saveModal, setSaveModal]   = useState(false)
const [saving, setSaving]         = useState(false)
const [savedMsg, setSavedMsg]     = useState(false)

const saveDesign = async () => {
  const canvas = canvasRef.current
  if (!canvas || !saveTitle.trim()) return
  setSaving(true)
  try {
    const { supabase } = await import('@/lib/supabase_client')
    await supabase.from('designs').insert({
      title:          saveTitle.trim(),
      category:       'Sketch',
      canvas_data:    canvas.toDataURL(),
      is_ai_generated: false,
    })
    setSaveModal(false)
    setSaveTitle('')
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 3000)
  } catch (e) {
    alert('Failed to save design')
  } finally {
    setSaving(false)
  }
}

  const drawTemplate = (type: string) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (type === "necklace") {
      ctx.beginPath();
      ctx.arc(cx, cy, 160, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.1 + i * ((Math.PI * 0.8) / 6);
        const x = cx + 160 * Math.cos(a);
        const y = cy + 160 * Math.sin(a);
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 160);
      ctx.lineTo(cx, cy + 185);
      ctx.lineTo(cx + 8, cy + 160);
      ctx.stroke();
    } else if (type === "ring") {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 120, 55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 120, 55, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy - 55, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy - 55);
      ctx.lineTo(cx - 120, cy);
      ctx.moveTo(cx + 22, cy - 55);
      ctx.lineTo(cx + 120, cy);
      ctx.stroke();
    } else if (type === "bangle") {
      ctx.beginPath();
      ctx.arc(cx, cy, 150, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, 135, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + 135 * Math.cos(a), cy + 135 * Math.sin(a));
        ctx.lineTo(cx + 150 * Math.cos(a), cy + 150 * Math.sin(a));
        ctx.stroke();
      }
    } else if (type === "earring") {
      [cx - 80, cx + 80].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, cy - 60, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex, cy - 50);
        ctx.lineTo(ex, cy - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex - 20, cy - 10);
        ctx.lineTo(ex, cy + 40);
        ctx.lineTo(ex + 20, cy - 10);
        ctx.closePath();
        ctx.stroke();
      });
    }
    ctx.globalAlpha = 1;
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    );
  };

  const addLayer = () => {
    const newLayer: Layer = {
      id: String(Date.now()),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      data: null,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayer(newLayer.id);
  };

  const btnStyle = (active: boolean) => ({
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "0.5px solid",
    borderColor: active ? "var(--border-bright)" : "transparent",
    background: active ? "rgba(201,168,76,0.12)" : "transparent",
    color: active ? "var(--gold)" : "var(--text-muted)",
  });

  const labelStyle = {
    fontSize: "10px",
    color: "var(--text-dim)",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
    display: "block",
  };

  const rangeStyle = {
    width: "100%",
    appearance: "none" as const,
    height: "3px",
    background: "var(--border)",
    borderRadius: "99px",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 56px - 48px)",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* Topbar */}
      <div
        style={{
          height: "44px",
          background: "var(--surface)",
          borderBottom: "0.5px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {/* Mode buttons */}
        {["Sketch", "Vector", "Templates"].map((m) => (
          <button
            key={m}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              border: "0.5px solid",
              borderColor: m === "Sketch" ? "var(--gold)" : "var(--border)",
              background:
                m === "Sketch" ? "rgba(201,168,76,0.1)" : "transparent",
              color: m === "Sketch" ? "var(--gold)" : "var(--text-muted)",
            }}
          >
            {m}
          </button>
        ))}

        <div
          style={{
            width: "0.5px",
            height: "20px",
            background: "var(--border)",
            margin: "0 4px",
          }}
        />

        {/* History */}
        {[
          {
            icon: Undo2,
            action: undo,
            label: "Undo",
            disabled: undoStack.length === 0,
          },
          {
            icon: Redo2,
            action: redo,
            label: "Redo",
            disabled: redoStack.length === 0,
          },
          {
            icon: Trash2,
            action: clearCanvas,
            label: "Clear",
            disabled: false,
          },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.action}
            disabled={b.disabled}
            title={b.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              background: "var(--surface2)",
              border: "0.5px solid var(--border)",
              borderRadius: "6px",
              fontSize: "11px",
              color: b.disabled ? "var(--text-dim)" : "var(--text-muted)",
              cursor: b.disabled ? "not-allowed" : "pointer",
            }}
          >
            <b.icon size={13} />
            {b.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {[50, 75, 100, 150, 200].map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                cursor: "pointer",
                border: "0.5px solid",
                borderColor: zoom === z ? "var(--gold)" : "var(--border)",
                background: zoom === z ? "rgba(201,168,76,0.1)" : "transparent",
                color: zoom === z ? "var(--gold)" : "var(--text-muted)",
              }}
            >
              {z}%
            </button>
          ))}
        </div>

        <div
          style={{
            width: "0.5px",
            height: "20px",
            background: "var(--border)",
            margin: "0 4px",
          }}
        />

        <button onClick={exportCanvas} style={{
  display: 'flex', alignItems: 'center', gap: '5px',
  padding: '5px 12px', background: 'rgba(201,168,76,0.12)',
  border: '0.5px solid var(--gold)', borderRadius: '6px',
  color: 'var(--gold)', fontSize: '12px', cursor: 'pointer',
}}>
  <Download size={13} /> Export
</button>

<button onClick={() => setSaveModal(true)} style={{
  display: 'flex', alignItems: 'center', gap: '5px',
  padding: '5px 12px', background: 'var(--surface2)',
  border: '0.5px solid var(--border)', borderRadius: '6px',
  color: savedMsg ? 'var(--success)' : 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
}}>
  {savedMsg ? '✓ Saved!' : '☁ Save'}
</button>

        <a
          href="/ai-generator"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            background: "var(--surface2)",
            border: "0.5px solid var(--border)",
            borderRadius: "6px",
            color: "var(--text-muted)",
            fontSize: "12px",
            textDecoration: "none",
          }}
        >
          <Sparkles size={13} style={{ color: "var(--gold)" }} /> AI Generator
        </a>
      </div>

      {/* Main workspace */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left toolbar */}
        <div
          style={{
            width: "52px",
            background: "var(--surface)",
            borderRight: "0.5px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px 0",
            gap: "3px",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={t.label}
                style={btnStyle(tool === t.id) as React.CSSProperties}
              >
                <Icon size={16} />
              </button>
            );
          })}
          <div
            style={{
              width: "28px",
              height: "0.5px",
              background: "var(--border)",
              margin: "6px 0",
            }}
          />
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: color,
              border: "1.5px solid var(--border)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            title="Active colour"
          />
        </div>

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            position: "relative",
            background: "var(--surface3)",
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
          }}
        >
          <canvas
            ref={canvasRef}
            width={1000}
            height={520}
            style={{
              display: "block",
              cursor:
                tool === "eraser"
                  ? "cell"
                  : tool === "text"
                    ? "text"
                    : "crosshair",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
              imageRendering: "pixelated",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>

        {/* Right panel */}
        <div
          style={{
            width: "200px",
            background: "var(--surface)",
            borderLeft: "0.5px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          {/* Colors */}
          <div
            style={{
              padding: "14px",
              borderBottom: "0.5px solid var(--border)",
            }}
          >
            <span style={labelStyle}>Colours</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "5px",
                marginBottom: "10px",
              }}
            >
              {COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: c,
                    cursor: "pointer",
                    border: `1.5px solid ${color === c ? "var(--gold)" : "transparent"}`,
                    outline:
                      color === c ? "1px solid rgba(201,168,76,0.3)" : "none",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: color,
                  border: "0.5px solid var(--border)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                  Active
                </div>
                <div style={{ fontSize: "11px", color: "var(--text)" }}>
                  {color}
                </div>
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: "26px",
                  height: "26px",
                  padding: 0,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          {/* Brush */}
          <div
            style={{
              padding: "14px",
              borderBottom: "0.5px solid var(--border)",
            }}
          >
            <span style={labelStyle}>Brush</span>
            {[
              {
                label: "Size",
                val: brushSize,
                set: setBrushSize,
                min: 1,
                max: 40,
              },
              {
                label: "Opacity",
                val: opacity,
                set: setOpacity,
                min: 10,
                max: 100,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    width: "44px",
                    flexShrink: 0,
                  }}
                >
                  {s.label}
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  value={s.val}
                  onChange={(e) => s.set(Number(e.target.value))}
                  style={rangeStyle}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--gold)",
                    width: "24px",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {s.val}
                </span>
              </div>
            ))}
          </div>

          {/* Layers */}
          <div
            style={{
              padding: "14px",
              borderBottom: "0.5px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ ...labelStyle, marginBottom: 0 }}>Layers</span>
              <button
                onClick={addLayer}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Plus size={14} />
              </button>
            </div>
            {[...layers].reverse().map((layer) => (
              <div
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background:
                    activeLayer === layer.id
                      ? "rgba(201,168,76,0.08)"
                      : "transparent",
                  border: `0.5px solid ${activeLayer === layer.id ? "var(--border-bright)" : "transparent"}`,
                  marginBottom: "3px",
                }}
              >
                <Layers
                  size={12}
                  style={{ color: "var(--text-dim)", flexShrink: 0 }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: "12px",
                    color:
                      activeLayer === layer.id
                        ? "var(--text)"
                        : "var(--text-muted)",
                  }}
                >
                  {layer.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    color: layer.visible
                      ? "var(--text-muted)"
                      : "var(--text-dim)",
                  }}
                >
                  {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>
              </div>
            ))}
          </div>

          {/* Templates */}
          <div
            style={{
              padding: "14px",
              borderBottom: "0.5px solid var(--border)",
            }}
          >
            <span style={labelStyle}>Templates</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}
            >
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => drawTemplate(t.id)}
                  style={{
                    padding: "8px 6px",
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    borderRadius: "6px",
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div style={{ padding: "14px", marginTop: "auto" }}>
            <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>
              X: {Math.round(pos.x)} Y: {Math.round(pos.y)}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-dim)",
                marginTop: "3px",
              }}
            >
              Canvas: 600 × 520px
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-dim)",
                marginTop: "3px",
              }}
            >
              Zoom: {zoom}%
            </div>
          </div>
        </div>
      </div>
      {saveModal && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  }}>
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border-bright)',
      borderRadius: '12px', padding: '28px', width: '360px',
    }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', marginBottom: '16px' }}>
        Save Design
      </h2>
      <label style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
        Design Title
      </label>
      <input
        value={saveTitle}
        onChange={e => setSaveTitle(e.target.value)}
        placeholder="e.g. Bridal Necklace Sketch"
        style={{
          width: '100%', padding: '8px 12px', background: 'var(--surface2)',
          border: '0.5px solid var(--border)', borderRadius: '8px',
          color: 'var(--text)', fontSize: '13px', outline: 'none', marginBottom: '16px',
        }}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setSaveModal(false)} style={{
          flex: 1, padding: '9px', background: 'var(--surface2)',
          border: '0.5px solid var(--border)', borderRadius: '8px',
          color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={saveDesign} disabled={saving || !saveTitle.trim()} style={{
          flex: 1, padding: '9px', background: 'rgba(201,168,76,0.15)',
          border: '0.5px solid var(--gold)', borderRadius: '8px',
          color: 'var(--gold)', fontSize: '13px',
          cursor: saving || !saveTitle.trim() ? 'not-allowed' : 'pointer', fontWeight: 500,
        }}>
          {saving ? 'Saving...' : 'Save to Database'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
