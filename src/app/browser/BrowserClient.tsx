"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Download,
  File,
  FileArchive,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Pencil,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface FileEntry {
  name: string;
  type: "f" | "d";
  size: number;
  modifiedAt: string;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["ts", "tsx", "js", "jsx", "json"].includes(ext || "")) {
    return FileCode2;
  }
  if (["zip", "rar", "tar", "gz"].includes(ext || "")) {
    return FileArchive;
  }
  if (["txt", "md", "log", "csv"].includes(ext || "")) {
    return FileText;
  }
  return File;
}

function formatBytes(size: number) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = size;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function BrowserClient() {
  const params = useSearchParams();
  const connectionId = params.get("connectionId") || "";
  const path = params.get("path") || "/";

  const [items, setItems] = useState<FileEntry[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FileEntry | null>(null);

  const breadcrumbs = useMemo(() => {
    const parts = path.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; value: string }> = [
      { label: "Root", value: "/" },
    ];

    parts.forEach((segment, index) => {
      crumbs.push({
        label: segment,
        value: `/${parts.slice(0, index + 1).join("/")}`,
      });
    });

    return crumbs;
  }, [path]);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    const res = await fetch(
      `/api/fs/list?connectionId=${encodeURIComponent(connectionId)}&path=${encodeURIComponent(path)}`,
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMsg(body.message || body.error || "Failed to list files");
      setItems([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    const listed = (await res.json()) as FileEntry[];
    setItems(listed);
    setSelected(listed[0] || null);
    setLoading(false);
  }, [connectionId, path]);

  const uploadFile = useCallback(
    async (file: File | null) => {
      if (!file) return;

      const uploadPath =
        selected?.type === "d"
          ? path === "/"
            ? `/${selected.name}`
            : `${path}/${selected.name}`
          : path;

      const formData = new FormData();
      formData.append("connectionId", connectionId);
      formData.append("path", uploadPath);
      formData.append("file", file);

      const res = await fetch("/api/fs/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.message || body.error || "Failed to upload file";
        setMsg(message);
        toast.error(message);
        return;
      }

      toast.success(`Uploaded ${file.name}`);
      await load();
    },
    [connectionId, load, path, selected],
  );

  const renameItem = useCallback(
    async (item: FileEntry) => {
      const currentPath =
        path === "/" ? `/${item.name}` : `${path}/${item.name}`;
      const newName = window.prompt("Rename item", item.name)?.trim();

      if (!newName || newName === item.name) return;

      const nextPath = path === "/" ? `/${newName}` : `${path}/${newName}`;
      const res = await fetch(
        `/api/fs/rename?connectionId=${encodeURIComponent(connectionId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: currentPath, to: nextPath }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.message || body.error || "Failed to rename item";
        setMsg(message);
        toast.error(message);
        return;
      }

      toast.success(`Renamed ${item.name}`);
      await load();
    },
    [connectionId, load, path],
  );

  const deleteItem = useCallback(
    async (item: FileEntry) => {
      const currentPath =
        path === "/" ? `/${item.name}` : `${path}/${item.name}`;

      if (!window.confirm(`Delete ${item.name}?`)) return;

      const res = await fetch(
        `/api/fs/delete?connectionId=${encodeURIComponent(connectionId)}&path=${encodeURIComponent(currentPath)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.message || body.error || "Failed to delete item";
        setMsg(message);
        toast.error(message);
        return;
      }

      toast.success(`Deleted ${item.name}`);
      await load();
    },
    [connectionId, load, path],
  );

  useEffect(() => {
    if (connectionId) {
      void load();
    }
  }, [connectionId, load]);

  const canGoBack = path !== "/";
  const parentPath = canGoBack
    ? `/${path.split("/").filter(Boolean).slice(0, -1).join("/")}` || "/"
    : "/";

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Breadcrumb navigation */}
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="mx-auto max-w-6xl px-8 py-4">
          <div className="flex items-center gap-2 text-sm mb-4">
            <a href="/dashboard" className="btn-link">
              Dashboard
            </a>
            <ChevronRight className="h-4 w-4 text-slate-600" />
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.value} className="inline-flex items-center gap-2">
                <a
                  href={`/browser?connectionId=${encodeURIComponent(connectionId)}&path=${encodeURIComponent(crumb.value)}`}
                  className={
                    idx === breadcrumbs.length - 1
                      ? "text-slate-400"
                      : "btn-link"
                  }
                >
                  {crumb.label}
                </a>
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => void load()} className="btn-secondary-sm">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </button>

            <label className="ml-auto flex cursor-pointer items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/50 text-teal-300 hover:bg-teal-500/30">
              <UploadCloud className="h-4 w-4" />
              Upload File
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  void uploadFile(e.target.files?.[0] || null);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mx-auto max-w-6xl px-8 py-4">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {msg}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* File list */}
          <div className="card">
            <div className="border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Files</h2>
            </div>

            <div className="card-inner pt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-slate-700/30 rounded-lg skeleton"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="empty-state py-8">
                  <Folder className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-slate-400">Empty folder</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr className="text-xs uppercase text-slate-400 font-medium">
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Size</th>
                        <th className="px-6 py-3">Modified</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const itemPath =
                          path === "/"
                            ? `/${item.name}`
                            : `${path}/${item.name}`;
                        const Icon =
                          item.type === "d" ? Folder : fileIcon(item.name);

                        return (
                          <tr
                            key={itemPath}
                            onClick={() => setSelected(item)}
                            className="cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-slate-400" />
                                {item.type === "d" ? (
                                  <a
                                    href={`/browser?connectionId=${encodeURIComponent(connectionId)}&path=${encodeURIComponent(itemPath)}`}
                                    className="font-medium text-white hover:text-teal-400"
                                  >
                                    {item.name}
                                  </a>
                                ) : (
                                  <span className="font-medium text-slate-200">
                                    {item.name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-sm">
                              {item.type === "d" ? "Folder" : "File"}
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-sm">
                              {formatBytes(item.size)}
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-sm">
                              {new Date(item.modifiedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {item.type === "f" && (
                                  <a
                                    href={`/api/fs/download?connectionId=${encodeURIComponent(connectionId)}&path=${encodeURIComponent(itemPath)}`}
                                    className="btn-link text-sm"
                                  >
                                    Download
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void renameItem(item);
                                  }}
                                  className="btn-secondary-sm"
                                >
                                  <Pencil className="h-4 w-4 mr-1.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void deleteItem(item);
                                  }}
                                  className="btn-danger"
                                >
                                  <Trash2 className="h-4 w-4 mr-1.5" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Preview panel */}
          <div className="card card-inner">
            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                    Name
                  </p>
                  <p className="mt-1 text-slate-200 break-all text-sm">
                    {selected.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                    Type
                  </p>
                  <p className="mt-1 text-slate-200 text-sm">
                    {selected.type === "d" ? "Folder" : "File"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                    Size
                  </p>
                  <p className="mt-1 text-slate-200 text-sm">
                    {formatBytes(selected.size)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                    Modified
                  </p>
                  <p className="mt-1 text-slate-200 text-sm">
                    {new Date(selected.modifiedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                Select a file or folder to view details
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
