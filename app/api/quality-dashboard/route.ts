import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { Engagement, EngagementScore, QualityDashboardStats } from "@/lib/types";
import { QUALITY_DIMENSIONS } from "@/lib/types";
import { calculateWeightedScore } from "@/lib/scoring";

export async function GET(): Promise<NextResponse> {
  const db = getDb();

  const engagements = db
    .prepare("SELECT * FROM engagements ORDER BY created_at DESC")
    .all() as Engagement[];

  const total_engagements = engagements.length;

  // Calculate total scores for each engagement
  const engagementScores: Map<number, number | null> = new Map();
  for (const e of engagements) {
    const scores = db
      .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ?")
      .all(e.id) as EngagementScore[];
    engagementScores.set(e.id, calculateWeightedScore(scores));
  }

  // Average score
  const validScores = [...engagementScores.values()].filter(
    (s): s is number => s !== null
  );
  const avg_score =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : null;

  // Score distribution
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
    const existing = partnerMap.get(e.partner_name) ?? { total: 0, count: 0 };
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

  // By dimension (average across all engagements)
  const dimMap = new Map<string, { total: number; count: number }>();
  for (const e of engagements) {
    const scores = db
      .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ?")
      .all(e.id) as EngagementScore[];
    for (const s of scores) {
      const existing = dimMap.get(s.dimension_key) ?? { total: 0, count: 0 };
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
      avg_score: data ? Math.round((data.total / data.count) * 10) / 10 : 0,
    };
  });

  // Heatmap data: dimension x partner
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

  // Flag summary
  const flag_summary = db
    .prepare(
      "SELECT flag_type, COUNT(*) as count FROM score_flags GROUP BY flag_type ORDER BY count DESC"
    )
    .all() as { flag_type: string; count: number }[];

  // Recent engagements with scores
  const recent_engagements = engagements.slice(0, 10).map((e) => ({
    ...e,
    total_weighted_score: engagementScores.get(e.id) ?? null,
  }));

  const result: QualityDashboardStats = {
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

  return NextResponse.json(result);
}
