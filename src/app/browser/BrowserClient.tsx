"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface FileEntry {
  name: string;
  type: "f" | "d";
  size: number;
  modifiedAt: string;
}

export function BrowserClient() {
  const params = useSearchParams();
  const connectionId = params.get("connectionId") || "";
  const path = params.get("path") || "/";

  const [items, setItems] = useState<FileEntry[]>([]);
  const [msg, setMsg] = useState("");

  const title = useMemo(
    () => `Connection ${connectionId} :: ${path}`,
    [connectionId, path],
  );

  useEffect(() => {
    async function load() {
      setMsg("");
      const res = await fetch(
        `/api/fs/list?connectionId=${encodeURIComponent(connectionId)}&path=${encodeURIComponent(path)}`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMsg(body.message || body.error || "Failed to list files");
        return;
      }

      setItems(await res.json());
    }

    if (connectionId) {
      void load();
    }
  }, [connectionId, path]);

  return (
    <main className="grid">
      <div>
        <a href="/dashboard">Back to dashboard</a>
        <h1>{title}</h1>
      </div>

      {msg && <p>{msg}</p>}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Modified</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemPath =
                path === "/" ? `/${item.name}` : `${path}/${item.name}`;
              return (
                <tr key={itemPath}>
                  <td>{item.name}</td>
                  <td>{item.type === "d" ? "directory" : "file"}</td>
                  <td>{item.size}</td>
                  <td>{new Date(item.modifiedAt).toLocaleString()}</td>
                  <td>
                    {item.type === "d" ? (
                      <a
                        href={`/browser?connectionId=${encodeURIComponent(connectionId)}&path=${encodeURIComponent(
                          itemPath,
                        )}`}
                      >
                        Open
                      </a>
                    ) : (
                      <a
                        href={`/api/fs/download?connectionId=${encodeURIComponent(
                          connectionId,
                        )}&path=${encodeURIComponent(itemPath)}`}
                      >
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
