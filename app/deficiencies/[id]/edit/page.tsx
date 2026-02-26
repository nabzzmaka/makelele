import { notFound } from "next/navigation";
import DeficiencyForm from "@/components/DeficiencyForm";
import type { Deficiency } from "@/lib/types";
import getDb from "@/lib/db";

async function getDeficiency(id: string): Promise<Deficiency | null> {
  try {
    const db = getDb();
    return db.prepare("SELECT * FROM deficiencies WHERE id = ?").get(id) as Deficiency | null;
  } catch {
    return null;
  }
}

export default async function EditDeficiencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deficiency = await getDeficiency(id);
  if (!deficiency) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Deficiency</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the details for deficiency #{deficiency.id}.
        </p>
      </div>
      <div className="card p-6">
        <DeficiencyForm mode="edit" initial={deficiency} />
      </div>
    </div>
  );
}
