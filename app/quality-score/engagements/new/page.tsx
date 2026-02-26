import EngagementForm from "@/components/EngagementForm";

export default function NewEngagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Score New Engagement
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Create an engagement record and define its risk profile
        </p>
      </div>
      <div className="card p-6">
        <EngagementForm mode="create" />
      </div>
    </div>
  );
}
