#!/usr/bin/env node
/**
 * Production start for Render / local.
 * Always binds 0.0.0.0 and uses process.env.PORT (Render = 10000),
 * falling back to 3333 locally.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const port = String(process.env.PORT || "3333").trim() || "3333";
const host = "0.0.0.0";
const nextBin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

console.log(`[whimpost] starting on http://${host}:${port}`);

const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", host, "-p", port],
  { stdio: "inherit", env: process.env }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
