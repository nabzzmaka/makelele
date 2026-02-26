import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { Partner } from "@/lib/types";

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const profitCenter = url.searchParams.get("profitCenter");
  const riskProfile = url.searchParams.get("riskProfile");

  // Get all partners with their computed scores
  let partners = db
    .prepare(
      `SELECT p.*, COALESCE(SUM(e.poeng), 0) as total_risk_score
       FROM partners p
       LEFT JOIN risk_events e ON e.partner_id = p.id
       GROUP BY p.id
       ORDER BY total_risk_score DESC`
    )
    .all() as (Partner & { total_risk_score: number })[];

  // Filter by profit center
  if (profitCenter && profitCenter !== "Alle") {
    partners = partners.filter((p) => p.profit_center === profitCenter);
  }

  // Add risk profile and optionally filter
  const result = partners
    .map((p) => ({
      ...p,
      risk_profile: getRiskProfileFromScore(p.total_risk_score),
    }))
    .filter((p) => {
      if (!riskProfile || riskProfile === "Alle") return true;
      return p.risk_profile === riskProfile;
    });

  return NextResponse.json(result);
}

function getRiskProfileFromScore(score: number): string {
  if (score < 10) return "Lav";
  if (score < 20) return "Medium";
  if (score < 35) return "Høy";
  return "Svært høy";
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  const { partner_id, partner_name, profit_center, leader_level } = body;

  if (!partner_id || !partner_name || !profit_center || !leader_level) {
    return NextResponse.json(
      { error: "partner_id, partner_name, profit_center, and leader_level are required" },
      { status: 400 }
    );
  }

  // Check for duplicate partner_id
  const existing = db
    .prepare("SELECT id FROM partners WHERE partner_id = ?")
    .get(partner_id) as Partner | undefined;

  if (existing) {
    return NextResponse.json(
      { error: `Partner with ID '${partner_id}' already exists` },
      { status: 409 }
    );
  }

  const result = db
    .prepare(
      `INSERT INTO partners (partner_id, partner_name, profit_center, leader_level)
       VALUES (?, ?, ?, ?)`
    )
    .run(partner_id, partner_name, profit_center, leader_level);

  const partner = db
    .prepare("SELECT * FROM partners WHERE id = ?")
    .get(result.lastInsertRowid) as Partner;

  return NextResponse.json(partner, { status: 201 });
}
