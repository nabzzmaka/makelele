import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { Deficiency } from "@/lib/types";

export async function GET() {
  try {
    const db = getDb();

    const total = (
      db.prepare("SELECT COUNT(*) as count FROM deficiencies").get() as { count: number }
    ).count;

    const open = (
      db
        .prepare("SELECT COUNT(*) as count FROM deficiencies WHERE status = 'open'")
        .get() as { count: number }
    ).count;

    const in_progress = (
      db
        .prepare("SELECT COUNT(*) as count FROM deficiencies WHERE status = 'in_progress'")
        .get() as { count: number }
    ).count;

    const resolved = (
      db
        .prepare("SELECT COUNT(*) as count FROM deficiencies WHERE status = 'resolved'")
        .get() as { count: number }
    ).count;

    const by_component = db
      .prepare(
        "SELECT component, COUNT(*) as count FROM deficiencies GROUP BY component ORDER BY count DESC"
      )
      .all() as { component: string; count: number }[];

    const by_severity = db
      .prepare(
        "SELECT severity, COUNT(*) as count FROM deficiencies GROUP BY severity"
      )
      .all() as { severity: string; count: number }[];

    const recent = db
      .prepare(
        "SELECT * FROM deficiencies ORDER BY created_at DESC LIMIT 5"
      )
      .all() as Deficiency[];

    return NextResponse.json({
      total,
      open,
      in_progress,
      resolved,
      by_component,
      by_severity,
      recent,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
