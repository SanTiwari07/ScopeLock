import { expect, test } from "@playwright/test";

// Happy path across the multi-page app. Runs against the PayPal simulator when no sandbox keys
// are set; with real keys, the pay step needs a sandbox buyer and is covered by the manual run.
test("landing → change request → invoice → decline → pay → payout", async ({ page, request }) => {
  await request.post("/api/demo/reset");

  // Landing page explains the product and links into the demo.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("can you also add");
  await page.getByRole("link", { name: "Try the live demo" }).click();

  // Overview: next step points at pricing the request; the locked phase is visible.
  await expect(page.getByText("Acme Bakery asked for extra work")).toBeVisible();
  await expect(page.locator(".bar-fill.is-locked", { hasText: "Go-live" })).toBeVisible();
  await page.getByRole("link", { name: "Price the request" }).first().click();

  // Wizard step 1 → 2.
  await expect(page).toHaveURL(/\/projects\/demo\/requests$/);
  await page.getByRole("button", { name: "New features + deadline" }).click();
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByText('"add a gift-card page"')).toBeVisible();
  await expect(page.getByText("$1,700.00").first()).toBeVisible();

  // Step 3: invoice sent, with a hand-off to the client view.
  await page.getByRole("button", { name: "Create invoice & send" }).click();
  await expect(page.getByRole("heading", { name: /Invoice #.* sent/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open client pay page/ })).toBeVisible();

  const state = await (await request.get("/api/project/demo")).json();
  const invoice = state.invoices.find((i: { kind: string }) => i.kind === "change_order");

  await page.goto("/projects/demo");
  await expect(page.locator(".bar-fill.is-locked", { hasText: "Gift-card page" })).toBeVisible();
  test.skip(state.config.paypalMode !== "simulated", "Real sandbox checkout needs a buyer login");

  // Client view: decline, recover, pay.
  await page.goto("/projects/demo/invoices");
  await page.getByRole("link", { name: /Pay as the client/ }).first().click();
  await expect(page.getByText("Client view", { exact: true })).toBeVisible();
  await page.getByRole("switch").check({ force: true });
  await page.getByRole("button", { name: "Pay with PayPal (simulated)" }).click();
  await expect(page.getByText("Your card was declined")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("button", { name: "Pay with PayPal (simulated)" }).click();
  await expect(page.getByText("Payment received")).toBeVisible();

  // Paying again is blocked.
  const dup = await request.post("/api/orders", { data: { invoiceId: invoice.id } });
  expect(dup.status()).toBe(409);

  // Back as the agency: work unlocked, next step is paying the team.
  await page.getByRole("link", { name: "Back to agency view" }).last().click();
  await expect(page.getByText(/Paid! \d+ tasks? unlocked/)).toBeVisible();
  await expect(page.getByText("Gift-card page", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".bar-fill.is-locked", { hasText: "Gift-card page" })).toHaveCount(0);

  await page.getByRole("main").getByRole("link", { name: "Pay the team" }).first().click();
  await expect(page).toHaveURL(/\/projects\/demo\/team$/);
  await expect(page.getByText("Adds up to the cent", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Pay contractors/ }).click();
  await expect(page.getByText("Payout batch SUCCESS")).toBeVisible({ timeout: 30_000 });

  await page.goto("/projects/demo");
  await expect(page.getByText("Done: priced, paid and paid out")).toBeVisible({ timeout: 15_000 });

  const again = await request.post("/api/payouts", { data: { invoiceId: invoice.id } });
  expect(again.status()).toBe(409);
});
