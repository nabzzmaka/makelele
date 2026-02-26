import getDb from "@/lib/db";
import PartnerForm from "@/components/PartnerForm";
import type { Partner } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const partner = db
    .prepare("SELECT * FROM partners WHERE id = ?")
    .get(id) as Partner | undefined;

  if (!partner) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rediger partner</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {partner.partner_name} ({partner.partner_id})
        </p>
      </div>

      <PartnerForm mode="edit" initialData={partner} />
    </div>
  );
}
