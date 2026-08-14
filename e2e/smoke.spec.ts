import { expect, test } from "@playwright/test";

function pathIs(path: string) {
  return (url: URL) => url.pathname.replace(/\/$/, "") === path;
}

test.describe("Ember Maths12 smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Ember Maths12", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /log in/i }).first()).toBeVisible();
  });

  test("student can log in with demo credentials", async ({ page }) => {
    await page.goto("/login/student");
    await page.getByLabel(/^email$/i).fill("student@ember12.za");
    await page.getByLabel(/^password$/i).fill("ember12");
    await page.getByRole("button", { name: /^log in$/i }).click();

    await expect(page).toHaveURL(pathIs("/student"), { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Welcome,/i })).toBeVisible();
  });

  test("unauthenticated /student redirects to login", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/\/login\/student/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /student log in/i })).toBeVisible();
  });

  test("admin can log in with demo credentials", async ({ page }) => {
    await page.goto("/login/admin");
    await page.getByLabel(/^email$/i).fill("admin@ember12.za");
    await page.getByLabel(/^password$/i).fill("ember12");
    await page.getByRole("button", { name: /^log in$/i }).click();

    await expect(page).toHaveURL(pathIs("/admin"), { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Admin dashboard/i })).toBeVisible();
  });
});
