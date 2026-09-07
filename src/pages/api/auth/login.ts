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

  // Login accepts 'account' (username/phone/email) and password
  const { account, password } = req.body as { account?: string; password?: string };
  if (!account || !password) return res.status(400).json({ error: "account and password required" });

  const db = await openDb();

  try {
    const user = await db.get(
      "SELECT * FROM users WHERE username = ? OR email = ? OR phone = ?",
      account,
      account,
      account,
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.setHeader("Set-Cookie", serialize("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 }));

    // If profile incomplete and user hasn't been prompted before, mark that they've been prompted
    let seenPrompt = user.seen_profile_prompt || 0;
    let forceProfile = false;
    if ((!user.profile_complete || user.profile_complete === 0) && !seenPrompt) {
      try {
        await db.run("UPDATE users SET seen_profile_prompt = 1 WHERE id = ?", user.id);
        seenPrompt = 1;
        forceProfile = true; // first time login with incomplete profile
      } catch (e) {
        // ignore update errors
      }
    }

    // return safe user fields including profile completeness and a force_profile flag so client can decide redirect immediately
    const safe = { id: user.id, username: user.username, email: user.email, name: user.name, phone: user.phone, address: user.address, gender: user.gender, profile_complete: user.profile_complete, seen_profile_prompt: seenPrompt, force_profile: forceProfile, role: user.role, created_at: user.created_at };
    return res.status(200).json({ user: safe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
