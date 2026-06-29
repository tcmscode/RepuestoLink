import { testPrisma } from "./db";

let dbReady = false;

export function isIntegrationDbReady() {
  return dbReady;
}

/** Llamar en beforeAll del suite de integración. */
export async function initIntegrationDb(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    dbReady = false;
    return false;
  }
  try {
    await testPrisma.$connect();
    dbReady = true;
    return true;
  } catch {
    dbReady = false;
    return false;
  }
}

/** Usar al inicio de cada test: `skipIfNoDb(ctx)`. */
export function skipIfNoDb(ctx: { skip: (condition?: boolean) => void }) {
  if (!dbReady) ctx.skip(true);
}
