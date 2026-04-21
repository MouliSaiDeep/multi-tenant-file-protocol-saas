const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

(async () => {
  const db = await open({
    filename: "./db/prod.db",
    driver: sqlite3.Database,
  });

  const tables = await db.all(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  const users = await db.all("SELECT email, role FROM users ORDER BY id");
  const conn = await db.get(
    "SELECT encryptedPassword FROM connections ORDER BY id LIMIT 1",
  );
  const auditCount = await db.get("SELECT COUNT(*) as c FROM audit_log");

  console.log("tables", tables.map((t) => t.name));
  console.log("users", users);
  console.log("sampleEncryptedPasswordLength", conn?.encryptedPassword?.length || 0);
  console.log("sampleEncryptedPasswordValue", conn?.encryptedPassword || null);
  console.log("auditRows", auditCount.c);

  await db.close();
})();
