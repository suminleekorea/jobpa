/**
 * 로컬 파일 서빙 — S3 미설정 시 ./uploads 폴더를 /uploads/* 로 서빙
 */
import type { Express } from "express";
import express from "express";
import path from "node:path";

export function registerStorageProxy(app: Express) {
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));
}
