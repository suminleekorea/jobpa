// Quick dev server launcher that loads .env manually then spawns tsx
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envTxt = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
for (const line of envTxt.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
process.env.NODE_ENV = "development";

const tsxBin = path.join(__dirname, "node_modules", ".bin", "tsx.cmd");
const child = spawn(tsxBin, ["server/_core/index.ts"], {
  cwd: __dirname,
  env: process.env,
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
