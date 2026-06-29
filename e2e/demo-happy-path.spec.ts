import { test, expect } from "@playwright/test";
import {
  loginAdmin,
  loginComprador,
  loginVendedor,
  searchRepuesto,
} from "./helpers/auth";

/**
 * Flujo completo alineado a CHECKLIST-EQUIPO.md (demo proveedores).
 * Usa listing Scania + vendedor1 (Repuestos del Sur).
 */
test.describe("demo happy path", () => {
  test("comprador → vendedor → admin → calificaciones", async ({ browser }) => {
    const compradorCtx = await browser.newContext();
    const vendedorCtx = await browser.newContext();
    const adminCtx = await browser.newContext();

    const comprador = await compradorCtx.newPage();
    const vendedor = await vendedorCtx.newPage();
    const admin = await adminCtx.newPage();

    // —— Comprador ——
    await loginComprador(comprador);
    await searchRepuesto(comprador, "Iveco");
    await expect(comprador.getByText(/Iveco/i).first()).toBeVisible();

    await comprador.getByTestId("add-to-cart").first().click();
    await comprador.getByTestId("nav-cart").click();
    await comprador.getByTestId("checkout-create-order").click();
    await comprador.waitForURL(/\/comprador\/pedidos\//);

    const orderUrl = comprador.url();
    await comprador.getByTestId("confirm-order-intent").click();
    await expect(
      comprador.getByText(/esperando|evaluando|pendiente/i)
    ).toBeVisible({ timeout: 15000 });

    // —— Vendedor ——
    await loginVendedor(vendedor);
    await vendedor.goto("/vendedor/pedidos");
    await vendedor.getByTestId("seller-accept-order").first().click();
    await expect(vendedor.getByText(/Transporte Línea 42|Línea 42/i)).toBeVisible({
      timeout: 15000,
    });

    await vendedor.getByTestId("seller-mark-delivered").first().click();
    await expect(vendedor.getByTestId("seller-upload-invoice").first()).toBeVisible({
      timeout: 15000,
    });

    await vendedor.getByTestId("seller-upload-invoice").first().click();
    await vendedor.getByTestId("invoice-number").fill(`E2E-${Date.now()}`);
    await vendedor.getByTestId("invoice-cae").fill("12345678901234");
    await vendedor.getByTestId("invoice-amount").fill("12500");
    await vendedor.getByTestId("invoice-submit").click();
    await expect(vendedor.getByText(/revisión/i).first()).toBeVisible({
      timeout: 15000,
    });

    // —— Admin ——
    await loginAdmin(admin);
    await admin.goto("/admin/facturas");
    await admin.getByTestId("admin-approve-invoice").first().click();
    await expect(admin.getByText(/no hay facturas pendientes/i)).toBeVisible({
      timeout: 15000,
    });

    await admin.goto("/admin/comisiones");
    await expect(admin.getByText(/pendiente/i).first()).toBeVisible();

    // —— Calificaciones ——
    await comprador.goto(orderUrl);
    await expect(comprador.getByTestId("rating-form")).toBeVisible({
      timeout: 15000,
    });
    await comprador.getByTestId("rating-submit").click();

    await vendedor.goto("/vendedor/pedidos");
    await expect(vendedor.getByTestId("rating-form").first()).toBeVisible({
      timeout: 15000,
    });
    await vendedor.getByTestId("rating-submit").first().click();

    await compradorCtx.close();
    await vendedorCtx.close();
    await adminCtx.close();
  });
});
