import { expect, test } from "@playwright/test";
import { mockScenarios, mockStrategies } from "../src/api/mockStrategies";

test("planning, results, and dashboard fit a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.route("**/api/v1/scenarios", route => route.fulfill({ json: mockScenarios }));
  await page.route("**/api/v1/strategies/generate", route => route.fulfill({ json: mockStrategies }));
  await page.route("**/api/v1/simulations", route => route.fulfill({ json: mockStrategies[0].normal_simulation }));
  await page.goto("http://localhost:5173");

  const fitsViewport = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(await fitsViewport()).toBe(true);

  await page.getByRole("button", { name: "Continue to goal" }).click();
  expect(await fitsViewport()).toBe(true);
  await page.getByRole("button", { name: "Generate strategies" }).click();
  await expect(page.getByRole("heading", { name: "Plans for Buy a car" })).toBeVisible();
  expect(await fitsViewport()).toBe(true);

  await page.getByRole("button", { name: "Open detailed analysis" }).click();
  await expect(page.getByRole("heading", { name: "Hybrid reserve-first plan" })).toBeVisible();
  expect(await fitsViewport()).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await fitsViewport()).toBe(true);
});

test("live UI generates strategies and runs a selected backend scenario", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "Continue to goal" }).click();
  await page.getByRole("button", { name: "Generate strategies" }).click();

  await expect(page.getByText("Live API results")).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Plans for Buy a car" })).toBeVisible();
  const firstStrategyName = await page.locator(".strategy-card h3").first().textContent();
  expect(firstStrategyName).toBeTruthy();
  await page.getByRole("button", { name: "Open detailed analysis" }).click();
  await expect(page.getByRole("heading", { name: firstStrategyName! })).toBeVisible();

  const simulationResponse = page.waitForResponse(response => response.url().endsWith("/api/v1/simulations") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Market crash" }).click();
  const response = await simulationResponse;
  expect(response.status()).toBe(200);
  expect((await response.json()).scenario_id).toBe("market_crash");
  await expect(page.getByText("Investment value", { exact: true })).toBeVisible();
});
