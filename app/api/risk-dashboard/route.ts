import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import type { RiskProfile } from "@/lib/types";

interface PartnerScore {
  id: number;
  profit_center: string;
  total_risk_score: number;
}

function getRiskProfileFromScore(score: number): RiskProfile {
  if (score < 10) return "Lav";
  if (score < 20) return "Medium";
  if (score < 35) return "Høy";
  return "Svært høy";
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const profitCenter = url.searchParams.get("profitCenter");
  const riskProfile = url.searchParams.get("riskProfile");

  // Get all partners with computed scores
  let partners = db
    .prepare(
      `SELECT p.id, p.profit_center, COALESCE(SUM(e.poeng), 0) as total_risk_score
       FROM partners p
       LEFT JOIN risk_events e ON e.partner_id = p.id
       GROUP BY p.id`
    )
    .all() as PartnerScore[];

  // Filter by profit center
  if (profitCenter && profitCenter !== "Alle") {
    partners = partners.filter((p) => p.profit_center === profitCenter);
  }

  // Add risk profile and optionally filter
  const withProfile = partners
    .map((p) => ({
      ...p,
      risk_profile: getRiskProfileFromScore(p.total_risk_score),
    }))
    .filter((p) => {
      if (!riskProfile || riskProfile === "Alle") return true;
      return p.risk_profile === riskProfile;
    });

  const totalPartners = withProfile.length;
  const highRiskCount = withProfile.filter(
    (p) => p.risk_profile === "Høy" || p.risk_profile === "Svært høy"
  ).length;
  const scores = withProfile.map((p) => p.total_risk_score);
  const averageScore =
    totalPartners > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / totalPartners) * 10) / 10
      : 0;
  const highestScore = totalPartners > 0 ? Math.max(...scores) : 0;

  // Distribution
  const profileOrder: RiskProfile[] = ["Lav", "Medium", "Høy", "Svært høy"];
  const distribution = profileOrder.map((profile) => {
    const count = withProfile.filter((p) => p.risk_profile === profile).length;
    return {
      profile,
      count,
      percentage:
        totalPartners > 0 ? Math.round((count / totalPartners) * 1000) / 10 : 0,
    };
  });

  // Get distinct profit centers for filter dropdown
  const profitCenters = db
    .prepare("SELECT DISTINCT profit_center FROM partners ORDER BY profit_center")
    .all() as { profit_center: string }[];

  return NextResponse.json({
    total_partners: totalPartners,
    high_risk_count: highRiskCount,
    average_score: averageScore,
    highest_score: highestScore,
    distribution,
    profit_centers: profitCenters.map((p) => p.profit_center),
  });
}
