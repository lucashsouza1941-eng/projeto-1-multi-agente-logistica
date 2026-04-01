import { request } from '@playwright/test';

const apiBase =
  process.env.PLAYWRIGHT_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
const email = process.env.E2E_EMAIL ?? 'e2e@logiagent.local';
const password = process.env.E2E_PASSWORD ?? 'E2E_test_password_8';
const name = process.env.E2E_NAME ?? 'E2E User';

export default async function globalSetup() {
  const ctx = await request.newContext();
  const res = await ctx.post(`${apiBase}/auth/register`, {
    data: { email, password, name },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok() && res.status() !== 409) {
    const body = await res.text();
    console.warn(`Register setup returned ${res.status()}: ${body}`);
  }
  await ctx.dispose();
}
