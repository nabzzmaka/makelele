"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AVVIKSHENDELSE_OPTIONS,
  AVVIKSKATEGORI_OPTIONS,
  AVVIKSKATEGORI_POENG,
  type Avvikskategori,
} from "@/lib/types";

interface EventFormProps {
  partnerId: number;
}

export default function EventForm({ partnerId }: EventFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPoengWarning, setShowPoengWarning] = useState(false);

  const [avvikshendelse, setAvvikshendelse] = useState<string>(AVVIKSHENDELSE_OPTIONS[0]);
  const [avvikskategori, setAvvikskategori] = useState<Avvikskategori>(AVVIKSKATEGORI_OPTIONS[0]);
  const [poeng, setPoeng] = useState(AVVIKSKATEGORI_POENG[AVVIKSKATEGORI_OPTIONS[0]]);
  const [begrunnelse, setBegrunnelse] = useState("");

  function handleKategoriChange(value: string) {
    const kategori = value as Avvikskategori;
    setAvvikskategori(kategori);
    const defaultPoeng = AVVIKSKATEGORI_POENG[kategori];
    setPoeng(defaultPoeng);
    setShowPoengWarning(false);
  }

  function handlePoengChange(value: string) {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;
    setPoeng(numValue);
    const defaultPoeng = AVVIKSKATEGORI_POENG[avvikskategori];
    setShowPoengWarning(numValue !== defaultPoeng);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/risk-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: partnerId,
          avvikshendelse,
          avvikskategori,
          poeng,
          begrunnelse,
          created_by: "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kunne ikke opprette hendelse");
        setSubmitting(false);
        return;
      }

      // Reset form
      setAvvikshendelse(AVVIKSHENDELSE_OPTIONS[0]);
      setAvvikskategori(AVVIKSKATEGORI_OPTIONS[0]);
      setPoeng(AVVIKSKATEGORI_POENG[AVVIKSKATEGORI_OPTIONS[0]]);
      setBegrunnelse("");
      setShowPoengWarning(false);
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Nettverksfeil. Prøv igjen.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Registrer ny hendelse
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="avvikshendelse" className="form-label">
          Avvikshendelse *
        </label>
        <select
          id="avvikshendelse"
          className="form-select"
          value={avvikshendelse}
          onChange={(e) => setAvvikshendelse(e.target.value)}
        >
          {AVVIKSHENDELSE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="avvikskategori" className="form-label">
            Avvikskategori *
          </label>
          <select
            id="avvikskategori"
            className="form-select"
            value={avvikskategori}
            onChange={(e) => handleKategoriChange(e.target.value)}
          >
            {AVVIKSKATEGORI_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} ({AVVIKSKATEGORI_POENG[opt]} poeng)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="poeng" className="form-label">
            Poeng *
          </label>
          <input
            id="poeng"
            type="number"
            min={0}
            className="form-input"
            value={poeng}
            onChange={(e) => handlePoengChange(e.target.value)}
          />
          {showPoengWarning && (
            <p className="text-xs text-amber-600 mt-1">
              Poeng er manuelt endret fra standardverdi (
              {AVVIKSKATEGORI_POENG[avvikskategori]}).
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="begrunnelse" className="form-label">
          Begrunnelse *
        </label>
        <textarea
          id="begrunnelse"
          className="form-textarea"
          value={begrunnelse}
          onChange={(e) => setBegrunnelse(e.target.value)}
          required
          rows={3}
        />
      </div>

      <div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Lagrer…" : "Legg til hendelse"}
        </button>
      </div>
    </form>
  );
}
