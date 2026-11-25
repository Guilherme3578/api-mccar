const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { API_URL, BANCO, CLIENTE, ADMIN } = require('./ambiente');

test('cria o cliente e o administrador no banco de teste', async ({ request }) => {
  for (const usuario of [CLIENTE, ADMIN]) {
    const resposta = await request.post(`${API_URL}/usuarios`, { data: usuario });
    expect(resposta.status()).toBe(201);
  }
  execFileSync(process.execPath, ['src/scripts/promoverAdmin.js', ADMIN.email], {
    cwd: path.join(__dirname, '..', '..'),
    env: { ...process.env, DB_PATH: BANCO },
  });
});
