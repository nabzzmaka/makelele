import Link from "next/link";
import type { Deficiency } from "@/lib/types";
import { ISQM1_COMPONENTS, ISQM1_COMPONENT_CODES } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

interface SearchParams {
  status?: string;
  component?: string;
  severity?: string;
}

async function getDeficiencies(filters: SearchParams): Promise<Deficiency[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.component) params.set("component", filters.component);
  if (filters.severity) params.set("severity", filters.severity);

  const res = await fetch(
    `http://localhost:3000/api/deficiencies?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function DeficienciesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const deficiencies = await getDeficiencies(resolvedParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deficiencies</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {deficiencies.length} record{deficiencies.length !== 1 ? "s" : ""}
            {Object.values(resolvedParams).some(Boolean) ? " (filtered)" : ""}
          </p>
        </div>
        <Link href="/deficiencies/new" className="btn-primary">
          + Register Deficiency
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label" htmlFor="filter-status">
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            className="form-select w-36"
            defaultValue={resolvedParams.status ?? ""}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="filter-severity">
            Severity
          </label>
          <select
            id="filter-severity"
            name="severity"
            className="form-select w-36"
            defaultValue={resolvedParams.severity ?? ""}
          >
            <option value="">All</option>
            <option value="minor">Minor</option>
            <option value="significant">Significant</option>
            <option value="pervasive">Pervasive</option>
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="form-label" htmlFor="filter-component">
            ISQM 1 Component
          </label>
          <select
            id="filter-component"
            name="component"
            className="form-select"
            defaultValue={resolvedParams.component ?? ""}
          >
            <option value="">All components</option>
            {ISQM1_COMPONENTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Filter
          </button>
          <Link href="/deficiencies" className="btn-secondary">
            Clear
          </Link>
        </div>
      </form>

      {/* Table */}
      {deficiencies.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-sm">No deficiencies found.</p>
          <Link
            href="/deficiencies/new"
            className="mt-3 inline-block text-blue-600 text-sm underline"
          >
            Register the first one
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Component
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Nature
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Date
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deficiencies.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {d.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                      <Link
                        href={`/deficiencies/${d.id}`}
                        className="hover:text-blue-700"
                      >
                        {d.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span
                        title={d.component}
                        className="inline-flex items-center gap-1"
                      >
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {ISQM1_COMPONENT_CODES[d.component]}
                        </span>
                        <span className="hidden lg:inline text-xs text-gray-500 max-w-[180px] truncate">
                          {d.component}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="nature" value={d.nature} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="severity" value={d.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="status" value={d.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {d.identified_date ?? d.created_at.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/deficiencies/${d.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
