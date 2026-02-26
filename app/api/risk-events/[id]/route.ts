import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { RiskEvent } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  const existing = db
    .prepare("SELECT * FROM risk_events WHERE id = ?")
    .get(id) as RiskEvent | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const avvikshendelse = body.avvikshendelse ?? existing.avvikshendelse;
  const avvikskategori = body.avvikskategori ?? existing.avvikskategori;
  const poeng = body.poeng ?? existing.poeng;
  const begrunnelse = body.begrunnelse ?? existing.begrunnelse;

  db.prepare(
    `UPDATE risk_events SET avvikshendelse = ?, avvikskategori = ?, poeng = ?, begrunnelse = ?
     WHERE id = ?`
  ).run(avvikshendelse, avvikskategori, poeng, begrunnelse, id);

  const updated = db
    .prepare("SELECT * FROM risk_events WHERE id = ?")
    .get(id) as RiskEvent;

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM risk_events WHERE id = ?")
    .get(id) as RiskEvent | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM risk_events WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}
