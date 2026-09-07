import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAndGetUser } from "./utils";
import { openDb } from "../_db";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const user = await verifyAndGetUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword required" });
  if (typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({ error: "newPassword must be at least 6 characters" });

  try {
    const db = await openDb();
    const row: any = await db.get("SELECT password_hash FROM users WHERE id = ?", user.id);
    if (!row || !row.password_hash) return res.status(500).json({ error: "Unable to verify password" });

    const ok = await bcrypt.compare(currentPassword, row.password_hash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await db.run("UPDATE users SET password_hash = ? WHERE id = ?", newHash, user.id);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
