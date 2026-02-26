"use client";

import { useRouter } from "next/navigation";

export default function DeletePartnerButton({ partnerId }: { partnerId: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Er du sikker på at du vil slette denne partneren og alle tilhørende hendelser?")) {
      return;
    }

    const res = await fetch(`/api/partners/${partnerId}`, { method: "DELETE" });

    if (res.ok) {
      router.push("/risikoscoring/partners");
      router.refresh();
    }
  }

  return (
    <button onClick={handleDelete} className="btn-danger">
      Slett partner
    </button>
  );
}
