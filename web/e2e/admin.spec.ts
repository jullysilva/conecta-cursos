import { ADMIN, expect, expectAccessible, login, STUDENT, test, unique } from './fixtures';

test.describe('Administração', () => {
  test('creates a course with content, publishes it and a student can watch it', async ({ page, browser }) => {
    const title = unique('Curso E2E');
    await login(page, ADMIN);
    await page.getByRole('navigation', { name: 'Administração' }).getByRole('link', { name: 'Cursos' }).click();
    await expectAccessible(page);
    await page.getByRole('link', { name: 'Novo curso' }).click();

    await page.getByLabel('Título').fill(title);
    await page.getByLabel('Categoria').selectOption({ label: 'Tecnologia' });
    await page.getByRole('button', { name: 'Criar curso' }).click();
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

    await page.getByLabel('Nome do novo módulo').fill('Primeiros passos');
    await page.getByRole('button', { name: 'Adicionar módulo' }).click();
    await page.getByRole('button', { name: 'Adicionar aula' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Título').fill('Boas-vindas');
    await dialog.getByLabel('Origem do vídeo').selectOption('YOUTUBE');
    await dialog.getByLabel('Vídeo', { exact: true }).fill('https://youtu.be/aqz-KE-bpKQ');
    await dialog.getByRole('button', { name: 'Adicionar aula' }).click();
    await expect(page.getByRole('button', { name: /^Boas-vindas/ })).toBeVisible();
    await expectAccessible(page);

    await page.getByLabel('Publicado').check();
    await page.getByRole('button', { name: 'Salvar curso' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Curso salvo.' })).toBeVisible();

    const studentContext = await browser.newContext();
    const student = await studentContext.newPage();
    await login(student, STUDENT);
    const card = student.getByRole('button', { name: title }).first();
    await card.click();
    await student.locator(`#${await card.getAttribute('aria-controls')}`).getByRole('link', { name: 'Iniciar' }).click();
    await student.getByRole('link', { name: 'Começar curso' }).click();
    await expect(student.getByRole('heading', { level: 1, name: 'Boas-vindas' })).toBeVisible();
    await expect(student.locator('iframe[src*="youtube-nocookie.com/embed/aqz-KE-bpKQ"]')).toBeAttached();
    await studentContext.close();

    await page.getByRole('link', { name: 'Cursos', exact: true }).first().click();
    await page.getByRole('button', { name: `Excluir ${title}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir curso' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Curso excluído.' })).toBeVisible();
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
  });

  test('manages users: create, deactivate blocks login, delete', async ({ page, browser }) => {
    const email = `e2e-${Date.now()}@cursos.local`;
    await login(page, ADMIN);
    await page.goto('/adm/usuarios');
    await expectAccessible(page);
    await page.getByRole('link', { name: 'Novo usuário' }).click();
    await page.getByLabel('Nome').fill('Pessoa E2E');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha inicial').fill('Senha@1234');
    await page.getByRole('button', { name: 'Criar usuário' }).click();
    await expect(page).toHaveURL(/\/adm\/usuarios$/);

    await page.getByLabel('Buscar usuário').fill(email);
    await page.getByRole('link', { name: 'Pessoa E2E' }).click();
    await page.getByLabel(/Ativo/).uncheck();
    await page.getByRole('button', { name: 'Salvar usuário' }).click();

    const other = await browser.newContext();
    const blocked = await other.newPage();
    await blocked.goto('/login');
    await blocked.getByLabel('E-mail').fill(email);
    await blocked.getByLabel('Senha', { exact: true }).fill('Senha@1234');
    await blocked.getByRole('button', { name: 'Entrar' }).click();
    await expect(blocked.getByRole('alert')).toBeVisible();
    await other.close();

    await page.getByLabel('Buscar usuário').fill(email);
    await page.getByRole('link', { name: 'Pessoa E2E' }).click();
    await page.getByRole('button', { name: 'Excluir usuário' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir usuário' }).click();
    await expect(page).toHaveURL(/\/adm\/usuarios$/);
  });

  test('manages categories, learning paths and banners', async ({ page }) => {
    await login(page, ADMIN);

    const category = unique('Categoria');
    await page.goto('/adm/categorias');
    await page.getByLabel('Nome da nova categoria').fill(category);
    await page.getByRole('button', { name: 'Adicionar categoria' }).click();
    await expect(page.getByRole('button', { name: `Excluir ${category}` })).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('button', { name: `Excluir ${category}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir categoria' }).click();
    await expect(page.getByRole('button', { name: `Excluir ${category}` })).toHaveCount(0);

    const path = unique('Trilha');
    await page.goto('/adm/trilhas');
    await page.getByRole('button', { name: 'Nova trilha' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Título').fill(path);
    await dialog.getByLabel('Adicionar curso').selectOption({ label: 'Vendas Consultivas' });
    await dialog.getByLabel('Adicionar curso').selectOption({ label: 'Fundamentos da Liderança' });
    await dialog.getByRole('button', { name: 'Mover Fundamentos da Liderança para cima' }).click();
    await dialog.getByRole('button', { name: 'Criar trilha' }).click();
    await expect(page.getByRole('row', { name: new RegExp(`${path}.*Fundamentos da Liderança, Vendas Consultivas`) })).toBeVisible();
    await page.getByRole('button', { name: `Excluir ${path}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir trilha' }).click();
    await expect(page.getByText(path)).toHaveCount(0);

    const banner = unique('Banner');
    await page.goto('/adm/banners');
    await page.getByRole('link', { name: 'Novo banner' }).click();
    await page.getByLabel('Título', { exact: true }).fill(banner);
    await page.getByLabel('Imagem (URL)').fill('https://picsum.photos/seed/e2e/1600/500');
    await page.getByRole('button', { name: 'Criar banner' }).click();
    await expect(page.getByRole('link', { name: banner })).toBeVisible();
    await page.getByRole('button', { name: `Excluir banner ${banner}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir banner' }).click();
    await expect(page.getByRole('link', { name: banner })).toHaveCount(0);
  });

  test('dashboard is accessible @tablet', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByText('Aulas concluídas em 30 dias')).toBeVisible();
    await expectAccessible(page);
  });
});
