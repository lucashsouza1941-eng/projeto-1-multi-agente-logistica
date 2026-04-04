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

test('/triage redirects to email triage', async ({ page }) => {
  await page.goto('/triage');
  await expect(page).toHaveURL(/email-triage/);
});

test('/triage mostra lista de e-mails (tabela ou estado vazio)', async ({ page }) => {
  await page.goto('/triage');
  await expect(page).toHaveURL(/email-triage/);
  await expect(page.getByRole('heading', { name: /triagem de e-mails/i })).toBeVisible({
    timeout: 20_000,
  });
  const hasEmpty = page.getByText(/nenhum e-mail por aqui/i);
  const hasTable = page.locator('table');
  await expect(hasEmpty.or(hasTable)).toBeVisible({ timeout: 20_000 });
});
