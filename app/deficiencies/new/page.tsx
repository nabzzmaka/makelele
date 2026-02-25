import DeficiencyForm from "@/components/DeficiencyForm";

export default function NewDeficiencyPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Register Deficiency</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record a quality deficiency identified through the monitoring and
          remediation process under ISQM 1.
        </p>
      </div>
      <div className="card p-6">
        <DeficiencyForm mode="create" />
      </div>
    </div>
  );
}
