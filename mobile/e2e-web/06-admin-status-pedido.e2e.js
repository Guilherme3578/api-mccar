const { test, expect } = require('./apoio');
const { ADMIN } = require('./ambiente');

test('06 · admin: pedido pago passa para enviado e depois entregue', async ({ app }) => {
  const { page } = app;
  await app.entrar(ADMIN);
  await app.aba('Perfil').click();

  await page.getByText('Em processamento').first().click();
  await expect(page.getByText('Marcar como enviado')).toBeVisible();
  await app.print('pedido-pago');

  await page.getByText('Marcar como enviado').click();
  await expect(page.getByText('Marcar como entregue')).toBeVisible();
  await expect(page.getByText('Enviado', { exact: true }).last()).toBeVisible();
  await app.print('pedido-enviado');

  await page.getByText('Marcar como entregue').click();
  await expect(page.getByText('Marcar como entregue')).toBeHidden();
  await expect(page.getByText('Entregue', { exact: true }).last()).toBeVisible();
  await app.print('pedido-entregue');
});
