import Link from "next/link";
import getDb from "@/lib/db";
import RiskBadge from "@/components/RiskBadge";
import type { RiskProfile } from "@/lib/types";

interface PartnerRow {
  id: number;
  partner_id: string;
  partner_name: string;
  profit_center: string;
  leader_level: string;
  total_risk_score: number;
}

function getRiskProfile(score: number): RiskProfile {
  if (score < 10) return "Lav";
  if (score < 20) return "Medium";
  if (score < 35) return "Høy";
  return "Svært høy";
}

export default async function PartnersListPage({
  searchParams,
}: {
  searchParams: Promise<{ profitCenter?: string; riskProfile?: string }>;
}) {
  const { profitCenter, riskProfile } = await searchParams;
  const db = getDb();

  let partners = db
    .prepare(
      `SELECT p.*, COALESCE(SUM(e.poeng), 0) as total_risk_score
       FROM partners p
       LEFT JOIN risk_events e ON e.partner_id = p.id
       GROUP BY p.id
       ORDER BY total_risk_score DESC`
    )
    .all() as PartnerRow[];

  // Filters
  if (profitCenter && profitCenter !== "Alle") {
    partners = partners.filter((p) => p.profit_center === profitCenter);
  }

  const withProfile = partners.map((p) => ({
    ...p,
    risk_profile: getRiskProfile(p.total_risk_score),
  }));

  const filtered =
    riskProfile && riskProfile !== "Alle"
      ? withProfile.filter((p) => p.risk_profile === riskProfile)
      : withProfile;

  // Get distinct profit centers for filter
  const profitCenters = db
    .prepare("SELECT DISTINCT profit_center FROM partners ORDER BY profit_center")
    .all() as { profit_center: string }[];

  const profileOrder: RiskProfile[] = ["Lav", "Medium", "Høy", "Svært høy"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partnere</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Alle partnere med risikoscoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/risikoscoring" className="btn-secondary">
            Dashboard
          </Link>
          <Link href="/risikoscoring/partners/new" className="btn-primary">
            + Ny partner
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="profitCenter" className="form-label">
              Profit Center
            </label>
            <select
              id="profitCenter"
              name="profitCenter"
              defaultValue={profitCenter ?? "Alle"}
              className="form-select"
            >
              <option value="Alle">Alle</option>
              {profitCenters.map((pc) => (
                <option key={pc.profit_center} value={pc.profit_center}>
                  {pc.profit_center}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="riskProfile" className="form-label">
              Risikoprofil
            </label>
            <select
              id="riskProfile"
              name="riskProfile"
              defaultValue={riskProfile ?? "Alle"}
              className="form-select"
            >
              <option value="Alle">Alle</option>
              {profileOrder.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Filtrer
          </button>
        </div>
      </form>

      {/* Partners Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Ingen partnere funnet.{" "}
            <Link
              href="/risikoscoring/partners/new"
              className="text-blue-600 underline"
            >
              Opprett den første.
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="py-3 px-4">Partner-ID</th>
                  <th className="py-3 px-4">Navn</th>
                  <th className="py-3 px-4">Profit Center</th>
                  <th className="py-3 px-4">Ledernivå</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-4">Risikoprofil</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {p.partner_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {p.partner_name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.profit_center}</td>
                    <td className="py-3 px-4 text-gray-600">{p.leader_level}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      {p.total_risk_score}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge profile={p.risk_profile} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/risikoscoring/partners/${p.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Vis detaljer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
