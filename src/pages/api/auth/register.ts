import type { NextApiRequest, NextApiResponse } from "next";
import { openDb } from "../_db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Registration now expects: username, phone, password (email optional)
  const { username, phone, password, email } = req.body as { username?: string; phone?: string; password?: string; email?: string };
  if (!username || !phone || !password) return res.status(400).json({ error: "username, phone and password required" });

  const db = await openDb();

  try {
    // check exists by username or phone
    const existing = await db.get("SELECT * FROM users WHERE username = ? OR phone = ?", username, phone);
    if (existing) return res.status(409).json({ error: "Username or phone already registered" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // ensure email is not null because existing DB may have NOT NULL constraint
    const emailValue = email || `${username}@no-email.local`;
    const result = await db.run(
      "INSERT INTO users (username, phone, email, password_hash, profile_complete) VALUES (?, ?, ?, ?, 0)",
      username,
      phone,
      emailValue,
      hash,
    );

    const user = await db.get("SELECT id, username, email, name, phone, address, gender, profile_complete, role, created_at FROM users WHERE id = ?", result.lastID);

    // sign token
    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    // set cookie (HttpOnly)
    res.setHeader("Set-Cookie", serialize("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 }));

    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
