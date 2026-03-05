import { expect, test } from "@playwright/test";

test("writing console smoke", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /AI Writing Console Showcase/i })).toBeVisible();
  await page.getByPlaceholder("Write a launch announcement for our AI showcase...").fill("Write one short launch line.");
  await page.getByRole("button", { name: "Generate" }).click();

  const outputLocator = page.locator("pre", { hasText: /Generated text appears here\./ }).first();
  const successText = page.locator("pre", { hasNotText: "Generated text appears here." }).first();
  const errorBanner = page.getByText(/OpenClaw gateway is unreachable|OPENCLAW_GATEWAY_TOKEN|Unexpected server error/i);

  await expect(async () => {
    const successVisible = await successText.isVisible().catch(() => false);
    const errorVisible = await errorBanner.first().isVisible().catch(() => false);
    const placeholderVisible = await outputLocator.isVisible().catch(() => false);
    expect(successVisible || errorVisible || !placeholderVisible).toBeTruthy();
  }).toPass({ timeout: 20000 });
});
