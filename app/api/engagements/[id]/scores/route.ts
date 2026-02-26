import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { Engagement, EngagementScore, ScoreFlag } from "@/lib/types";
import { QUALITY_DIMENSIONS } from "@/lib/types";
import {
  calculateWeightedScore,
  detectFlags,
  generateNarrative,
} from "@/lib/scoring";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const engagement = db
    .prepare("SELECT * FROM engagements WHERE id = ?")
    .get(id) as Engagement | undefined;

  if (!engagement) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  // Expect body.scores = [{ dimension_key, score, weight?, notes? }, ...]
  const scores: { dimension_key: string; score: number; weight?: number; notes?: string }[] =
    body.scores;

  if (!Array.isArray(scores) || scores.length === 0) {
    return NextResponse.json(
      { error: "scores array is required" },
      { status: 400 }
    );
  }

  // Validate dimension keys
  const validKeys = new Set<string>(QUALITY_DIMENSIONS.map((d) => d.key));
  for (const s of scores) {
    if (!validKeys.has(s.dimension_key)) {
      return NextResponse.json(
        { error: `Invalid dimension_key: ${s.dimension_key}` },
        { status: 400 }
      );
    }
    if (s.score < 1 || s.score > 5) {
      return NextResponse.json(
        { error: `Score must be between 1 and 5 for ${s.dimension_key}` },
        { status: 400 }
      );
    }
  }

  // Use a transaction to replace all scores
  const insertScore = db.prepare(
    `INSERT INTO engagement_scores (engagement_id, dimension_key, score, weight, notes)
     VALUES (?, ?, ?, ?, ?)`
  );
  const deleteScores = db.prepare(
    "DELETE FROM engagement_scores WHERE engagement_id = ?"
  );
  const deleteFlags = db.prepare(
    "DELETE FROM score_flags WHERE engagement_id = ?"
  );
  const insertFlag = db.prepare(
    `INSERT INTO score_flags (engagement_id, flag_type, severity, message)
     VALUES (?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    // Clear existing scores and flags
    deleteScores.run(id);
    deleteFlags.run(id);

    // Insert new scores
    for (const s of scores) {
      const defaultWeight =
        QUALITY_DIMENSIONS.find((d) => d.key === s.dimension_key)
          ?.default_weight ?? 20;
      insertScore.run(
        id,
        s.dimension_key,
        s.score,
        s.weight ?? defaultWeight,
        s.notes ?? null
      );
    }

    // Detect and insert flags
    const savedScores = db
      .prepare(
        "SELECT * FROM engagement_scores WHERE engagement_id = ?"
      )
      .all(id) as EngagementScore[];

    const flagCandidates = detectFlags(engagement, savedScores);
    for (const f of flagCandidates) {
      insertFlag.run(id, f.flag_type, f.severity, f.message);
    }

    // Update engagement scored_date
    const now = new Date().toISOString();
    db.prepare(
      "UPDATE engagements SET scored_date = ?, updated_at = ? WHERE id = ?"
    ).run(now, now, id);
  });

  transaction();

  // Return updated scores, flags, total, and narrative
  const savedScores = db
    .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ?")
    .all(id) as EngagementScore[];
  const savedFlags = db
    .prepare("SELECT * FROM score_flags WHERE engagement_id = ?")
    .all(id) as ScoreFlag[];

  const totalScore = calculateWeightedScore(savedScores);
  const flagCandidates = detectFlags(engagement, savedScores);
  const narrative = generateNarrative(
    engagement,
    savedScores,
    totalScore,
    flagCandidates
  );

  return NextResponse.json({
    scores: savedScores,
    flags: savedFlags,
    total_weighted_score: totalScore,
    narrative,
  });
}
