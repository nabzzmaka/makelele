"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RiskEvent } from "@/lib/types";
import {
  AVVIKSHENDELSE_OPTIONS,
  AVVIKSKATEGORI_OPTIONS,
  AVVIKSKATEGORI_POENG,
  type Avvikskategori,
} from "@/lib/types";

interface EventTableProps {
  events: RiskEvent[];
}

export default function EventTable({ events }: EventTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    avvikshendelse: string;
    avvikskategori: string;
    poeng: number;
    begrunnelse: string;
  } | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Er du sikker på at du vil slette denne hendelsen?")) return;
    await fetch(`/api/risk-events/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function startEdit(event: RiskEvent) {
    setEditingId(event.id);
    setEditData({
      avvikshendelse: event.avvikshendelse,
      avvikskategori: event.avvikskategori,
      poeng: event.poeng,
      begrunnelse: event.begrunnelse,
    });
  }

  async function saveEdit(id: number) {
    if (!editData) return;
    await fetch(`/api/risk-events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setEditingId(null);
    setEditData(null);
    router.refresh();
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">
        Ingen hendelser registrert ennå.
      </p>
    );
  }

  const totalScore = events.reduce((sum, e) => sum + e.poeng, 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="py-2 pr-3">Avvikshendelse</th>
              <th className="py-2 pr-3">Kategori</th>
              <th className="py-2 pr-3 text-right">Poeng</th>
              <th className="py-2 pr-3">Begrunnelse</th>
              <th className="py-2 pr-3">Dato</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id}>
                {editingId === event.id && editData ? (
                  <>
                    <td className="py-2 pr-3">
                      <select
                        className="form-select text-xs"
                        value={editData.avvikshendelse}
                        onChange={(e) =>
                          setEditData({ ...editData, avvikshendelse: e.target.value })
                        }
                      >
                        {AVVIKSHENDELSE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        className="form-select text-xs"
                        value={editData.avvikskategori}
                        onChange={(e) => {
                          const kat = e.target.value as Avvikskategori;
                          setEditData({
                            ...editData,
                            avvikskategori: kat,
                            poeng: AVVIKSKATEGORI_POENG[kat] ?? editData.poeng,
                          });
                        }}
                      >
                        {AVVIKSKATEGORI_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <input
                        type="number"
                        min={0}
                        className="form-input text-xs w-16 text-right"
                        value={editData.poeng}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            poeng: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        className="form-input text-xs"
                        value={editData.begrunnelse}
                        onChange={(e) =>
                          setEditData({ ...editData, begrunnelse: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-500">
                      {event.created_at.slice(0, 10)}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => saveEdit(event.id)}
                        className="text-xs text-green-600 hover:underline mr-2"
                      >
                        Lagre
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditData(null);
                        }}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        Avbryt
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-3 text-gray-900 max-w-[200px] truncate">
                      {event.avvikshendelse}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          event.avvikskategori === "Godkjent"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : event.avvikskategori === "Ikke godkjent"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {event.avvikskategori}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono font-medium">
                      {event.poeng}
                    </td>
                    <td className="py-2 pr-3 text-gray-600 max-w-[250px] truncate">
                      {event.begrunnelse}
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-500">
                      {event.created_at.slice(0, 10)}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(event)}
                        className="text-xs text-blue-600 hover:underline mr-2"
                      >
                        Rediger
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Slett
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td className="py-2 pr-3 font-semibold text-gray-900" colSpan={2}>
                Total risikoscore
              </td>
              <td className="py-2 pr-3 text-right font-mono font-bold text-gray-900">
                {totalScore}
              </td>
              <td colSpan={3} className="py-2 text-xs text-gray-500">
                Score = sum av alle hendelsespoeng
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
