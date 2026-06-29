import { test, expect } from "@playwright/test";
import { loginVendedor, loginComprador } from "./helpers/auth";

test.describe("guards de rol", () => {
  test("vendedor no accede al panel comprador", async ({ page }) => {
    await loginVendedor(page);
    await page.goto("/comprador");
    await expect(page).not.toHaveURL(/\/comprador$/);
  });

  test("comprador no accede al panel vendedor", async ({ page }) => {
    await loginComprador(page);
    await page.goto("/vendedor");
    await expect(page).not.toHaveURL(/\/vendedor$/);
  });

  test("rutas protegidas redirigen a login sin sesión", async ({ page }) => {
    await page.goto("/comprador");
    await expect(page).toHaveURL(/\/login/);
  });
});
