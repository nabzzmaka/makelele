"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROFIT_CENTER_OPTIONS,
  LEADER_LEVEL_OPTIONS,
  type Partner,
} from "@/lib/types";

interface PartnerFormProps {
  mode: "create" | "edit";
  initialData?: Partner;
}

export default function PartnerForm({ mode, initialData }: PartnerFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [partnerId, setPartnerId] = useState(initialData?.partner_id ?? "");
  const [partnerName, setPartnerName] = useState(initialData?.partner_name ?? "");
  const [profitCenter, setProfitCenter] = useState(
    initialData?.profit_center ?? PROFIT_CENTER_OPTIONS[0]
  );
  const [leaderLevel, setLeaderLevel] = useState(
    initialData?.leader_level ?? LEADER_LEVEL_OPTIONS[0]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      partner_id: partnerId,
      partner_name: partnerName,
      profit_center: profitCenter,
      leader_level: leaderLevel,
    };

    try {
      const url =
        mode === "create"
          ? "/api/partners"
          : `/api/partners/${initialData!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save partner");
        setSubmitting(false);
        return;
      }

      const saved = await res.json();
      router.push(`/risikoscoring/partners/${saved.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5 max-w-xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="partnerId" className="form-label">
          Partner-ID *
        </label>
        <input
          id="partnerId"
          type="text"
          className="form-input"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          required
          disabled={mode === "edit"}
        />
      </div>

      <div>
        <label htmlFor="partnerName" className="form-label">
          Navn *
        </label>
        <input
          id="partnerName"
          type="text"
          className="form-input"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="profitCenter" className="form-label">
          Profit Center *
        </label>
        <select
          id="profitCenter"
          className="form-select"
          value={profitCenter}
          onChange={(e) => setProfitCenter(e.target.value)}
        >
          {PROFIT_CENTER_OPTIONS.map((pc) => (
            <option key={pc} value={pc}>
              {pc}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="leaderLevel" className="form-label">
          Ledernivå *
        </label>
        <select
          id="leaderLevel"
          className="form-select"
          value={leaderLevel}
          onChange={(e) => setLeaderLevel(e.target.value)}
        >
          {LEADER_LEVEL_OPTIONS.map((ll) => (
            <option key={ll} value={ll}>
              {ll}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting
            ? "Lagrer…"
            : mode === "create"
            ? "Opprett partner"
            : "Lagre endringer"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
