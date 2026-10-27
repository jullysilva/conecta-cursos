import { expect, expectAccessible, login, STUDENT, test } from './fixtures';

test.describe('Jornada do aluno', () => {
  test.beforeEach(async ({ page }) => login(page, STUDENT));

  test('home lists categories and is accessible @tablet', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Liderança', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Fundamentos da Liderança/ }).first()).toBeVisible();
    await expectAccessible(page);
  });

  test('opens a course, completes a lesson and sees progress', async ({ page }) => {
    await page.getByRole('link', { name: /Vendas Consultivas/ }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Vendas Consultivas' })).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('link', { name: 'Descoberta — Aula 1' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Descoberta — Aula 1' })).toBeVisible();

    const toggle = page.getByRole('button', { name: /Marcar como concluída|Concluída/ });
    if ((await toggle.getAttribute('aria-pressed')) === 'true') await toggle.click();
    await page.getByRole('button', { name: 'Marcar como concluída' }).click();
    await expect(page.getByRole('button', { name: 'Concluída' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Aula concluída.' })).toBeVisible();

    await page.getByRole('link', { name: 'Próxima aula' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Descoberta — Aula 2' })).toBeVisible();

    await page.getByRole('link', { name: 'Meu progresso' }).click();
    await expect(page.getByRole('row', { name: /Vendas Consultivas/ })).toBeVisible();
  });

  test('learning paths list and detail', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Trilhas' }).click();
    await page.getByRole('link', { name: /Trilha do Novo Líder/ }).click();
    await expect(page.getByRole('progressbar', { name: 'Progresso na trilha' })).toBeVisible();
    await expectAccessible(page);
  });

  test('unknown pages show a helpful message', async ({ page }) => {
    await page.goto('/nao-existe');
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  });
});
