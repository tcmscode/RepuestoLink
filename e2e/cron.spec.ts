import { test, expect } from "@playwright/test";

test.describe("cron endpoints", () => {
  test("rechaza sin CRON_SECRET", async ({ request }) => {
    const res = await request.get("/api/cron/check-invoices");
    expect(res.status()).toBe(401);
  });

  test("acepta con Bearer CRON_SECRET", async ({ request }) => {
    const secret = process.env.CRON_SECRET;
    test.skip(!secret, "CRON_SECRET no configurado");

    const res = await request.get("/api/cron/check-invoices", {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("processed");
  });
});
