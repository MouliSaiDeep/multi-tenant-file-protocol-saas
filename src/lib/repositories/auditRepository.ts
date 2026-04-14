import { getDb } from "@/lib/db";
import type { AuditLogRow } from "@/lib/types";

export const auditRepository = {
  async log(input: {
    userId: number;
    connectionId: number | null;
    action: string;
    path: string | null;
  }): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO audit_log (userId, connectionId, action, path, timestamp)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      input.userId,
      input.connectionId,
      input.action,
      input.path,
    );
  },

  async listAll(): Promise<AuditLogRow[]> {
    const db = await getDb();
    return db.all<AuditLogRow[]>(
      "SELECT * FROM audit_log ORDER BY timestamp DESC, id DESC",
    );
  },
};
