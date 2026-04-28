import { getDb } from "@/lib/db";
import type { ConnectionRow, Protocol } from "@/lib/types";

interface CreateConnectionInput {
  userId: number;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
}

export const connectionRepository = {
  async create(input: CreateConnectionInput): Promise<ConnectionRow> {
    const db = await getDb();

    const result = await db.run(
      `INSERT INTO connections (userId, name, protocol, host, port, username, encryptedPassword)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      input.userId,
      input.name,
      input.protocol,
      input.host,
      input.port,
      input.username,
      input.encryptedPassword,
    );

    const created = await db.get<ConnectionRow>(
      "SELECT * FROM connections WHERE id = ?",
      result.lastID,
    );
    if (!created) {
      throw new Error("Failed to create connection");
    }

    return created;
  },

  async listForRole(
    userId: number,
    role: "admin" | "member",
  ): Promise<ConnectionRow[]> {
    const db = await getDb();

    if (role === "admin") {
      return db.all<ConnectionRow[]>(
        "SELECT * FROM connections ORDER BY id DESC",
      );
    }

    return db.all<ConnectionRow[]>(
      "SELECT * FROM connections WHERE userId = ? ORDER BY id DESC",
      userId,
    );
  },

  async findAccessibleById(
    connectionId: number,
    userId: number,
    role: "admin" | "member",
  ): Promise<ConnectionRow | undefined> {
    const db = await getDb();

    if (role === "admin") {
      return db.get<ConnectionRow>(
        "SELECT * FROM connections WHERE id = ?",
        connectionId,
      );
    }

    return db.get<ConnectionRow>(
      "SELECT * FROM connections WHERE id = ? AND userId = ?",
      connectionId,
      userId,
    );
  },

  async findById(id: number): Promise<ConnectionRow | undefined> {
    const db = await getDb();
    return db.get<ConnectionRow>("SELECT * FROM connections WHERE id = ?", id);
  },

  async delete(id: number): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM connections WHERE id = ?", id);
  },

  async update(
    id: number,
    updates: Record<string, unknown>,
  ): Promise<ConnectionRow> {
    const db = await getDb();
    const keys = Object.keys(updates);
    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    const values = Object.values(updates);

    await db.run(`UPDATE connections SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);

    const updated = await db.get<ConnectionRow>(
      "SELECT * FROM connections WHERE id = ?",
      id,
    );
    if (!updated) {
      throw new Error("Failed to update connection");
    }

    return updated;
  },
};
