"use client";

import { FormEvent, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Activity, Database, User } from "lucide-react";
import { toast } from "sonner";

interface Connection {
  id: number;
  userId: number;
  name: string;
  protocol: "sftp" | "ftp" | "smb";
  host: string;
  port: number;
  username: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Connection[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    protocol: "sftp" as "sftp" | "ftp" | "smb",
    host: "",
    port: 22,
    username: "",
    password: "",
  });

  async function loadConnections() {
    setLoadingList(true);
    const res = await fetch("/api/connections");
    if (res.ok) {
      setItems(await res.json());
    }
    setLoadingList(false);
  }

  useEffect(() => {
    if (status === "authenticated") {
      void loadConnections();
    }
  }, [status]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpenCreate(false);
    setForm({
      name: "",
      protocol: "sftp",
      host: "",
      port: 22,
      username: "",
      password: "",
    });
    await loadConnections();
  }

  async function onDelete(id: number, name: string) {
    if (!window.confirm(`Delete connection ${name}?`)) return;

    const res = await fetch(`/api/connections/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.message || "Failed to delete connection");
      return;
    }

    toast.success(`Deleted ${name}`);
    await loadConnections();
  }

  async function onEdit(connection: Connection) {
    const nextName = window.prompt("Connection name", connection.name)?.trim();

    if (!nextName || nextName === connection.name) return;

    const res = await fetch(`/api/connections/${connection.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.message || "Failed to update connection");
      return;
    }

    toast.success(`Updated ${nextName}`);
    await loadConnections();
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-slate-900 p-8">
        <div className="text-slate-400">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="card card-inner max-w-md">
          <p className="text-slate-300">Please sign in first.</p>
        </div>
      </main>
    );
  }

  const protocolBadge = {
    sftp: "badge-sftp",
    ftp: "badge-ftp",
    smb: "badge-smb",
  };

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Top bar */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">File Gateway</h1>
          <div className="flex items-center gap-6">
            <span className="text-slate-400">{session.user.email}</span>
            {session.user.role === "admin" && (
              <a href="/admin/audit" className="btn-link text-sm">
                Audit Log
              </a>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="btn-secondary-sm"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-teal-500 to-transparent"></div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card card-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  Connections
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {items.length}
                </p>
              </div>
              <div className="p-3 bg-teal-500/10 rounded-lg">
                <Database className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </div>

          <div className="card card-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">
                  Recent Activity
                </p>
                <p className="text-3xl font-bold text-white mt-1">—</p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <Activity className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="card card-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Role</p>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                    session.user.role === "admin"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-700/50 text-slate-300"
                  }`}
                >
                  {session.user.role}
                </span>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <User className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Connections section */}
        <div className="card">
          <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Connections</h2>
            <button onClick={() => setOpenCreate(true)} className="btn-primary">
              + Add Connection
            </button>
          </div>

          <div className="card-inner pt-4">
            {loadingList ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-700/30 rounded-lg skeleton"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state py-12">
                <Database className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400">No connections yet</p>
                <button
                  onClick={() => setOpenCreate(true)}
                  className="btn-primary mt-4"
                >
                  Add your first connection
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="text-xs uppercase text-slate-400 font-medium">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Protocol</th>
                      <th className="px-6 py-3">Host</th>
                      <th className="px-6 py-3">Port</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.id}>
                        <td className="px-6 py-4 font-medium text-white">
                          {c.name}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`badge ${protocolBadge[c.protocol]}`}
                          >
                            <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
                            {c.protocol.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                          {c.host}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{c.port}</td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`/browser?connectionId=${c.id}&path=/`}
                            className="btn-link text-sm mr-4"
                          >
                            Browse
                          </a>
                          <button
                            onClick={() => void onEdit(c)}
                            className="btn-secondary-sm mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void onDelete(c.id, c.name)}
                            className="btn-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {openCreate && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="border-b border-slate-700 pb-4 mb-6">
              <h3 className="text-xl font-semibold text-white">
                Add Connection
              </h3>
            </div>

            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name
                </label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My SFTP Server"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Protocol
                  </label>
                  <select
                    className="input"
                    value={form.protocol}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        protocol: e.target.value as any,
                        port:
                          e.target.value === "sftp"
                            ? 22
                            : e.target.value === "ftp"
                              ? 21
                              : 445,
                      })
                    }
                  >
                    <option value="sftp">SFTP</option>
                    <option value="ftp">FTP</option>
                    <option value="smb">SMB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={form.port}
                    onChange={(e) =>
                      setForm({ ...form, port: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Host
                </label>
                <input
                  className="input"
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="192.168.1.100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    className="input"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="user"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpenCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
