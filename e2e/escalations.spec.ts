import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL ?? 'e2e@logiagent.local';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'E2E_test_password_8';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(E2E_EMAIL);
  await page.getByLabel('Senha').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
});

test('escalations: page loads', async ({ page }) => {
  await page.goto('/escalations');
  await expect(page.getByText('Escalonamentos').first()).toBeVisible({
    timeout: 20_000,
  });
});

test('escalations (tickets): seeded list shows ticket cards', async ({ page }) => {
  await page.goto('/escalations');
  await expect(page.getByText(/^Escalonamento:/).first()).toBeVisible({
    timeout: 25_000,
  });
});
