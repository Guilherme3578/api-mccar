const { test, expect } = require('./apoio');
const { CLIENTE } = require('./ambiente');

test('02 · compra completa: catálogo, carrinho, checkout e pagamento Pix', async ({ app }) => {
  const { page } = app;
  await app.entrar(CLIENTE);

  await app.aba('Peças').click();
  await page.getByPlaceholder(/Buscar/).fill('Pastilha');
  await page.getByText('Pastilha de Freio Dianteira').first().click();
  await expect(page.getByText('Detalhes', { exact: true })).toBeVisible();
  await app.print('detalhe-do-produto');

  await page.getByText('Adicionar ao carrinho', { exact: true }).click();
  await expect(page.getByText('Finalizar compra', { exact: true })).toBeVisible();
  await expect(page.getByText('Pastilha de Freio Dianteira')).toBeVisible();
  await app.print('carrinho');

  await page.getByText('Finalizar compra', { exact: true }).click();
  await page.getByText('Adicionar endereço').click();
  await page.getByText('Novo endereço', { exact: true }).last().click();
  await page.getByLabel('CEP').fill('01001000');
  await expect(page.getByPlaceholder('Rua das Oficinas')).toHaveValue(/Praça da Sé/);
  await page.getByLabel('Número').fill('100');
  await app.print('endereco-pelo-cep');
  await page.getByText('Salvar endereço', { exact: true }).click();
  await expect(page.getByText('Fazer pedido', { exact: true })).toBeVisible();
  await app.print('checkout');

  await page.getByText('Fazer pedido', { exact: true }).click();
  await page.getByText('Pagar no app', { exact: true }).click();
  await page.getByText('Pix', { exact: true }).click();
  await app.print('pagamento-pix');
  await page.getByText('Confirmar pagamento', { exact: true }).click();
  await expect(page.getByText('Pedido confirmado')).toBeVisible();
  await expect(page.getByText('Praça da Sé, 100 · São Paulo, SP')).toBeVisible();
  await app.print('pedido-confirmado');

  await page.getByText('Acompanhar pedido', { exact: true }).click();
  await expect(page.getByText(/Pedido MC-\d+/).first()).toBeVisible();
  await app.print('acompanhar-pedido');
});
