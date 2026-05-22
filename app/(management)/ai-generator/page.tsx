"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase_client";
import {
  LoadingSpinner,
  ErrorMessage,
} from "@/app/components/ui/LoadingSpinner";
import type { GoldKarat } from "@/lib/types";

const STYLE_OPTIONS = [
  "Traditional Pakistani",
  "Modern Minimalist",
  "Mughal Inspired",
  "Contemporary Bridal",
  "Geometric",
  "Floral",
];
const KARAT_OPTIONS: GoldKarat[] = ["24K", "22K", "21K", "18K", "14K"];
const CATEGORY_OPTIONS = [
  "Necklace",
  "Ring",
  "Bangles",
  "Earrings",
  "Bridal Set",
  "Pendant",
  "Chain",
  "Bracelet",
];
const STONE_OPTIONS = [
  "None",
  "Diamond",
  "Ruby",
  "Emerald",
  "Sapphire",
  "Pearl",
  "Topaz",
  "Zircon",
];

const EXAMPLE_PROMPTS = [
  "A traditional Pakistani bridal necklace in 22K gold with ruby stones and intricate meenakari work",
  "Minimalist geometric gold ring in 18K with a small diamond solitaire",
  "Mughal-inspired bangle set with emerald and gold filigree patterns",
  "Modern drop earrings in 24K gold with pearl accents",
];

const GOLD_RATES: Record<string, number> = {
  "24K": 32450,
  "22K": 29745,
  "21K": 28390,
  "18K": 24340,
  "14K": 18920,
};

type SavedDesign = {
  id: string;
  title: string;
  category: string;
  karat: string;
  ai_prompt: string | null;
  created_at: string;
};

