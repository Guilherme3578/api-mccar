const { test, expect } = require('./apoio');
const { CLIENTE } = require('./ambiente');

test('07 · veículo: adicionar pela Home e ver no Perfil', async ({ app }) => {
  const { page } = app;
  await app.entrar(CLIENTE);

  await page.getByText('Adicionar meu veículo').click();
  await expect(page.getByPlaceholder('Marca, modelo ou ano')).toBeVisible();
  await page.getByPlaceholder('Marca, modelo ou ano').fill('Onix');
  await app.print('escolher-modelo');

  await page.getByText(/Onix/).first().click();
  await expect(page.getByPlaceholder('Marca, modelo ou ano')).toBeHidden();
  await expect(page.getByText(/Onix/).first()).toBeVisible();
  await app.print('veiculo-na-home');

  await app.aba('Perfil').click();
  await expect(page.getByText(/Onix/).first()).toBeVisible();
  await app.print('veiculo-no-perfil');
});
