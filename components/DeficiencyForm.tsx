"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ISQM1_COMPONENTS,
  type Deficiency,
  type DeficiencyNature,
  type DeficiencySeverity,
  type DeficiencyStatus,
} from "@/lib/types";

interface Props {
  initial?: Partial<Deficiency>;
  mode: "create" | "edit";
}

export default function DeficiencyForm({ initial = {}, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initial.title ?? "",
    description: initial.description ?? "",
    component: initial.component ?? ISQM1_COMPONENTS[0],
    nature: (initial.nature ?? "root_cause") as DeficiencyNature,
    severity: (initial.severity ?? "minor") as DeficiencySeverity,
    status: (initial.status ?? "open") as DeficiencyStatus,
    identified_by: initial.identified_by ?? "",
    identified_date: initial.identified_date ?? "",
  });

  function handle(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url =
      mode === "create"
        ? "/api/deficiencies"
        : `/api/deficiencies/${initial.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      const saved: Deficiency = await res.json();
      router.push(`/deficiencies/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="form-label" htmlFor="title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          className="form-input"
          value={form.title}
          onChange={handle}
          placeholder="Brief description of the deficiency"
        />
      </div>

      {/* Description */}
      <div>
        <label className="form-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="form-textarea"
          value={form.description}
          onChange={handle}
          placeholder="Detailed description of the deficiency observed..."
          rows={4}
        />
      </div>

      {/* ISQM 1 Component */}
      <div>
        <label className="form-label" htmlFor="component">
          ISQM 1 Component <span className="text-red-500">*</span>
        </label>
        <select
          id="component"
          name="component"
          required
          className="form-select"
          value={form.component}
          onChange={handle}
        >
          {ISQM1_COMPONENTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Nature */}
        <div>
          <label className="form-label" htmlFor="nature">
            Nature <span className="text-red-500">*</span>
          </label>
          <select
            id="nature"
            name="nature"
            required
            className="form-select"
            value={form.nature}
            onChange={handle}
          >
            <option value="root_cause">Root Cause</option>
            <option value="symptom">Symptom</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Is this the underlying cause or a surface-level indicator?
          </p>
        </div>

        {/* Severity */}
        <div>
          <label className="form-label" htmlFor="severity">
            Severity <span className="text-red-500">*</span>
          </label>
          <select
            id="severity"
            name="severity"
            required
            className="form-select"
            value={form.severity}
            onChange={handle}
          >
            <option value="minor">Minor</option>
            <option value="significant">Significant</option>
            <option value="pervasive">Pervasive</option>
          </select>
        </div>

        {/* Status (only on edit) */}
        {mode === "edit" && (
          <div>
            <label className="form-label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="form-select"
              value={form.status}
              onChange={handle}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identified by */}
        <div>
          <label className="form-label" htmlFor="identified_by">
            Identified By
          </label>
          <input
            id="identified_by"
            name="identified_by"
            className="form-input"
            value={form.identified_by}
            onChange={handle}
            placeholder="Name or team"
          />
        </div>

        {/* Identified date */}
        <div>
          <label className="form-label" htmlFor="identified_date">
            Date Identified
          </label>
          <input
            id="identified_date"
            name="identified_date"
            type="date"
            className="form-input"
            value={form.identified_date}
            onChange={handle}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? "Saving…"
            : mode === "create"
            ? "Register Deficiency"
            : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
