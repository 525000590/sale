import path from "path";
import sqlite3 from "sqlite3";

// Minimal promise-wrapped sqlite helper (avoids depending on 'sqlite' wrapper)
export async function openDb() {
  const dbPath = path.join(process.cwd(), "data", "database.db");
  const db = new sqlite3.Database(dbPath);

  const run = (sql, ...params) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        // return lastID and changes similar to sqlite wrapper
        return resolve({ lastID: this.lastID, changes: this.changes });
      });
    });

  const get = (sql, ...params) =>
    new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });

  const all = (sql, ...params) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });

  const exec = (sql) =>
    new Promise((resolve, reject) => {
      db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });

  const close = () =>
    new Promise((resolve, reject) => {
      db.close((err) => (err ? reject(err) : resolve()));
    });

  // ensure tables
  await exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      tag TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      username TEXT UNIQUE,
      phone TEXT UNIQUE,
      address TEXT,
      gender TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT (datetime('now'))
    );
  `);

  // ensure columns exist (for upgrades)
  const cols = await all("PRAGMA table_info('users')");
  const existing = new Set(cols.map((c) => c.name));
  const toAdd = [];
  if (!existing.has('username')) toAdd.push("ALTER TABLE users ADD COLUMN username TEXT;");
  if (!existing.has('phone')) toAdd.push("ALTER TABLE users ADD COLUMN phone TEXT;");
  if (!existing.has('address')) toAdd.push("ALTER TABLE users ADD COLUMN address TEXT;");
  if (!existing.has('gender')) toAdd.push("ALTER TABLE users ADD COLUMN gender TEXT;");
  if (!existing.has('email')) toAdd.push("ALTER TABLE users ADD COLUMN email TEXT;");
  if (!existing.has('profile_complete')) toAdd.push("ALTER TABLE users ADD COLUMN profile_complete INTEGER DEFAULT 0;");
  if (!existing.has('seen_profile_prompt')) toAdd.push("ALTER TABLE users ADD COLUMN seen_profile_prompt INTEGER DEFAULT 0;");

  for (const s of toAdd) {
    try {
      await exec(s);
    } catch (e) {
      // ignore errors from attempting to add existing column in race conditions
    }
  }

  // create unique indexes if not exist (username/phone)
  try {
    await exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);");
    await exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);");
  } catch (e) {
    // ignore
  }

  return { run, get, all, exec, close };
}
