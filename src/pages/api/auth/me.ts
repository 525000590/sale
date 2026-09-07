import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAndGetUser } from "./utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await verifyAndGetUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  return res.status(200).json({ user });
}
