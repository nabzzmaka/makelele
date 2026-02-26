import Link from "next/link";
import getDb from "@/lib/db";
import {
  QUALITY_DIMENSIONS,
  type Engagement,
  type EngagementScore,
  type QualityDashboardStats,
} from "@/lib/types";
import { calculateWeightedScore, getScoreBarColour } from "@/lib/scoring";
import ScoreGauge from "@/components/ScoreGauge";
import QualityHeatmap from "@/components/QualityHeatmap";

async function getDashboardStats(): Promise<QualityDashboardStats | null> {
  try {
    const db = getDb();

    const engagements = db
      .prepare("SELECT * FROM engagements ORDER BY created_at DESC")
      .all() as Engagement[];

    const total_engagements = engagements.length;

    const engagementScores = new Map<number, number | null>();
    for (const e of engagements) {
      const scores = db
        .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ?")
        .all(e.id) as EngagementScore[];
      engagementScores.set(e.id, calculateWeightedScore(scores));
    }

    const validScores = [...engagementScores.values()].filter(
      (s): s is number => s !== null
    );
    const avg_score =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((a, b) => a + b, 0) / validScores.length
          )
        : null;

    const brackets = [
      { bracket: "Critical (<30)", min: 0, max: 29 },
      { bracket: "Significant (30-49)", min: 30, max: 49 },
      { bracket: "Needs Improvement (50-69)", min: 50, max: 69 },
      { bracket: "Satisfactory (70-84)", min: 70, max: 84 },
      { bracket: "Exemplary (85-100)", min: 85, max: 100 },
    ];
    const score_distribution = brackets.map((b) => ({
      bracket: b.bracket,
      count: validScores.filter((s) => s >= b.min && s <= b.max).length,
    }));

    // By partner
    const partnerMap = new Map<string, { total: number; count: number }>();
    for (const e of engagements) {
      const score = engagementScores.get(e.id);
      if (score === null || score === undefined) continue;
      const existing = partnerMap.get(e.partner_name) ?? {
        total: 0,
        count: 0,
      };
      existing.total += score;
      existing.count += 1;
      partnerMap.set(e.partner_name, existing);
    }
    const by_partner = [...partnerMap.entries()]
      .map(([partner_name, data]) => ({
        partner_name,
        avg_score: Math.round(data.total / data.count),
        count: data.count,
      }))
      .sort((a, b) => b.avg_score - a.avg_score);

    // By office
    const officeMap = new Map<string, { total: number; count: number }>();
    for (const e of engagements) {
      const score = engagementScores.get(e.id);
      if (score === null || score === undefined) continue;
      const officeName = e.office || "Unspecified";
      const existing = officeMap.get(officeName) ?? { total: 0, count: 0 };
      existing.total += score;
      existing.count += 1;
      officeMap.set(officeName, existing);
    }
    const by_office = [...officeMap.entries()]
      .map(([office, data]) => ({
        office,
        avg_score: Math.round(data.total / data.count),
        count: data.count,
      }))
      .sort((a, b) => b.avg_score - a.avg_score);

    // By dimension
    const dimMap = new Map<string, { total: number; count: number }>();
    for (const e of engagements) {
      const scores = db
        .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ?")
        .all(e.id) as EngagementScore[];
      for (const s of scores) {
        const existing = dimMap.get(s.dimension_key) ?? {
          total: 0,
          count: 0,
        };
        existing.total += s.score;
        existing.count += 1;
        dimMap.set(s.dimension_key, existing);
      }
    }
    const by_dimension = QUALITY_DIMENSIONS.map((d) => {
      const data = dimMap.get(d.key);
      return {
        dimension_key: d.key,
        label: d.label,
        avg_score: data
          ? Math.round((data.total / data.count) * 10) / 10
          : 0,
      };
    });

    // Heatmap
    const heatmapMap = new Map<string, { total: number; count: number }>();
    for (const e of engagements) {
      const scores = db
        .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ?")
        .all(e.id) as EngagementScore[];
      for (const s of scores) {
        const key = `${s.dimension_key}|${e.partner_name}`;
        const existing = heatmapMap.get(key) ?? { total: 0, count: 0 };
        existing.total += s.score;
        existing.count += 1;
        heatmapMap.set(key, existing);
      }
    }
    const heatmap_data = [...heatmapMap.entries()].map(([key, data]) => {
      const [dimension_key, partner_name] = key.split("|");
      return {
        dimension_key,
        partner_name,
        avg_score: Math.round((data.total / data.count) * 10) / 10,
      };
    });

    const flag_summary = db
      .prepare(
        "SELECT flag_type, COUNT(*) as count FROM score_flags GROUP BY flag_type ORDER BY count DESC"
      )
      .all() as { flag_type: string; count: number }[];

    const recent_engagements = engagements.slice(0, 10).map((e) => ({
      ...e,
      total_weighted_score: engagementScores.get(e.id) ?? null,
    }));

    return {
      total_engagements,
      avg_score,
      score_distribution,
      by_partner,
      by_office,
      by_dimension,
      recent_engagements,
      heatmap_data,
      flag_summary,
    };
  } catch {
    return null;
  }
}

