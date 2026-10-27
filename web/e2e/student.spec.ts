import { expect, expectAccessible, login, STUDENT, test } from './fixtures';

test.describe('Jornada do aluno', () => {
  test.beforeEach(async ({ page }) => login(page, STUDENT));

  test('home lists categories and is accessible @tablet', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Liderança', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fundamentos da Liderança' }).first()).toBeVisible();
    await expectAccessible(page);
  });

  test('header anchors scroll to a category and cards reveal details', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Atendimento' }).click();
    await expect(page).toHaveURL(/#atendimento$/);
    const section = page.locator('#atendimento');
    await expect(section).toBeInViewport();
    await section.getByRole('button', { name: 'Vendas Consultivas' }).click();
    await expect(section.getByRole('button', { name: 'Vendas Consultivas' })).toHaveAttribute('aria-expanded', 'true');
    await expect(section.getByText('Aprenda na prática os conceitos essenciais de vendas consultivas.')).toBeVisible();
    await expectAccessible(page);
  });

  test('profile menu leads to my progress', async ({ page }) => {
    await page.getByRole('button', { name: 'Menu do usuário' }).click();
    await page.getByRole('menuitem', { name: 'Meu perfil' }).click();
    await expect(page.getByRole('heading', { name: 'Histórico de cursos' })).toBeVisible();
  });

  test('opens a course, completes a lesson and sees progress', async ({ page }) => {
    const card = page.locator('#atendimento').getByRole('button', { name: 'Vendas Consultivas' });
    await card.click();
    await page.locator(`#${await card.getAttribute('aria-controls')}`).getByRole('link', { name: /Iniciar|Continuar/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Vendas Consultivas' })).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('link', { name: 'Descoberta — Aula 1' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Descoberta — Aula 1' })).toBeVisible();

    const toggle = page.getByRole('button', { name: /Marcar como concluída|Concluída/ });
    if ((await toggle.getAttribute('aria-pressed')) === 'true') await toggle.click();
    await page.getByRole('button', { name: 'Marcar como concluída' }).click();
    await expect(page.getByRole('button', { name: 'Concluída' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Aula concluída.' })).toBeVisible();

    await page.getByRole('link', { name: 'Próximo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Descoberta — Aula 2' })).toBeVisible();

    await page.getByRole('button', { name: 'Menu do usuário' }).click();
    await page.getByRole('menuitem', { name: 'Meu perfil' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Vendas Consultivas' })).toBeVisible();
  });

  test('learning paths list and detail', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Trilhas' }).click();
    await page.getByRole('link', { name: /Trilha do Novo Líder/ }).click();
    await expect(page.getByRole('progressbar', { name: 'Progresso na trilha' })).toBeVisible();
    await expectAccessible(page);
  });

  test('course page expands modules and the sidebar collapses', async ({ page }) => {
    await page.goto('/trilhas');
    await page.getByRole('link', { name: /Trilha do Novo Líder/ }).click();
    await page.getByRole('link', { name: /Fundamentos da Liderança/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Fundamentos da Liderança' })).toBeVisible();
    await page.getByRole('button', { name: /Comunicação/ }).filter({ has: page.locator('.module-overlay') }).click();
    await expect(page.getByRole('region', { name: 'Aulas do módulo' }).getByRole('link')).toHaveCount(3);
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Recolher menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Módulos e aulas' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Expandir menu' }).click();
  });

  test('lesson page is accessible @tablet', async ({ page }) => {
    await page.goto('/trilhas');
    await page.getByRole('link', { name: /Trilha do Novo Líder/ }).click();
    await page.getByRole('link', { name: /Fundamentos da Liderança/ }).click();
    await page.locator('.action-cta').click();
    await expect(page.getByRole('navigation', { name: 'Navegação entre aulas' })).toBeVisible();
    await expectAccessible(page);
  });

  test('profile is accessible', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page.getByRole('heading', { name: 'Histórico de cursos' })).toBeVisible();
    await expectAccessible(page);
  });

  test('unknown pages show a helpful message', async ({ page }) => {
    await page.goto('/nao-existe');
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  });
});
