import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { RiskEvent } from "@/lib/types";

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  const { partner_id, avvikshendelse, avvikskategori, poeng, begrunnelse, created_by } = body;

  if (!partner_id || !avvikshendelse || !avvikskategori || poeng === undefined || !begrunnelse) {
    return NextResponse.json(
      { error: "partner_id, avvikshendelse, avvikskategori, poeng, and begrunnelse are required" },
      { status: 400 }
    );
  }

  // Verify partner exists
  const partner = db
    .prepare("SELECT id FROM partners WHERE id = ?")
    .get(partner_id);

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const result = db
    .prepare(
      `INSERT INTO risk_events (partner_id, avvikshendelse, avvikskategori, poeng, begrunnelse, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(partner_id, avvikshendelse, avvikskategori, poeng, begrunnelse, created_by || "");

  const event = db
    .prepare("SELECT * FROM risk_events WHERE id = ?")
    .get(result.lastInsertRowid) as RiskEvent;

  return NextResponse.json(event, { status: 201 });
}