export default function AIGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Traditional Pakistani");
  const [karat, setKarat] = useState<GoldKarat>("22K");
  const [category, setCategory] = useState("Necklace");
  const [stone, setStone] = useState("None");
  const [weight, setWeight] = useState("20");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadDesigns = useCallback(async () => {
    setDbLoading(true);
    setDbError(null);
    const { data, error } = await supabase
      .from("designs")
      .select("id, title, category, karat, ai_prompt, created_at")
      .eq("is_ai_generated", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) setDbError(error.message);
    else setDesigns(data ?? []);
    setDbLoading(false);
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  const buildPrompt = () => {
    const base =
      prompt.trim() ||
      `A ${style.toLowerCase()} ${category.toLowerCase()} in ${karat} gold`;
    return `You are an expert jewellery designer for Fatemi Gold, a premium Pakistani jewellery business.

Design a detailed jewellery piece based on this request: "${base}"

Specifications:
- Karat: ${karat}
- Category: ${category}
- Style: ${style}
- Stone: ${stone}
- Approximate weight: ${weight}g
- Gold rate: ₨ ${GOLD_RATES[karat].toLocaleString()}/g

Respond with these exact sections:
**Design Title**
**Design Description**
**Key Features**
**Materials**
**Making Notes**
**Estimated Value**

Keep the tone elegant and professional, suitable for a luxury jewellery brand.`;
  };

  const generate = async () => {
    setLoading(true);
    setResult(null);
    setSaved(false);
    try {
      const response = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to generate");
      setResult(data.text);
    } catch (err: unknown) {
      setResult(
        err instanceof Error
          ? err.message
          : "Error generating design. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveDesign = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const titleMatch = result.match(/\*\*Design Title\*\*\s*\n([^\n*]+)/i);
      const title = titleMatch?.[1]?.trim() || `${style} ${category}`;
      const { error } = await supabase.from("designs").insert({
        title,
        category,
        karat,
        ai_prompt: prompt || buildPrompt(),
        canvas_data: result,
        is_ai_generated: true,
      });
      if (error) throw new Error(error.message);
      setSaved(true);
      await loadDesigns();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteDesign = async (id: string) => {
    if (!confirm("Delete this design?")) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from("designs").delete().eq("id", id);
      if (error) throw new Error(error.message);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "8px 12px",
    background: "var(--surface2)",
    border: "0.5px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "13px",
    outline: "none",
  };

  const labelStyle = {
    fontSize: "11px",
    color: "var(--text-muted)",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: "5px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Left — Config */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Prompt */}
          <div
            style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              <Sparkles size={16} style={{ color: "var(--gold)" }} />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                Describe Your Design
              </span>
            </div>
            <textarea
              placeholder="Describe the jewellery piece... or leave blank to auto-generate from settings."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              style={{
                ...fieldStyle,
                resize: "none",
                lineHeight: 1.6,
                fontFamily: "inherit",
              }}
            />
            <div style={{ marginTop: "10px" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  marginBottom: "6px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Example prompts
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "3px 0",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: "var(--border)",
                    }}
                  >
                    {p.slice(0, 65)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div
            style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text)",
                marginBottom: "16px",
              }}
            >
              Specifications
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              {[
                {
                  label: "Category",
                  key: "category",
                  options: CATEGORY_OPTIONS,
                  value: category,
                  set: setCategory,
                },
                {
                  label: "Karat",
                  key: "karat",
                  options: KARAT_OPTIONS,
                  value: karat,
                  set: (v: string) => setKarat(v as GoldKarat),
                },
                {
                  label: "Style",
                  key: "style",
                  options: STYLE_OPTIONS,
                  value: style,
                  set: setStyle,
                },
                {
                  label: "Stone",
                  key: "stone",
                  options: STONE_OPTIONS,
                  value: stone,
                  set: setStone,
                },
              ].map((f) => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <select
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    style={{ ...fieldStyle, cursor: "pointer" }}
                  >
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div>
                <label style={labelStyle}>Weight (grams)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Gold rate: ₨ {GOLD_RATES[karat].toLocaleString()}/g
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--gold)",
                      marginTop: "2px",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    ≈ ₨{" "}
                    {(
                      (Number(weight) || 0) * GOLD_RATES[karat]
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px",
              borderRadius: "10px",
              background: loading ? "var(--surface2)" : "rgba(201,168,76,0.15)",
              border: `0.5px solid ${loading ? "var(--border)" : "var(--gold)"}`,
              color: loading ? "var(--text-muted)" : "var(--gold)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {loading ? (
              <>
                <RefreshCw
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Design
              </>
            )}
          </button>
        </div>

        {/* Right — Result */}
        <div
          style={{
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            minHeight: "500px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              Generated Design
            </span>
            {result && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={copyResult}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "0.5px solid var(--border)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {copied ? (
                    <Check size={12} style={{ color: "var(--success)" }} />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={saveDesign}
                  disabled={saving || saved}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: saved
                      ? "rgba(39,174,96,0.12)"
                      : "rgba(201,168,76,0.12)",
                    border: `0.5px solid ${saved ? "var(--success)" : "var(--gold)"}`,
                    borderRadius: "6px",
                    padding: "4px 10px",
                    color: saved ? "var(--success)" : "var(--gold)",
                    fontSize: "11px",
                    cursor: saving || saved ? "default" : "pointer",
                  }}
                >
                  <Download size={12} />
                  {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
                </button>
              </div>
            )}
          </div>

          {!result && !loading && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <Sparkles
                size={40}
                style={{ color: "var(--border-bright)", opacity: 0.4 }}
              />
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-dim)",
                  textAlign: "center",
                }}
              >
                Configure your specs and click Generate
              </div>
            </div>
          )}

          {loading && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--gold)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                AI is crafting your design...
              </div>
            </div>
          )}

          {result && !loading && (
            <div
              style={{
                flex: 1,
                fontSize: "13px",
                color: "var(--text)",
                lineHeight: 1.8,
                overflowY: "auto",
              }}
            >
              {result.split("\n").map((line, i) => {
                const isBold = line.startsWith("**") && line.endsWith("**");
                const isBullet = line.startsWith("- ");
                if (isBold)
                  return (
                    <div
                      key={i}
                      style={{
                        color: "var(--gold)",
                        fontWeight: 600,
                        marginTop: "14px",
                        marginBottom: "4px",
                        fontSize: "12px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {line.replace(/\*\*/g, "")}
                    </div>
                  );
                if (isBullet)
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "3px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span style={{ color: "var(--gold)", flexShrink: 0 }}>
                        ·
                      </span>
                      <span>{line.slice(2)}</span>
                    </div>
                  );
                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: line ? "2px" : "6px",
                      color: "var(--text)",
                    }}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Saved Designs */}
      <div
        style={{
          background: "var(--surface)",
          border: "0.5px solid var(--border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "0.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}
          >
            Saved Designs ({designs.length})
          </span>
          <button
            onClick={loadDesigns}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              color: "var(--gold)",
            }}
          >
            Refresh
          </button>
        </div>

        {dbLoading && <LoadingSpinner text="Loading designs..." />}
        {dbError && <ErrorMessage message={dbError} onRetry={loadDesigns} />}

        {!dbLoading && !dbError && designs.length === 0 && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--text-dim)",
            }}
          >
            No saved designs yet. Generate and save one above!
          </div>
        )}

        {!dbLoading && designs.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                {["Title", "Category", "Karat", "Prompt", "Created", ""].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {designs.map((d, i) => (
                <tr
                  key={d.id}
                  style={{
                    borderBottom:
                      i < designs.length - 1
                        ? "0.5px solid var(--border)"
                        : "none",
                    opacity: deleting === d.id ? 0.4 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Sparkles
                        size={13}
                        style={{ color: "var(--gold)", flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--text)",
                          fontWeight: 500,
                        }}
                      >
                        {d.title}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {d.category}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      color: "var(--gold)",
                    }}
                  >
                    {d.karat}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "11px",
                      color: "var(--text-dim)",
                      maxWidth: "200px",
                    }}
                  >
                    <div
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {d.ai_prompt?.slice(0, 60) ?? "—"}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {d.created_at?.slice(0, 10)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => deleteDesign(d.id)}
                      disabled={deleting === d.id}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--danger)",
                        padding: "3px",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
