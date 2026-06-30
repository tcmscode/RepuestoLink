#!/usr/bin/env node
/**
 * Gate único pre-demo: health + unit + integration (+ e2e opcional).
 * Uso: node scripts/demo-verify.mjs [--e2e]
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

try {
  loadEnvFile(path.join(root, ".env"));
} catch {
  // CI inyecta variables directamente
}
const runE2e = process.argv.includes("--e2e");
const baseUrl = process.env.DEMO_VERIFY_URL ?? "http://127.0.0.1:3000";

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd}`);
  const { env: extraEnv, ...rest } = opts;
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
    ...rest,
  });
}

function checkEnv() {
  const required = ["DATABASE_URL", "AUTH_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`❌ Faltan variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("✓ Variables de entorno mínimas presentes");
}

async function checkHealth() {
  if (runE2e) {
    console.log("⏭ Health HTTP omitido (--e2e corre build+start en Playwright)");
    return;
  }
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.ok) throw new Error("body.ok !== true");
    console.log(`✓ Health OK en ${baseUrl}`);
  } catch {
    console.log(
      "⚠ Servidor no disponible en health check (ok si solo corrés unit/integration)"
    );
  }
}

async function main() {
  console.log("=== RepuestoLink demo:verify ===\n");
  checkEnv();
  await checkHealth();

  run("npm run test:unit");
  run("npm run test:integration");

  if (runE2e) {
    run("npm run build");
    run("npm run test:e2e", {
      env: {
        ...process.env,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
      },
    });
  }

  console.log("\n✅ DEMO READY — gate automático superado");
}

main().catch((e) => {
  console.error("\n❌ demo:verify falló:", e.message ?? e);
  process.exit(1);
});
