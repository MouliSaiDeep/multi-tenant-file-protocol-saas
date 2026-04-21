import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import { encryptSecret } from "../src/lib/crypto";

async function main() {
  const dbPath = process.env.DATABASE_PATH || "./db/prod.db";

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  const adminEmail = "admin@example.com";
  const memberEmail = "member@example.com";

  const adminHash = await bcrypt.hash("adminpass123", 10);
  const memberHash = await bcrypt.hash("memberpass123", 10);

  await db.run(
    `INSERT INTO users (email, password, role)
     VALUES (?, ?, 'admin')
     ON CONFLICT(email) DO UPDATE SET password = excluded.password, role = excluded.role`,
    adminEmail,
    adminHash,
  );

  await db.run(
    `INSERT INTO users (email, password, role)
     VALUES (?, ?, 'member')
     ON CONFLICT(email) DO UPDATE SET password = excluded.password, role = excluded.role`,
    memberEmail,
    memberHash,
  );

  const adminUser = await db.get<{ id: number }>(
    "SELECT id FROM users WHERE email = ?",
    adminEmail,
  );
  const memberUser = await db.get<{ id: number }>(
    "SELECT id FROM users WHERE email = ?",
    memberEmail,
  );

  if (!adminUser || !memberUser) {
    throw new Error("Unable to load seeded users");
  }

  const seeded = [
    {
      userId: adminUser.id,
      name: "Admin SFTP",
      protocol: "sftp",
      host: "sftp_server",
      port: 22,
      username: "testuser",
      password: "pass123",
    },
    {
      userId: memberUser.id,
      name: "Member FTP",
      protocol: "ftp",
      host: "ftp_server",
      port: 21,
      username: "testuser",
      password: "pass123",
    },
  ];

  for (const item of seeded) {
    const existing = await db.get<{ id: number }>(
      "SELECT id FROM connections WHERE userId = ? AND name = ?",
      item.userId,
      item.name,
    );

    if (existing) {
      continue;
    }

    await db.run(
      `INSERT INTO connections (userId, name, protocol, host, port, username, encryptedPassword)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      item.userId,
      item.name,
      item.protocol,
      item.host,
      item.port,
      item.username,
      encryptSecret(item.password),
    );
  }

  await db.close();
  console.log("Seed completed");
}

main().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
