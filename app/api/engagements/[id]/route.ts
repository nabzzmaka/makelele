import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { Engagement, EngagementScore, ScoreFlag, EngagementWithScores } from "@/lib/types";
import { calculateWeightedScore, generateNarrative, detectFlags } from "@/lib/scoring";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const db = getDb();

  const engagement = db
    .prepare("SELECT * FROM engagements WHERE id = ?")
    .get(id) as Engagement | undefined;

  if (!engagement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const scores = db
    .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ? ORDER BY dimension_key")
    .all(id) as EngagementScore[];

  const flags = db
    .prepare("SELECT * FROM score_flags WHERE engagement_id = ? ORDER BY severity DESC, created_at DESC")
    .all(id) as ScoreFlag[];

  const totalScore = calculateWeightedScore(scores);

  const flagCandidates = detectFlags(engagement, scores);
  const narrative = generateNarrative(engagement, scores, totalScore, flagCandidates);

  const result: EngagementWithScores = {
    ...engagement,
    scores,
    flags,
    total_weighted_score: totalScore,
    narrative,
  };

  return NextResponse.json(result);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM engagements WHERE id = ?")
    .get(id) as Engagement | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE engagements SET
      client_name = ?, engagement_type = ?, financial_year_end = ?,
      partner_name = ?, office = ?,
      inherent_risk = ?, control_risk = ?, overall_rmm = ?,
      substantive_testing_extent = ?,
      scored_by = ?, scored_date = ?, updated_at = ?
    WHERE id = ?`
  ).run(
    body.client_name ?? existing.client_name,
    body.engagement_type ?? existing.engagement_type,
    body.financial_year_end ?? existing.financial_year_end,
    body.partner_name ?? existing.partner_name,
    body.office ?? existing.office,
    body.inherent_risk ?? existing.inherent_risk,
    body.control_risk ?? existing.control_risk,
    body.overall_rmm ?? existing.overall_rmm,
    body.substantive_testing_extent ?? existing.substantive_testing_extent,
    body.scored_by ?? existing.scored_by,
    body.scored_date ?? existing.scored_date,
    now,
    id
  );

  const updated = db
    .prepare("SELECT * FROM engagements WHERE id = ?")
    .get(id) as Engagement;

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const db = getDb();

  const existing = db
    .prepare("SELECT id FROM engagements WHERE id = ?")
    .get(id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM engagements WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
