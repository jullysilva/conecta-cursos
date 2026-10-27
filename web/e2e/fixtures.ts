import { expect, Page, test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const ADMIN = { email: 'admin@cursos.local', password: 'Admin@123' };
export const STUDENT = { email: 'aluno@cursos.local', password: 'Aluno@123' };

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Fails on serious/critical WCAG A/AA violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;

export const test = base;
export { expect };
