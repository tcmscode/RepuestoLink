import { test, expect } from "@playwright/test";
import {
  loginComprador,
  loginVendedor2,
  searchRepuesto,
} from "./helpers/auth";
import { BUYER_NAME, SELLER_NAMES } from "../tests/helpers/constants";

test.describe("anonimato bilateral", () => {
  test("catálogo oculta vendedor; vendedor ve comprador solo tras aceptar", async ({
    browser,
  }) => {
    const compradorCtx = await browser.newContext();
    const vendedorCtx = await browser.newContext();
    const comprador = await compradorCtx.newPage();
    const vendedor = await vendedorCtx.newPage();

    await loginComprador(comprador);
    await searchRepuesto(comprador, "Scania");

    const bodyText = await comprador.locator("body").innerText();
    expect(bodyText).not.toContain(SELLER_NAMES.repuestosDelSur);
    expect(bodyText).not.toContain(SELLER_NAMES.busParts);

    await comprador.getByTestId("add-to-cart").first().click();
    await comprador.getByTestId("nav-cart").click();
    await comprador.getByTestId("checkout-create-order").click();
    await comprador.waitForURL(/\/comprador\/pedidos\//);
    await comprador.getByTestId("confirm-order-intent").click();
    await expect(
      comprador.getByText(/esperando|evaluando|pendiente/i).first()
    ).toBeVisible({ timeout: 10000 });

    await loginVendedor2(vendedor);
    await vendedor.goto("/vendedor/pedidos");
    await expect(vendedor.getByText(/anónimo|anónima/i).first()).toBeVisible();
    expect(await vendedor.locator("body").innerText()).not.toContain(BUYER_NAME);

    await vendedor.getByTestId("seller-accept-order").first().click();
    await expect(vendedor.getByText(BUYER_NAME)).toBeVisible({ timeout: 10000 });

    await compradorCtx.close();
    await vendedorCtx.close();
  });
});
