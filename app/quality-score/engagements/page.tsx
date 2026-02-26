import Link from "next/link";
import getDb from "@/lib/db";
import type { Engagement, EngagementScore } from "@/lib/types";
import { calculateWeightedScore, getScoreBracket, getScoreBracketColour } from "@/lib/scoring";

async function getEngagements(): Promise<
  (Engagement & { total_weighted_score: number | null })[]
> {
  const db = getDb();
  const engagements = db
    .prepare("SELECT * FROM engagements ORDER BY created_at DESC")
    .all() as Engagement[];

  return engagements.map((e) => {
    const scores = db
      .prepare("SELECT * FROM engagement_scores WHERE engagement_id = ?")
      .all(e.id) as EngagementScore[];
    return {
      ...e,
      total_weighted_score: calculateWeightedScore(scores),
    };
  });
}

export default async function EngagementsListPage() {
  const engagements = await getEngagements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Engagements</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All scored audit engagements
          </p>
        </div>
        <Link href="/quality-score/engagements/new" className="btn-primary">
          + Score Engagement
        </Link>
      </div>

      {engagements.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 text-sm">
            No engagements yet.{" "}
            <Link
              href="/quality-score/engagements/new"
              className="text-blue-600 underline"
            >
              Score the first one.
            </Link>
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Partner
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  FY End
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Office</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {engagements.map((e) => {
                const score = e.total_weighted_score;
                const bracket = score !== null ? getScoreBracket(score) : null;
                const colour =
                  score !== null ? getScoreBracketColour(score) : "";
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/quality-score/engagements/${e.id}`}
                        className="text-blue-700 hover:underline font-medium"
                      >
                        {e.client_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {e.engagement_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.partner_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.financial_year_end}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.office || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {score !== null ? (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${colour}`}
                        >
                          {score}/100 — {bracket}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Not scored
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
