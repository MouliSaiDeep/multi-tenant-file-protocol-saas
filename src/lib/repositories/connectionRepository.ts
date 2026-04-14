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
};
