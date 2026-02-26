"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  QUALITY_DIMENSIONS,
  SCORE_LABELS,
  type EngagementScore,
} from "@/lib/types";

interface Props {
  engagementId: number;
  existingScores: EngagementScore[];
}

interface ScoreEntry {
  dimension_key: string;
  score: number;
  weight: number;
  notes: string;
}

export default function ScoringForm({ engagementId, existingScores }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<ScoreEntry[]>(() =>
    QUALITY_DIMENSIONS.map((dim) => {
      const existing = existingScores.find(
        (s) => s.dimension_key === dim.key
      );
      return {
        dimension_key: dim.key,
        score: existing?.score ?? 3,
        weight: existing?.weight ?? dim.default_weight,
        notes: existing?.notes ?? "",
      };
    })
  );

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);

  function updateEntry(index: number, field: keyof ScoreEntry, value: string | number) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (totalWeight !== 100) {
      setError(`Weights must sum to 100 (currently ${totalWeight})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/engagements/${engagementId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: entries.map((e) => ({
            dimension_key: e.dimension_key,
            score: e.score,
            weight: e.weight,
            notes: e.notes || null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save scores");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-3 font-medium text-gray-700 w-1/4">
                Dimension
              </th>
              <th className="py-2 px-3 font-medium text-gray-700 w-48">
                Score (1–5)
              </th>
              <th className="py-2 px-3 font-medium text-gray-700 w-24">
                Weight %
              </th>
              <th className="py-2 pl-3 font-medium text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry, index) => {
              const dim = QUALITY_DIMENSIONS.find(
                (d) => d.key === entry.dimension_key
              )!;
              return (
                <tr key={entry.dimension_key}>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-gray-900">{dim.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dim.description}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={entry.score}
                        onChange={(e) =>
                          updateEntry(index, "score", Number(e.target.value))
                        }
                        className="w-24 accent-blue-600"
                      />
                      <span className="text-sm font-semibold text-gray-900 w-6 text-center">
                        {entry.score}
                      </span>
                      <span className="text-xs text-gray-500">
                        {SCORE_LABELS[entry.score]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="form-input w-20 text-center"
                      value={entry.weight}
                      onChange={(e) =>
                        updateEntry(index, "weight", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="py-3 pl-3">
                    <input
                      type="text"
                      className="form-input"
                      value={entry.notes}
                      onChange={(e) =>
                        updateEntry(index, "notes", e.target.value)
                      }
                      placeholder="Optional notes..."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm">
          Total weight:{" "}
          <span
            className={`font-semibold ${
              totalWeight === 100 ? "text-green-700" : "text-red-600"
            }`}
          >
            {totalWeight}%
          </span>
          {totalWeight !== 100 && (
            <span className="text-red-600 ml-1">(must be 100%)</span>
          )}
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || totalWeight !== 100}
        >
          {loading
            ? "Saving..."
            : existingScores.length > 0
            ? "Update Scores"
            : "Save Scores"}
        </button>
      </div>
    </form>
  );
}
