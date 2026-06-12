import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.env.PORT ?? "3000";

if (!existsSync(nextCli)) {
  console.error("start-production: next CLI not found — run npm ci first");
  process.exit(1);
}

console.log(
  `[start] binding 0.0.0.0:${port} (env PORT=${process.env.PORT ?? "unset"}, env HOSTNAME=${process.env.HOSTNAME ?? "unset"})`
);

const child = spawn(
  process.execPath,
  [nextCli, "start", "--hostname", "0.0.0.0", "--port", port],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, HOSTNAME: "0.0.0.0" },
  }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
