"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ENGAGEMENT_TYPES,
  RISK_LEVELS,
  type Engagement,
  type EngagementType,
  type RiskLevel,
} from "@/lib/types";

interface Props {
  mode: "create" | "edit";
  initial?: Engagement;
}

export default function EngagementForm({ mode, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientName, setClientName] = useState(initial?.client_name ?? "");
  const [engagementType, setEngagementType] = useState<EngagementType>(
    initial?.engagement_type ?? "statutory_audit"
  );
  const [yearEnd, setYearEnd] = useState(initial?.financial_year_end ?? "");
  const [partnerName, setPartnerName] = useState(initial?.partner_name ?? "");
  const [office, setOffice] = useState(initial?.office ?? "");
  const [inherentRisk, setInherentRisk] = useState<RiskLevel>(
    initial?.inherent_risk ?? "moderate"
  );
  const [controlRisk, setControlRisk] = useState<RiskLevel>(
    initial?.control_risk ?? "moderate"
  );
  const [overallRmm, setOverallRmm] = useState<RiskLevel>(
    initial?.overall_rmm ?? "moderate"
  );
  const [testingExtent, setTestingExtent] = useState<RiskLevel>(
    initial?.substantive_testing_extent ?? "moderate"
  );
  const [scoredBy, setScoredBy] = useState(initial?.scored_by ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      client_name: clientName,
      engagement_type: engagementType,
      financial_year_end: yearEnd,
      partner_name: partnerName,
      office,
      inherent_risk: inherentRisk,
      control_risk: controlRisk,
      overall_rmm: overallRmm,
      substantive_testing_extent: testingExtent,
      scored_by: scoredBy || null,
    };

    try {
      const url =
        mode === "create"
          ? "/api/engagements"
          : `/api/engagements/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save engagement");
      }

      const saved = await res.json();
      router.push(`/quality-score/engagements/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Client Name *</label>
          <input
            type="text"
            className="form-input"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">Engagement Type *</label>
          <select
            className="form-select"
            value={engagementType}
            onChange={(e) => setEngagementType(e.target.value as EngagementType)}
            required
          >
            {ENGAGEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Financial Year End *</label>
          <input
            type="date"
            className="form-input"
            value={yearEnd}
            onChange={(e) => setYearEnd(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">Engagement Partner *</label>
          <input
            type="text"
            className="form-input"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">Office</label>
          <input
            type="text"
            className="form-input"
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            placeholder="e.g. London, New York"
          />
        </div>
        <div>
          <label className="form-label">Scored By</label>
          <input
            type="text"
            className="form-input"
            value={scoredBy}
            onChange={(e) => setScoredBy(e.target.value)}
            placeholder="Reviewer name"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Risk Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Inherent Risk *</label>
            <select
              className="form-select"
              value={inherentRisk}
              onChange={(e) => setInherentRisk(e.target.value as RiskLevel)}
              required
            >
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Control Risk *</label>
            <select
              className="form-select"
              value={controlRisk}
              onChange={(e) => setControlRisk(e.target.value as RiskLevel)}
              required
            >
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Overall RMM *</label>
            <select
              className="form-select"
              value={overallRmm}
              onChange={(e) => setOverallRmm(e.target.value as RiskLevel)}
              required
            >
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Substantive Testing Extent *</label>
            <select
              className="form-select"
              value={testingExtent}
              onChange={(e) => setTestingExtent(e.target.value as RiskLevel)}
              required
            >
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create Engagement"
            : "Update Engagement"}
        </button>
      </div>
    </form>
  );
}
