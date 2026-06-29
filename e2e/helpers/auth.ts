import { Page, expect } from "@playwright/test";
import { DEMO_PASSWORD, DEMO_USERS } from "../helpers/constants";

export async function loginAs(
  page: Page,
  email: string,
  expectedPath: RegExp | string
) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(DEMO_PASSWORD);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(typeof expectedPath === "string" ? expectedPath : expectedPath, {
    timeout: 15000,
  });
}

export async function loginComprador(page: Page) {
  await loginAs(page, DEMO_USERS.comprador, /\/comprador/);
}

export async function loginVendedor(page: Page) {
  await loginAs(page, DEMO_USERS.vendedor1, /\/vendedor/);
}

export async function loginVendedor2(page: Page) {
  await loginAs(page, DEMO_USERS.vendedor2, /\/vendedor/);
}

export async function loginAdmin(page: Page) {
  await loginAs(page, DEMO_USERS.admin, /\/admin/);
}

export async function searchRepuesto(page: Page, term: string) {
  await page.getByTestId("search-input").fill(term);
  await page.getByTestId("search-submit").click();
  await page.waitForURL(new RegExp(`q=${encodeURIComponent(term)}`));
}

export { expect };
