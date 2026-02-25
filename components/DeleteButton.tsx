"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this deficiency and all its remediation actions? This cannot be undone."
      )
    )
      return;

    setLoading(true);
    await fetch(`/api/deficiencies/${id}`, { method: "DELETE" });
    router.push("/deficiencies");
    router.refresh();
  }

  return (
    <button className="btn-danger" onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
