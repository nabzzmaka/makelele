import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { Engagement } from "@/lib/types";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const db = getDb();
  const url = new URL(req.url);
  const partner = url.searchParams.get("partner");
  const office = url.searchParams.get("office");
  const type = url.searchParams.get("type");

  let query = "SELECT * FROM engagements";
  const conditions: string[] = [];
  const params: string[] = [];

  if (partner) {
    conditions.push("partner_name = ?");
    params.push(partner);
  }
  if (office) {
    conditions.push("office = ?");
    params.push(office);
  }
  if (type) {
    conditions.push("engagement_type = ?");
    params.push(type);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY created_at DESC";

  const engagements = db.prepare(query).all(...params) as Engagement[];
  return NextResponse.json(engagements);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const {
    client_name,
    engagement_type,
    financial_year_end,
    partner_name,
    office,
    inherent_risk,
    control_risk,
    overall_rmm,
    substantive_testing_extent,
    scored_by,
  } = body;

  if (!client_name || !engagement_type || !financial_year_end || !partner_name) {
    return NextResponse.json(
      { error: "client_name, engagement_type, financial_year_end, and partner_name are required" },
      { status: 400 }
    );
  }

  const db = getDb();
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO engagements (client_name, engagement_type, financial_year_end, partner_name, office, inherent_risk, control_risk, overall_rmm, substantive_testing_extent, scored_by, scored_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      client_name,
      engagement_type,
      financial_year_end,
      partner_name,
      office ?? "",
      inherent_risk ?? "moderate",
      control_risk ?? "moderate",
      overall_rmm ?? "moderate",
      substantive_testing_extent ?? "moderate",
      scored_by ?? null,
      scored_by ? now : null,
      now,
      now
    );

  const engagement = db
    .prepare("SELECT * FROM engagements WHERE id = ?")
    .get(result.lastInsertRowid) as Engagement;

  return NextResponse.json(engagement, { status: 201 });
}
