import { getDb } from "@/lib/db";
import type { UserRow } from "@/lib/types";

export const userRepository = {
  async findByEmail(email: string): Promise<UserRow | undefined> {
    const db = await getDb();
    return db.get<UserRow>("SELECT * FROM users WHERE email = ?", email);
  },

  async findById(id: number): Promise<UserRow | undefined> {
    const db = await getDb();
    return db.get<UserRow>("SELECT * FROM users WHERE id = ?", id);
  },
};
