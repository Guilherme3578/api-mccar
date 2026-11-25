const fs = require('fs');
const path = require('path');
const { test, expect } = require('./apoio');
const { ADMIN } = require('./ambiente');

test('05 · admin: gerar os dados em JSON para o dashboard', async ({ app }, testInfo) => {
  const { page } = app;
  await app.entrar(ADMIN);
  await app.aba('Perfil').click();
  await expect(page.getByText('Gerar JSON', { exact: true })).toBeVisible();
  await app.print('perfil-admin');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText('Gerar JSON', { exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^mccar-dados-\d{14}\.json$/);
  const arquivo = path.join(__dirname, 'prints', '05-gerar-json', download.suggestedFilename());
  await download.saveAs(arquivo);
  await testInfo.attach('arquivo gerado', { path: arquivo, contentType: 'application/json' });

  const dados = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  expect(dados.resumo).toBeDefined();
  expect(Array.isArray(dados.pedidos)).toBe(true);
  await expect.poll(() => app.avisos.join(' ')).toContain('Dados exportados');
  await app.print('json-gerado');
});
