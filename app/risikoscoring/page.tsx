import Link from "next/link";
import getDb from "@/lib/db";
import RiskBadge from "@/components/RiskBadge";
import type { RiskProfile } from "@/lib/types";

interface PartnerScore {
  id: number;
  partner_id: string;
  partner_name: string;
  profit_center: string;
  total_risk_score: number;
}

function getRiskProfile(score: number): RiskProfile {
  if (score < 10) return "Lav";
  if (score < 20) return "Medium";
  if (score < 35) return "Høy";
  return "Svært høy";
}

export default async function RiskDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ profitCenter?: string; riskProfile?: string }>;
}) {
  const { profitCenter, riskProfile } = await searchParams;
  const db = getDb();

  // Get all partners with computed scores
  let partners = db
    .prepare(
      `SELECT p.id, p.partner_id, p.partner_name, p.profit_center,
              COALESCE(SUM(e.poeng), 0) as total_risk_score
       FROM partners p
       LEFT JOIN risk_events e ON e.partner_id = p.id
       GROUP BY p.id
       ORDER BY total_risk_score DESC`
    )
    .all() as PartnerScore[];

  // Apply filters
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

  // KPIs
  const totalPartners = filtered.length;
  const highRiskCount = filtered.filter(
    (p) => p.risk_profile === "Høy" || p.risk_profile === "Svært høy"
  ).length;
  const scores = filtered.map((p) => p.total_risk_score);
  const averageScore =
    totalPartners > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / totalPartners) * 10) / 10
      : 0;
  const highestScore = totalPartners > 0 ? Math.max(...scores) : 0;

  // Distribution
  const profileOrder: RiskProfile[] = ["Lav", "Medium", "Høy", "Svært høy"];
  const distribution = profileOrder.map((profile) => {
    const count = filtered.filter((p) => p.risk_profile === profile).length;
    return {
      profile,
      count,
      percentage:
        totalPartners > 0
          ? Math.round((count / totalPartners) * 1000) / 10
          : 0,
    };
  });

  // Get distinct profit centers for filter
  const profitCenters = db
    .prepare("SELECT DISTINCT profit_center FROM partners ORDER BY profit_center")
    .all() as { profit_center: string }[];

  const profileBarColours: Record<RiskProfile, string> = {
    "Lav": "bg-green-500",
    "Medium": "bg-amber-400",
    "Høy": "bg-orange-500",
    "Svært høy": "bg-red-500",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Risikoscoring Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Partner-risikoprofiler og avvikspoeng
          </p>
        </div>
        <Link href="/risikoscoring/partners" className="btn-primary">
          Se alle partnere
        </Link>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-blue-400">
          <p className="text-sm text-gray-500">Antall partnere</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{totalPartners}</p>
        </div>
        <div className="card p-5 border-l-4 border-red-400">
          <p className="text-sm text-gray-500">Høy / Svært høy risiko</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{highRiskCount}</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-400">
          <p className="text-sm text-gray-500">Gjennomsnittlig score</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{averageScore}</p>
        </div>
        <div className="card p-5 border-l-4 border-orange-400">
          <p className="text-sm text-gray-500">Høyeste score</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{highestScore}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Risikofordeling
          </h2>
          <ul className="space-y-3">
            {distribution.map((d) => (
              <li key={d.profile}>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span className="flex items-center gap-2">
                    <RiskBadge profile={d.profile} />
                  </span>
                  <span className="font-medium">
                    {d.count} ({d.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${profileBarColours[d.profile]}`}
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Risk Partners */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Høyeste risiko (topp 5)
          </h2>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400">Ingen partnere funnet.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/risikoscoring/partners/${p.id}`}
                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.partner_name}
                      </p>
                      <p className="text-xs text-gray-500">{p.profit_center}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-gray-700">
                        {p.total_risk_score}
                      </span>
                      <RiskBadge profile={p.risk_profile} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
