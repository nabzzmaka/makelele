import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { RemediationAction } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { deficiency_id, description, assigned_to, due_date } = body;

    if (!deficiency_id || !description) {
      return NextResponse.json(
        { error: "deficiency_id and description are required" },
        { status: 400 }
      );
    }

    const deficiency = db
      .prepare("SELECT id FROM deficiencies WHERE id = ?")
      .get(deficiency_id);

    if (!deficiency) {
      return NextResponse.json(
        { error: "Deficiency not found" },
        { status: 404 }
      );
    }

    const result = db
      .prepare(
        `INSERT INTO remediation_actions (deficiency_id, description, assigned_to, due_date)
         VALUES (?, ?, ?, ?)`
      )
      .run(deficiency_id, description, assigned_to ?? null, due_date ?? null);

    const action = db
      .prepare("SELECT * FROM remediation_actions WHERE id = ?")
      .get(result.lastInsertRowid) as RemediationAction;

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create remediation action" },
      { status: 500 }
    );
  }
}
