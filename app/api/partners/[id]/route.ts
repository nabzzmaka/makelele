import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { Partner, RiskEvent } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const partner = db
    .prepare("SELECT * FROM partners WHERE id = ?")
    .get(id) as Partner | undefined;

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const events = db
    .prepare(
      "SELECT * FROM risk_events WHERE partner_id = ? ORDER BY created_at DESC"
    )
    .all(id) as RiskEvent[];

  const totalScore = events.reduce((sum, e) => sum + e.poeng, 0);

  return NextResponse.json({
    ...partner,
    events,
    total_risk_score: totalScore,
    risk_profile: getRiskProfileFromScore(totalScore),
  });
}

function getRiskProfileFromScore(score: number): string {
  if (score < 10) return "Lav";
  if (score < 20) return "Medium";
  if (score < 35) return "Høy";
  return "Svært høy";
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  const existing = db
    .prepare("SELECT * FROM partners WHERE id = ?")
    .get(id) as Partner | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const partner_name = body.partner_name ?? existing.partner_name;
  const profit_center = body.profit_center ?? existing.profit_center;
  const leader_level = body.leader_level ?? existing.leader_level;

  db.prepare(
    `UPDATE partners SET partner_name = ?, profit_center = ?, leader_level = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(partner_name, profit_center, leader_level, id);

  const updated = db
    .prepare("SELECT * FROM partners WHERE id = ?")
    .get(id) as Partner;

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM partners WHERE id = ?")
    .get(id) as Partner | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM partners WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}
