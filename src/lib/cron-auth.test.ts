import { afterEach, describe, expect, it } from "vitest";
import { verifyCronSecret } from "./cron-auth";

describe("verifyCronSecret", () => {
  const original = process.env.CRON_SECRET;

  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  it("rechaza sin CRON_SECRET configurado", () => {
    delete process.env.CRON_SECRET;
    const req = new Request("http://localhost/api/cron/check-invoices");
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("acepta Bearer token correcto", () => {
    process.env.CRON_SECRET = "test-secret";
    const req = new Request("http://localhost/api/cron/check-invoices", {
      headers: { authorization: "Bearer test-secret" },
    });
    expect(verifyCronSecret(req)).toBe(true);
  });

  it("rechaza token incorrecto", () => {
    process.env.CRON_SECRET = "test-secret";
    const req = new Request("http://localhost/api/cron/check-invoices", {
      headers: { authorization: "Bearer wrong" },
    });
    expect(verifyCronSecret(req)).toBe(false);
  });
});
