import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = ".next/standalone";

if (!existsSync(standaloneDir)) {
  console.warn("copy-standalone: .next/standalone not found, skipping");
  process.exit(0);
}

cpSync("public", join(standaloneDir, "public"), { recursive: true });
mkdirSync(join(standaloneDir, ".next"), { recursive: true });
cpSync(".next/static", join(standaloneDir, ".next/static"), { recursive: true });

console.log("copy-standalone: public and static assets copied");
