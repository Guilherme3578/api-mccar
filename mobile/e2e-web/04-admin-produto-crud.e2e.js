const { test, expect } = require('./apoio');
const { ADMIN } = require('./ambiente');

test('04 · admin: produto (inserir, consultar, alterar e excluir)', async ({ app }) => {
  const { page } = app;
  const codigo = 'E2E-' + Date.now().toString().slice(-6);
  const nome = 'Produto Teste ' + codigo;

  await app.entrar(ADMIN);
  await app.aba('Perfil').click();
  await page.getByText('Gerenciar produtos', { exact: true }).click();
  await page.getByLabel('Novo produto').click();

  await page.getByText('Freios', { exact: true }).click();
  await page.getByPlaceholder('MC-023').fill(codigo);
  await page.getByPlaceholder('Bosch').fill('Marca E2E');
  await page.getByPlaceholder('Pastilha de Freio Dianteira', { exact: true }).fill(nome);
  await page.getByPlaceholder('Detalhes, material e indicação de uso').fill('Produto criado pelo teste automatizado E2E');
  await page.getByPlaceholder('R$ 0,00').fill('4990');
  await app.print('inserir-produto');
  await page.getByText('Cadastrar produto', { exact: true }).click();

  await page.getByPlaceholder('Buscar por nome, marca ou código').fill(codigo);
  await expect(page.getByText(nome)).toBeVisible();
  await expect(page.getByText('R$ 49,90')).toBeVisible();
  await app.print('consultar-produto');

  await page.getByLabel('Editar ' + nome).click();
  await expect(page.getByText('Editar produto')).toBeVisible();
  await page.getByPlaceholder('R$ 0,00').fill('5990');
  await app.print('alterar-preco');
  await page.getByText('Salvar alterações', { exact: true }).click();
  await page.getByPlaceholder('Buscar por nome, marca ou código').fill(codigo);
  await expect(page.getByText('R$ 59,90')).toBeVisible();
  await app.print('preco-alterado');

  await page.getByLabel('Excluir ' + nome).click();
  await expect(page.getByText(nome)).toBeHidden();
  await app.print('produto-excluido');
});
