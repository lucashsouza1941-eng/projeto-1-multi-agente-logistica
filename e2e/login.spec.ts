import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_EMAIL ?? 'e2e@logiagent.local';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'E2E_test_password_8';

test('login flow: submit credentials and land on app home', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
  await page.getByLabel('E-mail').fill(E2E_EMAIL);
  await page.getByLabel('Senha').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/($|\?.*)/, { timeout: 20_000 });
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /métricas/i }).first()).toBeVisible({
    timeout: 20_000,
  });
});
