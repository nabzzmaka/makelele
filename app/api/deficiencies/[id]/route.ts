import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { Deficiency, RemediationAction } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const deficiency = db
      .prepare("SELECT * FROM deficiencies WHERE id = ?")
      .get(id) as Deficiency | undefined;

    if (!deficiency) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const remediation_actions = db
      .prepare(
        "SELECT * FROM remediation_actions WHERE deficiency_id = ? ORDER BY created_at ASC"
      )
      .all(id) as RemediationAction[];

    return NextResponse.json({ ...deficiency, remediation_actions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch deficiency" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const existing = db
      .prepare("SELECT id FROM deficiencies WHERE id = ?")
      .get(id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { title, description, component, nature, severity, status, identified_by, identified_date } = body;

    db.prepare(
      `UPDATE deficiencies
       SET title = ?, description = ?, component = ?, nature = ?, severity = ?,
           status = ?, identified_by = ?, identified_date = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      title,
      description ?? null,
      component,
      nature,
      severity,
      status,
      identified_by ?? null,
      identified_date ?? null,
      id
    );

    const updated = db
      .prepare("SELECT * FROM deficiencies WHERE id = ?")
      .get(id) as Deficiency;

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update deficiency" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM deficiencies WHERE id = ?")
      .get(id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM deficiencies WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete deficiency" },
      { status: 500 }
    );
  }
}
