import express from "express";
import path from "node:path";
import type { Express } from "express";

export function registerStorageProxy(app: Express) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));
}
