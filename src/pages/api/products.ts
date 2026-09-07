import type { NextApiRequest, NextApiResponse } from "next";
import { openDb } from "./_db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();
  const id = req.query.id ? Number(req.query.id) : null;

  if (req.method === "GET") {
    if (id) {
      const product = await db.get("SELECT * FROM products WHERE id = ?", id);
      if (!product) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(product);
    }

    const products = await db.all("SELECT * FROM products ORDER BY id DESC");
    return res.status(200).json(products);
  }

  if (req.method === "POST") {
    const body = req.body;
    if (!body?.name || !body?.price) return res.status(400).json({ error: "Missing name or price" });

    const result = await db.run(
      "INSERT INTO products (name, price, description, icon, color, tag) VALUES (?, ?, ?, ?, ?, ?)",
      body.name,
      body.price,
      body.description || null,
      body.icon || null,
      body.color || null,
      body.tag || null,
    );

    const newProduct = await db.get("SELECT * FROM products WHERE id = ?", result.lastID);
    return res.status(201).json(newProduct);
  }

  if (req.method === "PUT") {
    if (!id) return res.status(400).json({ error: "Missing id" });
    const body = req.body;
    await db.run(
      "UPDATE products SET name = ?, price = ?, description = ?, icon = ?, color = ?, tag = ? WHERE id = ?",
      body.name,
      body.price,
      body.description || null,
      body.icon || null,
      body.color || null,
      body.tag || null,
      id,
    );
    const updated = await db.get("SELECT * FROM products WHERE id = ?", id);
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    if (!id) return res.status(400).json({ error: "Missing id" });
    await db.run("DELETE FROM products WHERE id = ?", id);
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
