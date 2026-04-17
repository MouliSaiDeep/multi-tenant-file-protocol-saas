"use client";

import { useEffect, useState } from "react";

interface AuditLog {
  id: number;
  userId: number;
  connectionId: number | null;
  action: string;
  path: string | null;
  timestamp: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/audit");
      if (!res.ok) {
        setError("You are not allowed to view audit logs.");
        return;
      }
      setLogs(await res.json());
    }

    void load();
  }, []);

  return (
    <main className="grid">
      <div>
        <a href="/dashboard">Back to dashboard</a>
        <h1>Audit Log</h1>
      </div>
      {error && <p>{error}</p>}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Connection</th>
              <th>Action</th>
              <th>Path</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.userId}</td>
                <td>{row.connectionId ?? "-"}</td>
                <td>{row.action}</td>
                <td>{row.path || "-"}</td>
                <td>{new Date(row.timestamp).toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
