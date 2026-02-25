"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RemediationAction, RemediationStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface Props {
  deficiencyId: number;
  actions: RemediationAction[];
}

const STATUS_OPTIONS: { value: RemediationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function RemediationActions({ deficiencyId, actions }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    description: "",
    assigned_to: "",
    due_date: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function addAction(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deficiency_id: deficiencyId, ...form }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add action");
      }

      setForm({ description: "", assigned_to: "", due_date: "" });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(action: RemediationAction, status: RemediationStatus) {
    const completed_date =
      status === "completed" ? new Date().toISOString().split("T")[0] : null;

    await fetch(`/api/remediation/${action.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...action, status, completed_date }),
    });

    router.refresh();
  }

  async function deleteAction(id: number) {
    if (!confirm("Delete this remediation action?")) return;
    await fetch(`/api/remediation/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Remediation Actions{" "}
          <span className="text-gray-500 font-normal text-sm">
            ({actions.length})
          </span>
        </h2>
        {!showForm && (
          <button
            className="btn-secondary text-xs"
            onClick={() => setShowForm(true)}
          >
            + Add Action
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={addAction}
          className="card p-4 space-y-3 border-blue-200 bg-blue-50"
        >
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <div>
            <label className="form-label" htmlFor="ra-description">
              Action Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ra-description"
              name="description"
              required
              className="form-textarea"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the remediation action to be taken..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label" htmlFor="ra-assigned">
                Assigned To
              </label>
              <input
                id="ra-assigned"
                name="assigned_to"
                className="form-input"
                value={form.assigned_to}
                onChange={handleChange}
                placeholder="Person responsible"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="ra-due">
                Due Date
              </label>
              <input
                id="ra-due"
                name="due_date"
                type="date"
                className="form-input"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Adding…" : "Add Action"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {actions.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
          No remediation actions recorded yet.
        </p>
      )}

      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{action.description}</p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
                  {action.assigned_to && (
                    <span>Assigned to: <strong>{action.assigned_to}</strong></span>
                  )}
                  {action.due_date && (
                    <span>Due: <strong>{action.due_date}</strong></span>
                  )}
                  {action.completed_date && (
                    <span>Completed: <strong>{action.completed_date}</strong></span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge kind="remediation" value={action.status} />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <select
                className="form-select text-xs py-1 w-36"
                value={action.status}
                onChange={(e) =>
                  updateStatus(action, e.target.value as RemediationStatus)
                }
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                className="text-xs text-red-500 hover:text-red-700"
                onClick={() => deleteAction(action.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
