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

test('settings api-keys: create flow shows new masked key', async ({ page }) => {
  const name = `e2e-key-${Date.now()}`;
  await page.goto('/settings/api-keys');
  await expect(page.getByRole('heading', { name: /API Keys/i })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('input#userId')).toHaveCount(0);
  await page.getByLabel(/Nome/i).fill(name);
  await page.getByRole('button', { name: /Gerar chave/i }).click();
  await expect(page.getByText(/Chave criada/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/logi_.+…/)).toBeVisible();
});
