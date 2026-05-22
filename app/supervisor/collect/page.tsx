"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase_client";
import { useAuth } from "@/lib/AuthContext";
import { CheckCircle, Clock, Search, Edit2 } from "lucide-react";
import {
  LoadingSpinner,
  ErrorMessage,
} from "@/app/components/ui/LoadingSpinner";

type DoneTask = {
  id: string;
  process_name: string;
  wage_type: string;
  wage_rate: number | null;
  fixed_wage: number | null;
  calculated_wage: number | null;
  status: string;
  done_at: string | null;
  notes: string | null;
  production_order: {
    id: string;
    item_name: string;
    karat: string;
    weight_grams: number;
  };
  worker: {
    id: string;
    name: string;
  };
};

export default function SupervisorCollectPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DoneTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DoneTask | null>(null);
  const [actualWage, setActualWage] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("production_tasks")
        .select(
          `
          id, process_name, wage_type, wage_rate,
          fixed_wage, calculated_wage, status,
          done_at, notes,
          production_order:production_orders(
            id, item_name, karat, weight_grams
          ),
          worker:employees!production_tasks_assigned_to_fkey(
            id, name
          )
        `,
        )
        .eq("status", "done")
        .is("deleted_at", null)
        .order("done_at", { ascending: true });
      if (error) throw new Error(error.message);
      setTasks((data ?? []) as unknown as DoneTask[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const sub = supabase
      .channel("collect-tasks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "production_tasks",
        },
        loadTasks,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [loadTasks]);

  const openCollect = (task: DoneTask) => {
    setSelected(task);
    const suggested =
      task.wage_type === "per_gram" && task.calculated_wage
        ? String(task.calculated_wage)
        : task.wage_type === "fixed" && task.fixed_wage
          ? String(task.fixed_wage)
          : "";
    setActualWage(suggested);
  };

  const handleCollect = async () => {
    if (!selected || !actualWage) return alert("Enter wage amount");
    setCollecting(true);
    try {
      const supervisorEmp = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const supervisorId = supervisorEmp.data?.id;

      const { error: updateError } = await supabase
        .from("production_tasks")
        .update({
          status: "collected",
          actual_wage: Number(actualWage),
          wage_status: "supervisor_entered",
          wage_entered_by: supervisorId,
          collected_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      if (updateError) throw new Error(updateError.message);

      // Notify worker — wage pending approval
      await supabase.from("notifications").insert({
        to_employee_id: selected.worker.id,
        from_employee_id: supervisorId,
        type: "wage_entered",
        title: "Wage Submitted",
        body: `Your wage of ₨${Number(actualWage).toLocaleString()} for ${selected.process_name} (${selected.production_order.item_name}) has been submitted for admin approval.`,
        reference_id: selected.id,
        reference_type: "production_task",
      });

      // Notify admin — needs approval
      const adminEmp = await supabase
        .from("employees")
        .select("id")
        .eq("role", "admin")
        .single();

      if (adminEmp.data) {
        await supabase.from("notifications").insert({
          to_employee_id: adminEmp.data.id,
          from_employee_id: supervisorId,
          type: "wage_entered",
          title: "Wage Approval Required",
          body: `${selected.worker.name} — ${selected.process_name} for ${selected.production_order.item_name} · ₨${Number(actualWage).toLocaleString()}`,
          reference_id: selected.id,
          reference_type: "production_task",
        });
      }

      setSuccessId(selected.id);
      setSelected(null);
      setActualWage("");
      await loadTasks();
      setTimeout(() => setSuccessId(null), 4000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to collect");
    } finally {
      setCollecting(false);
    }
  };

  const filtered = tasks.filter(
    (t) =>
      t.worker.name.toLowerCase().includes(search.toLowerCase()) ||
      t.production_order.item_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      t.process_name.toLowerCase().includes(search.toLowerCase()),
  );

  const waitingHours = (doneAt: string | null) => {
    if (!doneAt) return "—";
    const diff = Date.now() - new Date(doneAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) return <LoadingSpinner text="Loading completed tasks..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTasks} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            color: "var(--text)",
          }}
        >
          Collect Pieces
        </h1>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            marginTop: "4px",
          }}
        >
          Workers who have marked their task as done — collect the piece and
          confirm wage
        </div>
      </div>

      {successId && (
        <div
          style={{
            padding: "14px 18px",
            background: "rgba(39,174,96,0.12)",
            border: "0.5px solid var(--success)",
            borderRadius: "10px",
            color: "var(--success)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={16} />
          Piece collected. Wage submitted for admin approval. Worker has been
          notified.
        </div>
      )}

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--surface)",
          border: "0.5px solid var(--border)",
          borderRadius: "8px",
          padding: "8px 14px",
        }}
      >
        <Search size={14} style={{ color: "var(--text-muted)" }} />
        <input
          placeholder="Search by worker, item, process..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontSize: "13px",
            flex: 1,
          }}
        />
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            border: "0.5px dashed var(--border)",
            borderRadius: "12px",
            color: "var(--text-dim)",
            fontSize: "14px",
          }}
        >
          <CheckCircle
            size={40}
            style={{ marginBottom: "12px", opacity: 0.3 }}
          />
          <div>No pieces waiting for collection</div>
          <div
            style={{
              fontSize: "12px",
              marginTop: "6px",
              color: "var(--text-dim)",
            }}
          >
            Workers will appear here when they mark their task as done
          </div>
        </div>
      )}

      {/* Tasks Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "14px",
        }}
      >
        {filtered.map((task) => {
          const suggestedWage =
            task.wage_type === "per_gram" && task.calculated_wage
              ? task.calculated_wage
              : task.wage_type === "fixed" && task.fixed_wage
                ? task.fixed_wage
                : null;

          return (
            <div
              key={task.id}
              style={{
                background: "var(--surface)",
                border: "0.5px solid var(--border-bright)",
                borderRadius: "12px",
                padding: "18px",
                borderLeft: "3px solid var(--warning)",
              }}
            >
              {/* Worker */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(201,168,76,0.15)",
                    color: "var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {task.worker.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    {task.worker.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Waiting: {waitingHours(task.done_at)}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "3px 10px",
                      borderRadius: "99px",
                      background: "rgba(230,126,34,0.12)",
                      color: "var(--warning)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Clock size={10} /> Ready
                  </span>
                </div>
              </div>

              {/* Piece details */}
              <div
                style={{
                  background: "var(--surface2)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text)",
                    marginBottom: "4px",
                  }}
                >
                  {task.production_order.item_name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                  }}
                >
                  {task.production_order.karat} ·{" "}
                  {task.production_order.weight_grams}g
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "99px",
                      background: "rgba(201,168,76,0.1)",
                      color: "var(--gold)",
                      border: "0.5px solid var(--border-bright)",
                    }}
                  >
                    {task.process_name}
                  </span>
                </div>
              </div>

              {/* Suggested wage */}
              {suggestedWage !== null && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "rgba(39,174,96,0.06)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    {task.wage_type === "per_gram"
                      ? "Calculated wage"
                      : "Fixed wage"}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--success)",
                      fontWeight: 500,
                    }}
                  >
                    ₨ {Number(suggestedWage).toLocaleString()}
                  </span>
                </div>
              )}

              {task.wage_type === "after_work" && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(201,168,76,0.06)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  Wage to be decided at collection
                </div>
              )}

              {/* Replace the existing single button with these two: */}
              <div style={{ display: "flex", gap: "8px" }}>
                {/* Edit wage — only if already submitted */}
                <button
                  onClick={() => openCollect(task)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <Edit2 size={13} /> Edit Wage
                </button>
                <button
                  onClick={() => openCollect(task)}
                  style={{
                    flex: 2,
                    padding: "10px",
                    background: "rgba(201,168,76,0.12)",
                    border: "0.5px solid var(--gold)",
                    borderRadius: "8px",
                    color: "var(--gold)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Collect & Confirm Wage
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collection Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border-bright)",
              borderRadius: "14px",
              width: "420px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "0.5px solid var(--border)",
                background: "var(--surface2)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  color: "var(--gold)",
                  marginBottom: "4px",
                }}
              >
                Collect Piece
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Confirm collection and set final wage
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Summary */}
              <div
                style={{
                  background: "var(--surface2)",
                  border: "0.5px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "20px",
                }}
              >
                {[
                  { label: "Worker", value: selected.worker.name },
                  { label: "Item", value: selected.production_order.item_name },
                  { label: "Karat", value: selected.production_order.karat },
                  {
                    label: "Weight",
                    value: `${selected.production_order.weight_grams}g`,
                  },
                  { label: "Process", value: selected.process_name },
                  {
                    label: "Wage Type",
                    value:
                      selected.wage_type === "per_gram"
                        ? "Per Gram"
                        : selected.wage_type === "fixed"
                          ? "Fixed"
                          : "After Work",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: "0.5px solid var(--border)",
                    }}
                  >
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wage input */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  FINAL WAGE (PKR) *
                </label>
                <input
                  type="number"
                  value={actualWage}
                  onChange={(e) => setActualWage(e.target.value)}
                  placeholder="Enter wage amount"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border-bright)",
                    borderRadius: "8px",
                    color: "var(--text)",
                    fontSize: "18px",
                    outline: "none",
                    textAlign: "center",
                    fontFamily: "var(--font-display)",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    marginTop: "6px",
                    textAlign: "center",
                  }}
                >
                  This will be sent to admin for approval
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setSelected(null);
                    setActualWage("");
                  }}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCollect}
                  disabled={collecting || !actualWage}
                  style={{
                    flex: 2,
                    padding: "11px",
                    background:
                      collecting || !actualWage
                        ? "var(--surface2)"
                        : "rgba(201,168,76,0.15)",
                    border: `0.5px solid ${collecting || !actualWage ? "var(--border)" : "var(--gold)"}`,
                    borderRadius: "8px",
                    color:
                      collecting || !actualWage
                        ? "var(--text-dim)"
                        : "var(--gold)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor:
                      collecting || !actualWage ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {collecting ? (
                    <>
                      <div
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          border: "1.5px solid var(--border)",
                          borderTopColor: "var(--gold)",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} /> Confirm Collection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
