const { test, expect } = require('./apoio');
const { CLIENTE } = require('./ambiente');

test('01 · login com senha errada, login certo e logout', async ({ app }) => {
  const { page } = app;
  await page.goto('/');
  await expect(page.getByText('Faça seu login')).toBeVisible();
  await app.print('tela-de-login');

  await page.getByLabel('E-mail').fill('nao-existe@mccar.com');
  await page.getByLabel('Senha', { exact: true }).fill('senhaerrada');
  await page.getByText('Continuar', { exact: true }).click();
  await expect(page.getByText(/inválid/i)).toBeVisible();
  await app.print('senha-invalida');

  await app.entrar(CLIENTE);
  await expect(page.getByText('Buscar peças, marcas ou códigos')).toBeVisible();
  await expect(app.aba('Início')).toBeVisible();
  await app.print('home-logado');

  await app.aba('Perfil').click();
  await page.getByText('Sair da conta', { exact: true }).click();
  await expect(page.getByText('Faça seu login')).toBeVisible();
  await app.print('logout');
});
