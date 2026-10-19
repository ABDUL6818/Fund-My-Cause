import { test, expect, type Page } from "./fixtures/wallet";
import AxeBuilder from "@axe-core/playwright";
import { activeCampaign } from "../fixtures/campaign";

/**
 * End-to-end smoke test for the create-campaign wizard (issue #1476).
 *
 * Walks every wizard step with fixture data and runs an axe scan on each
 * step, failing only on critical violations.
 */

const MOCK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function expectNoCriticalA11yViolations(page: Page, step: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(
    critical.map((v) => `${v.id}: ${v.help}`),
    `critical axe violations on step "${step}"`,
  ).toEqual([]);
}

test.describe("Create campaign wizard smoke test", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ IpfsHash: "QmMockImageHash" }),
        }),
    );
  });

  test("completes every step and reaches the review screen", async ({
    page,
  }) => {
    await page.goto("/create");

    // 1. Basic Info
    await expect(
      page.getByRole("heading", { name: "Basic Info" }),
    ).toBeVisible();
    await page.getByLabel("Contract ID").fill(activeCampaign.contractId);
    await page.getByLabel("Token Address").fill(activeCampaign.contractId);
    await page.getByLabel("Title").fill(activeCampaign.title);
    await page.getByLabel("Description").fill(activeCampaign.description);
    await page.getByLabel("Goal (XLM)").fill("1000");
    await page.getByLabel("Min Contribution (XLM)").fill("10");
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 1);
    await page
      .getByLabel("Deadline")
      .fill(deadline.toISOString().split("T")[0]);
    await expectNoCriticalA11yViolations(page, "Basic Info");
    await page.getByRole("button", { name: "Next" }).click();

    // 2. Media
    await expect(page.getByRole("heading", { name: "Media" })).toBeVisible();
    await page.locator("input[type='file']").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(MOCK_PNG_BASE64, "base64"),
    });
    await page.getByRole("button", { name: "Confirm Crop" }).click();
    await page
      .getByLabel("Campaign video URL")
      .fill("https://youtube.com/watch?v=abcdef");
    await expectNoCriticalA11yViolations(page, "Media");
    await page.getByRole("button", { name: "Next" }).click();

    // 3. FAQ & Team
    await expect(
      page.getByRole("heading", { name: "FAQ & Team" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add FAQ" }).click();
    await page.getByLabel("FAQ question").fill("Is this audit complete?");
    await page
      .getByLabel("FAQ answer")
      .fill("Yes, an independent audit was completed.");
    await expectNoCriticalA11yViolations(page, "FAQ & Team");
    await page.getByRole("button", { name: "Next" }).click();

    // 4. Platform Config
    await expect(
      page.getByRole("heading", { name: "Platform Config" }),
    ).toBeVisible();
    await page.getByLabel("Platform Fee Address").fill(activeCampaign.creator);
    await page.getByLabel("Fee (basis points, e.g. 250 = 2.5%)").fill("250");
    await expectNoCriticalA11yViolations(page, "Platform Config");
    await page.getByRole("button", { name: "Review & Deploy" }).click();

    // 5. Review & Deploy
    await expect(
      page.getByRole("heading", { name: "Review & Deploy" }),
    ).toBeVisible();
    await expect(page.getByText(activeCampaign.title)).toBeVisible();
    await expectNoCriticalA11yViolations(page, "Review & Deploy");
  });
});
