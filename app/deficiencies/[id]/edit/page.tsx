import { notFound } from "next/navigation";
import DeficiencyForm from "@/components/DeficiencyForm";
import type { Deficiency } from "@/lib/types";

async function getDeficiency(id: string): Promise<Deficiency | null> {
  const res = await fetch(`http://localhost:3000/api/deficiencies/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
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
