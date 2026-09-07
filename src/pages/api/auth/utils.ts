import { NextApiRequest } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { openDb } from "../_db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function getTokenFromReq(req: NextApiRequest) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  const parsed = parse(cookie || "");
  return parsed.token || null;
}

export async function verifyAndGetUser(req: NextApiRequest) {
  const token = await getTokenFromReq(req);
  if (!token) return null;
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    const db = await openDb();
    const user = await db.get("SELECT id, username, email, name, phone, address, gender, profile_complete, role, created_at FROM users WHERE id = ?", payload.sub);
    return user || null;
  } catch (e) {
    return null;
  }
}
