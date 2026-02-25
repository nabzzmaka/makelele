import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { RemediationAction } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const existing = db
      .prepare("SELECT id FROM remediation_actions WHERE id = ?")
      .get(id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { description, assigned_to, due_date, completed_date, status } = body;

    db.prepare(
      `UPDATE remediation_actions
       SET description = ?, assigned_to = ?, due_date = ?, completed_date = ?, status = ?
       WHERE id = ?`
    ).run(
      description,
      assigned_to ?? null,
      due_date ?? null,
      completed_date ?? null,
      status,
      id
    );

    const updated = db
      .prepare("SELECT * FROM remediation_actions WHERE id = ?")
      .get(id) as RemediationAction;

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update remediation action" },
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
      .prepare("SELECT id FROM remediation_actions WHERE id = ?")
      .get(id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM remediation_actions WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete remediation action" },
      { status: 500 }
    );
  }
}
