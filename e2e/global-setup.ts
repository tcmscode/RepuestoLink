import { execSync } from "node:child_process";
import path from "node:path";

export default async function globalSetup() {
  const root = path.resolve(__dirname, "..");

  execSync("npx prisma db push", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  execSync("npx tsx prisma/seed.ts", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
}
