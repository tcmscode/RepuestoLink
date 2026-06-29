import { afterAll, beforeAll, expect, it } from "vitest";
import { describeIntegration } from "../helpers/skip-if-no-db";
import { initIntegrationDb, skipIfNoDb } from "../helpers/setup-suite";
import { disconnectTestDb, loadDemoContext, testPrisma } from "../helpers/db";
import { DEMO_USERS } from "../helpers/constants";

describeIntegration("seed demo", () => {
  beforeAll(async () => {
    await initIntegrationDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("tiene usuarios demo con KYC aprobado", (ctx) => {
    skipIfNoDb(ctx);
    return testPrisma.user
      .findMany({
        where: { email: { in: Object.values(DEMO_USERS) } },
        include: { company: true },
      })
      .then((users) => {
        expect(users.length).toBe(4);
        for (const u of users) {
          expect(u.company.kycStatus).toBe("aprobado");
        }
      });
  });

  it("tiene catálogo activo para comprador cat. B", async (ctx) => {
    skipIfNoDb(ctx);
    const demoCtx = await loadDemoContext();
    const count = await testPrisma.listing.count({
      where: {
        isActive: true,
        stock: { gt: 0 },
        company: {
          kycStatus: "aprobado",
          role: "vendedor",
          tradeCategory: "B",
        },
      },
    });
    expect(count).toBeGreaterThanOrEqual(3);
    expect(demoCtx.listingScaniaId).toBeTruthy();
  });
});
