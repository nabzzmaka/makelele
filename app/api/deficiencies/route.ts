import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { Deficiency } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const component = searchParams.get("component");
    const severity = searchParams.get("severity");

    let query = "SELECT * FROM deficiencies WHERE 1=1";
    const params: string[] = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (component) {
      query += " AND component = ?";
      params.push(component);
    }
    if (severity) {
      query += " AND severity = ?";
      params.push(severity);
    }

    query += " ORDER BY created_at DESC";

    const deficiencies = db.prepare(query).all(...params) as Deficiency[];
    return NextResponse.json(deficiencies);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch deficiencies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { title, description, component, nature, severity, identified_by, identified_date } = body;

    if (!title || !component || !nature || !severity) {
      return NextResponse.json(
        { error: "title, component, nature, and severity are required" },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        `INSERT INTO deficiencies (title, description, component, nature, severity, identified_by, identified_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        title,
        description ?? null,
        component,
        nature,
        severity,
        identified_by ?? null,
        identified_date ?? null
      );

    const deficiency = db
      .prepare("SELECT * FROM deficiencies WHERE id = ?")
      .get(result.lastInsertRowid) as Deficiency;

    return NextResponse.json(deficiency, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create deficiency" },
      { status: 500 }
    );
  }
}
