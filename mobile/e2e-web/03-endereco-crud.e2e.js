const { test, expect } = require('./apoio');
const { CLIENTE } = require('./ambiente');

test('03 · endereço: inserir pelo CEP, consultar, alterar e excluir', async ({ app }) => {
  const { page } = app;
  await app.entrar(CLIENTE);
  await app.aba('Perfil').click();

  await page.getByText('Endereços', { exact: true }).first().click();
  await page.getByText('Novo endereço', { exact: true }).last().click();
  await page.getByLabel('CEP').fill('20040020');
  await expect(page.getByPlaceholder('Rua das Oficinas')).not.toHaveValue('');
  await page.getByLabel('Número').fill('50');
  await app.print('inserir-pelo-cep');
  await page.getByText('Salvar endereço', { exact: true }).click();

  const com50 = page.getByText(/, 50 · Rio de Janeiro, RJ/);
  await expect(com50).toBeVisible();
  await app.print('consultar-lista');

  await com50.click();
  await expect(page.getByText('Editar endereço')).toBeVisible();
  await page.getByLabel('Número').fill('75');
  await app.print('alterar-numero');
  await page.getByText('Salvar alterações', { exact: true }).click();

  const com75 = page.getByText(/, 75 · Rio de Janeiro, RJ/);
  await expect(com75).toBeVisible();
  await app.print('alterado');

  await page.getByLabel(/^Remover .*, 75 · Rio de Janeiro, RJ/).click();
  await expect(com75).toBeHidden();
  await app.print('excluido');
});
