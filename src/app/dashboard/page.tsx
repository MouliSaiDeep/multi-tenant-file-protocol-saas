"use client";

import { FormEvent, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

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
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "Test SFTP",
    protocol: "sftp",
    host: "sftp_server",
    port: 22,
    username: "testuser",
    password: "pass123",
  });

  async function loadConnections() {
    const res = await fetch("/api/connections");
    if (res.ok) {
      setItems(await res.json());
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      void loadConnections();
    }
  }, [status]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMsg("");
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setMsg("Failed to create connection");
      return;
    }

    setMsg("Connection saved");
    await loadConnections();
  }

  if (status === "loading") {
    return <main>Loading...</main>;
  }

  if (!session) {
    return <main>Please sign in first.</main>;
  }

  return (
    <main className="grid">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Dashboard</h1>
          <p className="small">
            Logged in as {session.user.email} ({session.user.role})
          </p>
        </div>
        <button
          className="secondary"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>

      <form className="card grid two" onSubmit={onCreate}>
        <h2 style={{ gridColumn: "1 / -1", margin: 0 }}>Add Connection</h2>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          value={form.protocol}
          onChange={(e) =>
            setForm({
              ...form,
              protocol: e.target.value as "sftp" | "ftp" | "smb",
            })
          }
        >
          <option value="sftp">SFTP</option>
          <option value="ftp">FTP</option>
          <option value="smb">SMB</option>
        </select>
        <input
          placeholder="Host"
          value={form.host}
          onChange={(e) => setForm({ ...form, host: e.target.value })}
          required
        />
        <input
          placeholder="Port"
          type="number"
          value={form.port}
          onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
          required
        />
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button style={{ gridColumn: "1 / -1" }} type="submit">
          Save Connection
        </button>
      </form>

      {msg && <p>{msg}</p>}

      <div className="card">
        <h2>Saved Connections</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Protocol</th>
              <th>Host</th>
              <th>User</th>
              <th>Browse</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.protocol}</td>
                <td>
                  {item.host}:{item.port}
                </td>
                <td>{item.username}</td>
                <td>
                  <a href={`/browser?connectionId=${item.id}&path=/`}>Open</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {session.user.role === "admin" && (
        <a className="card" href="/admin/audit">
          View full audit log (admin only)
        </a>
      )}
    </main>
  );
}
