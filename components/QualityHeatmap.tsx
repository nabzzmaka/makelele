"use client";

import { QUALITY_DIMENSIONS } from "@/lib/types";

interface HeatmapCell {
  dimension_key: string;
  partner_name: string;
  avg_score: number;
}

interface Props {
  data: HeatmapCell[];
}

function getCellColour(score: number): string {
  if (score >= 4.5) return "bg-green-500 text-white";
  if (score >= 3.5) return "bg-green-200 text-green-900";
  if (score >= 2.5) return "bg-amber-200 text-amber-900";
  if (score >= 1.5) return "bg-orange-300 text-orange-900";
  return "bg-red-500 text-white";
}

export default function QualityHeatmap({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No heatmap data available yet. Score engagements to populate.
      </p>
    );
  }

  // Extract unique partners and dimensions
  const partners = [...new Set(data.map((d) => d.partner_name))].sort();
  const dimensions = QUALITY_DIMENSIONS.map((d) => d.key);
  const dimLabels: Record<string, string> = {};
  for (const d of QUALITY_DIMENSIONS) {
    dimLabels[d.key] = d.label;
  }

  // Build lookup
  const lookup = new Map<string, number>();
  for (const cell of data) {
    lookup.set(`${cell.dimension_key}|${cell.partner_name}`, cell.avg_score);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 pr-2 font-medium text-gray-600 sticky left-0 bg-white">
              Partner
            </th>
            {dimensions.map((dk) => (
              <th
                key={dk}
                className="py-2 px-1 font-medium text-gray-600 text-center min-w-[80px]"
                title={dimLabels[dk]}
              >
                {dimLabels[dk]
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr key={partner}>
              <td className="py-1.5 pr-2 font-medium text-gray-800 truncate max-w-[140px] sticky left-0 bg-white">
                {partner}
              </td>
              {dimensions.map((dk) => {
                const score = lookup.get(`${dk}|${partner}`);
                return (
                  <td key={dk} className="py-1.5 px-1">
                    {score !== undefined ? (
                      <div
                        className={`rounded px-2 py-1 text-center font-semibold ${getCellColour(
                          score
                        )}`}
                      >
                        {score.toFixed(1)}
                      </div>
                    ) : (
                      <div className="text-center text-gray-300">—</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span>Scale:</span>
        <span className="bg-red-500 text-white px-2 py-0.5 rounded">1.0</span>
        <span className="bg-orange-300 text-orange-900 px-2 py-0.5 rounded">
          2.0
        </span>
        <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
          3.0
        </span>
        <span className="bg-green-200 text-green-900 px-2 py-0.5 rounded">
          4.0
        </span>
        <span className="bg-green-500 text-white px-2 py-0.5 rounded">5.0</span>
      </div>
    </div>
  );
}
