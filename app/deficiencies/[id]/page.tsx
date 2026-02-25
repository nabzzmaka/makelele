import { notFound } from "next/navigation";
import Link from "next/link";
import type { DeficiencyWithRemediation } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import RemediationActions from "@/components/RemediationActions";
import DeleteButton from "@/components/DeleteButton";

async function getDeficiency(
  id: string
): Promise<DeficiencyWithRemediation | null> {
  const res = await fetch(`http://localhost:3000/api/deficiencies/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

export default async function DeficiencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deficiency = await getDeficiency(id);
  if (!deficiency) notFound();

  const openActions = deficiency.remediation_actions.filter(
    (a) => a.status !== "completed"
  ).length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1">
        <Link href="/deficiencies" className="hover:text-blue-600">
          Deficiencies
        </Link>
        <span>›</span>
        <span className="text-gray-900">#{deficiency.id}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {deficiency.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge kind="status" value={deficiency.status} />
            <StatusBadge kind="severity" value={deficiency.severity} />
            <StatusBadge kind="nature" value={deficiency.nature} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/deficiencies/${deficiency.id}/edit`}
            className="btn-secondary"
          >
            Edit
          </Link>
          <DeleteButton id={deficiency.id} />
        </div>
      </div>

      {/* Details card */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Field
              label="Description"
              value={
                deficiency.description ? (
                  <span className="whitespace-pre-wrap">
                    {deficiency.description}
                  </span>
                ) : null
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="ISQM 1 Component" value={deficiency.component} />
          </div>
          <Field
            label="Nature"
            value={
              deficiency.nature === "root_cause" ? "Root Cause" : "Symptom"
            }
          />
          <Field
            label="Severity"
            value={
              <span className="capitalize">{deficiency.severity}</span>
            }
          />
          <Field label="Identified By" value={deficiency.identified_by} />
          <Field label="Date Identified" value={deficiency.identified_date} />
          <Field
            label="Registered On"
            value={deficiency.created_at.slice(0, 10)}
          />
          <Field
            label="Last Updated"
            value={deficiency.updated_at.slice(0, 10)}
          />
        </dl>
      </div>

      {/* Remediation Actions */}
      <div className="card p-6">
        {openActions > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded">
            {openActions} open remediation action{openActions !== 1 ? "s" : ""}{" "}
            pending
          </div>
        )}
        <RemediationActions
          deficiencyId={deficiency.id}
          actions={deficiency.remediation_actions}
        />
      </div>
    </div>
  );
}
