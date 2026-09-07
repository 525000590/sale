const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { createClient } = require("@supabase/supabase-js");

const SQLITE_PATH = path.join(process.cwd(), "data", "database.db");
const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

function loadEnvLocalIfPresent() {
  if (!fs.existsSync(ENV_LOCAL_PATH)) return;
  const content = fs.readFileSync(ENV_LOCAL_PATH, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function allAsync(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });
}

function openSqlite() {
  return new sqlite3.Database(SQLITE_PATH);
}

async function readLocalData() {
  const db = openSqlite();
  try {
    const products = await allAsync(db, "SELECT * FROM products ORDER BY id ASC");
    const users = await allAsync(db, "SELECT * FROM users ORDER BY id ASC");
    return { products, users };
  } finally {
    db.close();
  }
}

async function fetchRemoteIds(supabase, table) {
  const { data, error } = await supabase.from(table).select("id");
  if (error) throw new Error(`Read remote ids failed for ${table}: ${error.message}`);
  return new Set((data || []).map((row) => Number(row.id)));
}

function diffIds(localRows, remoteIds) {
  const localIds = new Set(localRows.map((row) => Number(row.id)));
  const toDelete = [];
  for (const id of remoteIds) {
    if (!localIds.has(id)) toDelete.push(id);
  }
  return toDelete;
}

async function upsertRows(supabase, table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Upsert failed for ${table}: ${error.message}`);
}

async function deleteRows(supabase, table, ids) {
  if (!ids.length) return;
  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) throw new Error(`Delete failed for ${table}: ${error.message}`);
}

async function syncOnce(supabase) {
  const startedAt = new Date().toISOString();
  const { products, users } = await readLocalData();

  const [remoteProductIds, remoteUserIds] = await Promise.all([
    fetchRemoteIds(supabase, "products"),
    fetchRemoteIds(supabase, "users"),
  ]);

  const productIdsToDelete = diffIds(products, remoteProductIds);
  const userIdsToDelete = diffIds(users, remoteUserIds);

  await upsertRows(supabase, "products", products);
  await upsertRows(supabase, "users", users);

  await deleteRows(supabase, "products", productIdsToDelete);
  await deleteRows(supabase, "users", userIdsToDelete);

  console.log(
    `[${startedAt}] Synced: products=${products.length}, users=${users.length}, deletedProducts=${productIdsToDelete.length}, deletedUsers=${userIdsToDelete.length}`
  );
}

function parseIntervalMs(args) {
  const raw = args.find((a) => a.startsWith("--interval="));
  if (!raw) return 2000;
  const ms = Number(raw.split("=")[1]);
  if (!Number.isFinite(ms) || ms < 500) {
    throw new Error("Invalid --interval value. Use milliseconds >= 500.");
  }
  return ms;
}

async function main() {
  loadEnvLocalIfPresent();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Put them in .env.local first."
    );
  }

  if (!fs.existsSync(SQLITE_PATH)) {
    throw new Error(`SQLite file not found: ${SQLITE_PATH}`);
  }

  const args = process.argv.slice(2);
  const watchMode = args.includes("--watch");
  const intervalMs = parseIntervalMs(args);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await syncOnce(supabase);
  if (!watchMode) return;

  let lastMtimeMs = fs.statSync(SQLITE_PATH).mtimeMs;
  let isSyncing = false;

  console.log(`Watching ${SQLITE_PATH} every ${intervalMs}ms...`);

  setInterval(async () => {
    const nextMtimeMs = fs.statSync(SQLITE_PATH).mtimeMs;
    if (nextMtimeMs === lastMtimeMs) return;
    lastMtimeMs = nextMtimeMs;
    if (isSyncing) return;

    isSyncing = true;
    try {
      await syncOnce(supabase);
    } catch (err) {
      console.error("Auto-sync failed:", err.message);
    } finally {
      isSyncing = false;
    }
  }, intervalMs);
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
