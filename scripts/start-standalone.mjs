import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = join(root, ".next", "standalone", "server.js");

if (!existsSync(serverPath)) {
  console.error("start-standalone: missing .next/standalone/server.js — run npm run build first");
  process.exit(1);
}

// Railway injects HOSTNAME with the container id; Next standalone binds to it and
// becomes unreachable from the edge proxy. Force 0.0.0.0 so healthchecks pass.
const child = spawn(process.execPath, [serverPath], {
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: "0.0.0.0" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
