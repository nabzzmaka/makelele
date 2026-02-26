import Link from "next/link";
import getDb from "@/lib/db";
import type {
  Engagement,
  EngagementScore,
  ScoreFlag,
} from "@/lib/types";
import { QUALITY_DIMENSIONS, SCORE_LABELS, ENGAGEMENT_TYPES, RISK_LEVELS } from "@/lib/types";
import {
  calculateWeightedScore,
  detectFlags,
  generateNarrative,
  getScoreBarColour,
} from "@/lib/scoring";
import ScoreGauge from "@/components/ScoreGauge";
import ScoringForm from "@/components/ScoringForm";
import FlagBadge from "@/components/FlagBadge";
import DeleteButton from "@/components/DeleteButton";

async function getEngagement(id: string) {
  const db = getDb();
  const engagement = db
    .prepare("SELECT * FROM engagements WHERE id = ?")
    .get(id) as Engagement | undefined;

  if (!engagement) return null;

  const scores = db
    .prepare(
      "SELECT * FROM engagement_scores WHERE engagement_id = ? ORDER BY dimension_key"
    )
    .all(id) as EngagementScore[];

  const flags = db
    .prepare(
      "SELECT * FROM score_flags WHERE engagement_id = ? ORDER BY severity DESC"
    )
    .all(id) as ScoreFlag[];

  const totalScore = calculateWeightedScore(scores);
  const flagCandidates = detectFlags(engagement, scores);
  const narrative = generateNarrative(
    engagement,
    scores,
    totalScore,
    flagCandidates
  );

  return { engagement, scores, flags, totalScore, narrative };
}

function riskLabel(value: string): string {
  return RISK_LEVELS.find((r) => r.value === value)?.label ?? value;
}

function typeLabel(value: string): string {
  return ENGAGEMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEngagement(id);

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Engagement not found.</p>
        <Link
          href="/quality-score/engagements"
          className="text-blue-600 underline text-sm mt-2 inline-block"
        >
          Back to list
        </Link>
      </div>
    );
  }

  const { engagement, scores, flags, totalScore, narrative } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/quality-score/engagements"
            className="text-xs text-blue-600 hover:underline"
          >
            ← All Engagements
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {engagement.client_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {typeLabel(engagement.engagement_type)} · FY{" "}
            {engagement.financial_year_end} · Partner:{" "}
            {engagement.partner_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreGauge score={totalScore} size="lg" />
        </div>
      </div>

      {/* Risk Profile */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Risk Profile
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Inherent Risk</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {riskLabel(engagement.inherent_risk)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Control Risk</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {riskLabel(engagement.control_risk)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Overall RMM</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {riskLabel(engagement.overall_rmm)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Substantive Testing Extent</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {riskLabel(engagement.substantive_testing_extent)}
            </p>
          </div>
        </div>
        {engagement.office && (
          <p className="text-xs text-gray-500 mt-3">
            Office: {engagement.office}
            {engagement.scored_by
              ? ` · Scored by: ${engagement.scored_by}`
              : ""}
            {engagement.scored_date
              ? ` · Date: ${engagement.scored_date.slice(0, 10)}`
              : ""}
          </p>
        )}
      </div>

      {/* Narrative Summary */}
      {narrative && (
        <div className="card p-5 bg-blue-50 border-blue-200">
          <h2 className="text-sm font-semibold text-blue-800 mb-2 uppercase tracking-wide">
            Quality Narrative Summary
          </h2>
          <p className="text-sm text-blue-900 leading-relaxed">{narrative}</p>
        </div>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Detected Flags
          </h2>
          {flags.map((f) => (
            <FlagBadge key={f.id} severity={f.severity} message={f.message} />
          ))}
        </div>
      )}

      {/* Dimension Scores */}
      {scores.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Dimension Scores
          </h2>
          <ul className="space-y-3">
            {scores.map((s) => {
              const dim = QUALITY_DIMENSIONS.find(
                (d) => d.key === s.dimension_key
              );
              const pct = (s.score / 5) * 100;
              return (
                <li key={s.dimension_key}>
                  <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                    <span>
                      {dim?.label ?? s.dimension_key}{" "}
                      <span className="text-gray-400">
                        (weight: {s.weight}%)
                      </span>
                    </span>
                    <span className="font-medium">
                      {s.score}/5 — {SCORE_LABELS[s.score]}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColour(
                        pct
                      )}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {s.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {s.notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Scoring Form */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          {scores.length > 0 ? "Update Scores" : "Score This Engagement"}
        </h2>
        <ScoringForm
          engagementId={engagement.id}
          existingScores={scores}
        />
      </div>

      {/* Delete */}
      <div className="flex justify-end pt-4">
        <DeleteButton
          id={engagement.id}
          endpoint="/api/engagements"
          redirectTo="/quality-score/engagements"
          label="Delete Engagement"
        />
      </div>
    </div>
  );
}
