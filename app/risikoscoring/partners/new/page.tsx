import PartnerForm from "@/components/PartnerForm";

export default function NewPartnerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ny partner</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Registrer en ny partner for risikoscoring
        </p>
      </div>

      <PartnerForm mode="create" />
    </div>
  );
}
