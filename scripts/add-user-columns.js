const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/database.db');

const adds = [
  "ALTER TABLE users ADD COLUMN username TEXT;",
  "ALTER TABLE users ADD COLUMN phone TEXT;",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);"
];

db.serialize(() => {
  for (const s of adds) {
    db.run(s, (err) => {
      if (err) console.log('note:', err.message);
      else console.log('ok:', s);
    });
  }
});

db.close();
