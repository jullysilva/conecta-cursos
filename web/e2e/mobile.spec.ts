import { expect, expectAccessible, login, STUDENT, test } from './fixtures';

/** Student journeys that only exist on narrow screens: the header menu and the course drawer. */
test.describe('Aluno no celular @mobile-only', () => {
  test.beforeEach(async ({ page }) => login(page, STUDENT));

  test('header menu opens the categories and closes after navigating', async ({ page }) => {
    const menu = page.getByRole('button', { name: 'Abrir menu' });
    await expect(page.getByRole('link', { name: 'Atendimento' })).toBeHidden();
    await menu.click();
    await expect(page.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    await expectAccessible(page);

    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Trilhas' }).click();
    await expect(page).toHaveURL(/\/trilhas$/);
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('course outline opens as a drawer and closes when a lesson is chosen', async ({ page }) => {
    await page.goto('/trilhas');
    await page.getByRole('link', { name: /Trilha do Novo Líder/ }).click();
    await page.getByRole('link', { name: /Fundamentos da Liderança/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Fundamentos da Liderança' })).toBeVisible();
    const outline = page.getByRole('navigation', { name: 'Módulos e aulas' });
    await expect(outline).toBeHidden();

    await page.getByRole('button', { name: /Conteúdo do curso/ }).click();
    await expect(outline).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fechar conteúdo do curso' })).toBeFocused();
    await expectAccessible(page);

    await page.keyboard.press('Escape');
    await expect(outline).toBeHidden();
    await expect(page.getByRole('button', { name: /Conteúdo do curso/ })).toBeFocused();

    await page.getByRole('button', { name: /Conteúdo do curso/ }).click();
    await outline.getByRole('link', { name: /Papel do líder — Aula 2/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Papel do líder — Aula 2' })).toBeVisible();
    await expect(outline).toBeHidden();
    await expectAccessible(page);
  });

  test('student pages fit the screen without sideways scrolling', async ({ page }) => {
    for (const path of ['/home', '/trilhas', '/perfil']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await expectAccessible(page);
  });
});
