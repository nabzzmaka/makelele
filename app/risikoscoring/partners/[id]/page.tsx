import Link from "next/link";
import getDb from "@/lib/db";
import RiskBadge from "@/components/RiskBadge";
import EventForm from "@/components/EventForm";
import EventTable from "@/components/EventTable";
import DeletePartnerButton from "@/components/DeletePartnerButton";
import type { Partner, RiskEvent, RiskProfile } from "@/lib/types";
import { notFound } from "next/navigation";

function getRiskProfile(score: number): RiskProfile {
  if (score < 10) return "Lav";
  if (score < 20) return "Medium";
  if (score < 35) return "Høy";
  return "Svært høy";
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const partner = db
    .prepare("SELECT * FROM partners WHERE id = ?")
    .get(id) as Partner | undefined;

  if (!partner) {
    notFound();
  }

  const events = db
    .prepare(
      "SELECT * FROM risk_events WHERE partner_id = ? ORDER BY created_at DESC"
    )
    .all(id) as RiskEvent[];

  const totalScore = events.reduce((sum, e) => sum + e.poeng, 0);
  const riskProfile = getRiskProfile(totalScore);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500">
        <Link href="/risikoscoring" className="hover:text-blue-600">
          Dashboard
        </Link>
        {" / "}
        <Link href="/risikoscoring/partners" className="hover:text-blue-600">
          Partnere
        </Link>
        {" / "}
        <span className="text-gray-900">{partner.partner_name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {partner.partner_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Partner-ID: {partner.partner_id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/risikoscoring/partners/${partner.id}/edit`}
            className="btn-secondary"
          >
            Rediger
          </Link>
          <DeletePartnerButton partnerId={partner.id} />
        </div>
      </div>

      {/* Partner Info + Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Partnerinformasjon
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Profit Center</dt>
              <dd className="font-medium text-gray-900">
                {partner.profit_center}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Ledernivå</dt>
              <dd className="font-medium text-gray-900">
                {partner.leader_level}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-5 border-l-4 border-blue-400">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Total risikoscore
          </h2>
          <p className="text-4xl font-bold text-gray-900">{totalScore}</p>
          <p className="text-xs text-gray-500 mt-1">
            Sum av {events.length} hendelse{events.length !== 1 ? "r" : ""}
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Risikoprofil
          </h2>
          <div className="mt-2">
            <RiskBadge profile={riskProfile} />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {totalScore < 10 && "Score < 10 → Lav risiko"}
            {totalScore >= 10 && totalScore < 20 && "Score 10–19 → Medium risiko"}
            {totalScore >= 20 && totalScore < 35 && "Score 20–34 → Høy risiko"}
            {totalScore >= 35 && "Score ≥ 35 → Svært høy risiko"}
          </p>
        </div>
      </div>

      {/* Events */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Registrerte hendelser
        </h2>
        <EventTable events={events} />
      </div>

      {/* Add Event Form */}
      <EventForm partnerId={partner.id} />
    </div>
  );
}
