import { ADMIN, expect, expectAccessible, login, STUDENT, test } from './fixtures';

test.describe('Autenticação', () => {
  test('login page is accessible and validates input', async ({ page }) => {
    await page.goto('/login');
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
  });

  test('wrong password shows an error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(STUDENT.email);
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toContainText('Credenciais inválidas');
  });

  test('protected pages redirect to login and back after signing in', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/);
    await page.getByLabel('E-mail').fill(STUDENT.email);
    await page.getByLabel('Senha', { exact: true }).fill(STUDENT.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/perfil$/);
  });

  test('session survives a reload and ends on logout', async ({ page }) => {
    await login(page, STUDENT);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Continue assistindo' }).or(page.getByRole('heading', { name: 'Recomendados para você' }))).toBeVisible();
    await page.getByRole('button', { name: 'Menu do usuário' }).click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('students cannot open the admin area', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto('/adm');
    await expect(page).toHaveURL(/\/home$/);
  });

  test('admins land on the admin dashboard', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/adm$/);
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  });

  test('forgot password always confirms without revealing accounts', async ({ page }) => {
    await page.goto('/recuperar-senha');
    await page.getByLabel('E-mail').fill('ninguem@exemplo.com');
    await page.getByRole('button', { name: 'Enviar link' }).click();
    await expect(page.getByRole('status')).toContainText('Se houver uma conta');
  });
});
