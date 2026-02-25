import Link from "next/link";
import { ISQM1_COMPONENT_CODES } from "@/lib/types";
import type { DashboardStats, Deficiency } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

async function getStats(): Promise<DashboardStats | null> {
  try {
    const res = await fetch("http://localhost:3000/api/dashboard", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  return (
    <div className={`card p-5 border-l-4 ${colour}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function RecentRow({ d }: { d: Deficiency }) {
  return (
    <Link
      href={`/deficiencies/${d.id}`}
      className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-md transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {ISQM1_COMPONENT_CODES[d.component]} &middot;{" "}
          {d.identified_date ?? d.created_at.slice(0, 10)}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <StatusBadge kind="severity" value={d.severity} />
        <StatusBadge kind="status" value={d.status} />
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-sm">
          Could not load dashboard data. Make sure the app is running.
        </p>
      </div>
    );
  }

  const severityOrder = ["pervasive", "significant", "minor"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quality deficiency overview — ISQM 1
          </p>
        </div>
        <Link href="/deficiencies/new" className="btn-primary">
          + Register Deficiency
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} colour="border-gray-400" />
        <StatCard label="Open" value={stats.open} colour="border-red-400" />
        <StatCard
          label="In Progress"
          value={stats.in_progress}
          colour="border-amber-400"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          colour="border-green-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By ISQM 1 Component */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            By ISQM 1 Component
          </h2>
          {stats.by_component.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.by_component.map((row) => {
                const pct =
                  stats.total > 0
                    ? Math.round((row.count / stats.total) * 100)
                    : 0;
                return (
                  <li key={row.component}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span className="truncate pr-2">{row.component}</span>
                      <span className="shrink-0 font-medium">
                        {row.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* By Severity */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            By Severity
          </h2>
          {stats.by_severity.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {severityOrder.map((sev) => {
                const row = stats.by_severity.find((r) => r.severity === sev);
                const count = row?.count ?? 0;
                const pct =
                  stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                const barColour =
                  sev === "pervasive"
                    ? "bg-red-500"
                    : sev === "significant"
                    ? "bg-orange-400"
                    : "bg-sky-400";
                return (
                  <li key={sev}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span className="capitalize">{sev}</span>
                      <span className="font-medium">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColour}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent deficiencies */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Recent Deficiencies
          </h2>
          <Link
            href="/deficiencies"
            className="text-xs text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No deficiencies registered yet.{" "}
            <Link href="/deficiencies/new" className="text-blue-600 underline">
              Register the first one.
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-gray-50 px-1">
            {stats.recent.map((d) => (
              <RecentRow key={d.id} d={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
