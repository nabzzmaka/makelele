import type { RiskProfile } from "@/lib/types";

const RISK_STYLES: Record<RiskProfile, string> = {
  "Lav": "bg-green-100 text-green-800 border-green-200",
  "Medium": "bg-amber-100 text-amber-800 border-amber-200",
  "Høy": "bg-orange-100 text-orange-800 border-orange-200",
  "Svært høy": "bg-red-100 text-red-800 border-red-200",
};

export default function RiskBadge({ profile }: { profile: RiskProfile }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${RISK_STYLES[profile]}`}
    >
      {profile}
    </span>
  );
}
