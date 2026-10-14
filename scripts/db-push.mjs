import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationsDir = join(root, "database", "migrations");

// Fixed key so concurrent runs serialise instead of racing on DDL.
const ADVISORY_LOCK_KEY = 727123456;

// Migration files are executed as-is, so they must be re-runnable: every one uses
// CREATE TABLE/INDEX IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE FUNCTION.
// That property is what makes a partially recorded run recoverable.
function readEnvFile(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return;
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Never clobber a value the caller exported explicitly.
    if (!(key in process.env)) process.env[key] = value;
  }
}

readEnvFile(join(root, ".env.local"));
readEnvFile(join(root, ".env"));

function discoverMigrations() {
  let entries;
  try {
    entries = readdirSync(migrationsDir);
  } catch {
    throw new Error(`Folder migrasi tidak ditemukan: ${migrationsDir}`);
  }

  return entries
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => {
      const fullPath = join(migrationsDir, name);
      return {
        version: name.replace(/\.sql$/, ""),
        name,
        path: fullPath,
        size: statSync(fullPath).size,
      };
    });
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const listOnly = args.includes("--list");

  const migrations = discoverMigrations();

  if (listOnly) {
    console.log(`Migrasi ditemukan (${migrations.length}), urutan penerapan:\n`);
    migrations.forEach((m, index) => {
      console.log(`  ${String(index + 1).padStart(2)}. ${m.name}  (${formatSize(m.size)})`);
    });
    return;
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("DATABASE_URL belum diset.");
    console.error("");
    console.error("Ambil connection string dari Supabase Dashboard:");
    console.error("  Project Settings -> Database -> Connection string -> Session pooler (URI)");
    console.error("Lalu tambahkan ke .env.local:");
    console.error('  DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"');
    console.error("");
    console.error("Pakai Session pooler (port 5432), bukan Transaction pooler (6543), untuk DDL.");
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    connectionString,
    // Supabase terminates TLS with its own chain; the pooler cert is not in the
    // local trust store, so verification is relaxed for this local tool.
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Terhubung. ${migrations.length} file migrasi ditemukan.\n`);

  try {
    await client.query("SELECT pg_advisory_lock($1)", [ADVISORY_LOCK_KEY]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
      )
    `);

    const { rows } = await client.query("SELECT version FROM public.schema_migrations");
    const applied = new Set(rows.map((row) => row.version));

    const pending = migrations.filter((m) => !applied.has(m.version));

    console.log("Status:");
    migrations.forEach((m) => {
      const mark = applied.has(m.version) ? "sudah" : "BELUM";
      console.log(`  [${mark}] ${m.name}`);
    });
    console.log("");

    if (pending.length === 0) {
      console.log("Database sudah pada versi terbaru. Tidak ada yang dijalankan.");
      return;
    }

    if (!apply) {
      console.log(`${pending.length} migrasi menunggu. Ini baru pratinjau (dry-run).`);
      console.log("Jalankan ulang dengan --apply untuk menerapkan:");
      console.log("  npm run db:push -- --apply");
      return;
    }

    for (const migration of pending) {
      const sql = readFileSync(migration.path, "utf8");
      process.stdout.write(`Menerapkan ${migration.name} ... `);

      // The file carries its own BEGIN/COMMIT, so it is atomic on its own. The
      // version row is written after, in a separate transaction: if that write is
      // lost, the next run re-executes an idempotent file instead of corrupting state.
      await client.query(sql);
      await client.query(
        "INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING",
        [migration.version],
      );

      console.log("selesai.");
    }

    console.log(`\n${pending.length} migrasi diterapkan.`);
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

main().catch((error) => {
  console.error(`\nGagal: ${error.message}`);
  process.exitCode = 1;
});
