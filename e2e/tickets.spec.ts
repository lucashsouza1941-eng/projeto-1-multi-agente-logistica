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

test('/tickets redireciona para escalations e permite criar ticket', async ({
  page,
}) => {
  await page.goto('/tickets');
  await expect(page).toHaveURL(/\/escalations/);

  const unique = `E2E ticket ${Date.now()}`;
  await page.getByLabel('Assunto').fill(unique);
  await page.getByLabel('Descrição').fill('Descrição criada pelo teste E2E.');
  await page.getByRole('button', { name: /^Criar ticket$/i }).click();

  await expect(page.getByText(unique, { exact: true })).toBeVisible({
    timeout: 20_000,
  });
});
