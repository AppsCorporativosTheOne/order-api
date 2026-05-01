const fs = require("node:fs");
const path = require("node:path");
const pg = require("pg");
require("dotenv/config");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const migrationsDir = path.resolve(__dirname, "..", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

  await pool.query(`
    create table if not exists schema_migrations (
      filename varchar(255) primary key,
      executed_at timestamptz not null default now()
    )
  `);

  for (const file of files) {
    const alreadyExecuted = await pool.query("select filename from schema_migrations where filename = $1", [file]);

    if (alreadyExecuted.rowCount) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

    await pool.query("begin");
    try {
      await pool.query(sql);
      await pool.query("insert into schema_migrations (filename) values ($1)", [file]);
      await pool.query("commit");
      console.log(`Migration executada: ${file}`);
    } catch (error) {
      await pool.query("rollback");
      throw error;
    }
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
