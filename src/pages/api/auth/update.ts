import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAndGetUser } from "./utils";
import { openDb } from "../_db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyAndGetUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, email, address, gender } = req.body as { name?: string; email?: string; address?: string; gender?: string };
  const db = await openDb();
  try {
    // determine if profile is now complete
    const emailPlaceholder = email && typeof email === 'string' && email.endsWith('@no-email.local');
    const complete = !!(name && name.trim() && email && !emailPlaceholder && address && gender);

    await db.run(
      "UPDATE users SET name = ?, email = ?, address = ?, gender = ?, profile_complete = ? WHERE id = ?",
      name || null,
      email || null,
      address || null,
      gender || null,
      complete ? 1 : 0,
      user.id,
    );

    const updated = await db.get("SELECT id, username, email, name, phone, address, gender, profile_complete, role, created_at FROM users WHERE id = ?", user.id);
    return res.status(200).json({ user: updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
}
