"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Download } from "lucide-react";

interface AuditLog {
  id: number;
  userId: number;
  connectionId: number | null;
  action: string;
  path: string | null;
  timestamp: string;
}

const actionColors: Record<string, { bg: string; text: string; dot: string }> =
  {
    list: { bg: "bg-blue-500/20", text: "text-blue-300", dot: "bg-blue-500" },
    download: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      dot: "bg-emerald-500",
    },
    upload: {
      bg: "bg-purple-500/20",
      text: "text-purple-300",
      dot: "bg-purple-500",
    },
    delete: { bg: "bg-red-500/20", text: "text-red-300", dot: "bg-red-500" },
    rename: {
      bg: "bg-amber-500/20",
      text: "text-amber-300",
      dot: "bg-amber-500",
    },
  };

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/audit");
      if (res.status === 403) {
        setError("Access Denied");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Failed to load audit logs");
        setLoading(false);
        return;
      }
      setLogs(await res.json());
      setLoading(false);
    }

    void load();
  }, []);

  const filtered = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    const result = logs.filter((log) => {
      const t = new Date(log.timestamp).getTime();
      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
      }
      if (from && t < from) {
        return false;
      }
      if (to && t > to) {
        return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortAsc ? ta - tb : tb - ta;
    });
  }, [logs, actionFilter, fromDate, toDate, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pages) {
      setPage(1);
    }
  }, [page, pages]);

  function exportCsv() {
    const rows = [
      ["id", "userId", "connectionId", "action", "path", "timestamp"],
      ...filtered.map((row) => [
        row.id,
        row.userId,
        row.connectionId ?? "",
        row.action,
        row.path ?? "",
        row.timestamp,
      ]),
    ];

    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="mx-auto max-w-6xl px-8 py-6 flex items-center justify-between">
          <div>
            <a href="/dashboard" className="text-sm btn-link mb-2 block">
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          </div>
          <button onClick={exportCsv} className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-teal-500 to-transparent"></div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-8">
        {/* Filters */}
        <div className="card card-inner mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              className="input"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="list">List</option>
              <option value="download">Download</option>
              <option value="upload">Upload</option>
              <option value="delete">Delete</option>
              <option value="rename">Rename</option>
            </select>
            <input
              type="date"
              className="input"
              placeholder="From date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="input"
              placeholder="To date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button
              onClick={() => setSortAsc((p) => !p)}
              className="btn-secondary"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortAsc ? "Oldest" : "Newest"}
            </button>
            {(actionFilter !== "all" || fromDate || toDate) && (
              <button
                onClick={() => {
                  setActionFilter("all");
                  setFromDate("");
                  setToDate("");
                }}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {error ? (
          <div className="card card-inner border border-red-500/30 bg-red-500/10">
            <p className="text-red-300">{error}</p>
          </div>
        ) : loading ? (
          <div className="card card-inner">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-700/30 rounded-lg skeleton"
                />
              ))}
            </div>
          </div>
        ) : current.length === 0 ? (
          <div className="empty-state">
            <p className="text-slate-400">No audit events found</p>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="text-xs uppercase text-slate-400 font-medium">
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Path</th>
                      <th className="px-6 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.map((row) => {
                      const colors = actionColors[row.action] || {
                        bg: "bg-slate-700/20",
                        text: "text-slate-300",
                        dot: "bg-slate-500",
                      };
                      return (
                        <tr key={row.id}>
                          <td className="px-6 py-4 text-white font-medium">
                            User {row.userId}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${colors.bg} ${colors.text}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${colors.dot}`}
                              ></span>
                              {row.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-mono text-sm max-w-xs truncate">
                            {row.path || "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(row.timestamp).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-secondary disabled:opacity-50"
                >
                  ← Previous
                </button>
                <span className="px-3 py-2 text-slate-300">
                  {page} / {pages}
                </span>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