const FLAG_LABELS: Record<string, string> = {
  risk_testing_mismatch: "Risk-Testing Mismatch",
  rmm_testing_mismatch: "RMM-Testing Mismatch",
  control_reliance_concern: "Control Reliance Concern",
  rmm_inconsistency: "RMM Inconsistency",
  low_risk_response: "Low Risk-Response Score",
  low_documentation: "Low Documentation Score",
  skepticism_risk_gap: "Skepticism-Risk Gap",
  score_variance: "Score Variance",
};

export default async function QualityScoreDashboard() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-sm">
          Could not load quality dashboard data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quality Score Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit engagement quality overview — weighted scoring model
          </p>
        </div>
        <Link href="/quality-score/engagements/new" className="btn-primary">
          + Score Engagement
        </Link>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-blue-400">
          <p className="text-sm text-gray-500">Total Engagements</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {stats.total_engagements}
          </p>
        </div>
        <div className="card p-5 border-l-4 border-green-400">
          <p className="text-sm text-gray-500">Firm Average Score</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {stats.avg_score !== null ? `${stats.avg_score}/100` : "—"}
          </p>
        </div>
        <div className="card p-5 border-l-4 border-amber-400">
          <p className="text-sm text-gray-500">Partners Tracked</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {stats.by_partner.length}
          </p>
        </div>
        <div className="card p-5 border-l-4 border-red-400">
          <p className="text-sm text-gray-500">Total Flags</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {stats.flag_summary.reduce((a, b) => a + b.count, 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Score Distribution
          </h2>
          {stats.score_distribution.every((d) => d.count === 0) ? (
            <p className="text-sm text-gray-400">No scored engagements yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.score_distribution.map((row) => {
                const pct =
                  stats.total_engagements > 0
                    ? Math.round(
                        (row.count / stats.total_engagements) * 100
                      )
                    : 0;
                return (
                  <li key={row.bracket}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{row.bracket}</span>
                      <span className="font-medium">
                        {row.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* By Dimension */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Average by Quality Dimension
          </h2>
          {stats.by_dimension.every((d) => d.avg_score === 0) ? (
            <p className="text-sm text-gray-400">No dimension data yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.by_dimension.map((row) => {
                const pct = Math.round((row.avg_score / 5) * 100);
                return (
                  <li key={row.dimension_key}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span className="truncate pr-2">{row.label}</span>
                      <span className="font-medium shrink-0">
                        {row.avg_score}/5
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreBarColour(
                          pct
                        )}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partner Trends */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Partner Quality Trends
          </h2>
          {stats.by_partner.length === 0 ? (
            <p className="text-sm text-gray-400">No partner data yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.by_partner.map((row) => (
                <li
                  key={row.partner_name}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {row.partner_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {row.count} engagement{row.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ScoreGauge score={row.avg_score} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Office Quality Culture */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Office Quality Culture
          </h2>
          {stats.by_office.length === 0 ? (
            <p className="text-sm text-gray-400">No office data yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.by_office.map((row) => (
                <li
                  key={row.office}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {row.office}
                    </p>
                    <p className="text-xs text-gray-500">
                      {row.count} engagement{row.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ScoreGauge score={row.avg_score} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quality Risk Heatmap */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Quality Risk Heatmap — Partner × Dimension
        </h2>
        <QualityHeatmap data={stats.heatmap_data} />
      </div>

      {/* Recurring Flags */}
      {stats.flag_summary.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Recurring Inspection Deficiencies
          </h2>
          <ul className="space-y-2">
            {stats.flag_summary.map((row) => (
              <li
                key={row.flag_type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {FLAG_LABELS[row.flag_type] ?? row.flag_type}
                </span>
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {row.count}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Engagements */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Recent Engagements
          </h2>
          <Link
            href="/quality-score/engagements"
            className="text-xs text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        {stats.recent_engagements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No engagements yet.{" "}
            <Link
              href="/quality-score/engagements/new"
              className="text-blue-600 underline"
            >
              Score the first one.
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-gray-50 px-1">
            {stats.recent_engagements.map((e) => (
              <Link
                key={e.id}
                href={`/quality-score/engagements/${e.id}`}
                className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {e.client_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {e.partner_name} · FY {e.financial_year_end}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <ScoreGauge
                    score={e.total_weighted_score}
                    size="sm"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
