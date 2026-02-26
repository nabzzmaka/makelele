"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: number;
  endpoint?: string;
  redirectTo?: string;
  label?: string;
}

export default function DeleteButton({
  id,
  endpoint = "/api/deficiencies",
  redirectTo = "/deficiencies",
  label = "Delete",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this? This cannot be undone."
      )
    )
      return;

    setLoading(true);
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button className="btn-danger" onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting…" : label}
    </button>
  );
}
