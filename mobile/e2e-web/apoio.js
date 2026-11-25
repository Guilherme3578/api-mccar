const fs = require('fs');
const path = require('path');
const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  app: async ({ page }, use, testInfo) => {
    const pasta = path.join(__dirname, 'prints', path.basename(testInfo.file, '.e2e.js'));
    fs.rmSync(pasta, { recursive: true, force: true });
    fs.mkdirSync(pasta, { recursive: true });
    let passo = 0;
    const avisos = [];

    page.on('dialog', async (dialogo) => {
      avisos.push(dialogo.message());
      testInfo.annotations.push({ type: 'aviso na tela', description: dialogo.message().replace(/\n+/g, ' | ') });
      await dialogo.accept();
    });

    const app = {
      page,
      avisos,
      async print(nome) {
        passo += 1;
        const arquivo = path.join(pasta, `${String(passo).padStart(2, '0')}-${nome}.png`);
        await page.waitForTimeout(400);
        await page.screenshot({ path: arquivo });
        await testInfo.attach(`${String(passo).padStart(2, '0')} ${nome}`, { path: arquivo, contentType: 'image/png' });
      },
      async entrar({ email, senha }) {
        await page.goto('/');
        await page.getByLabel('E-mail').fill(email);
        await page.getByLabel('Senha', { exact: true }).fill(senha);
        await page.getByText('Continuar', { exact: true }).click();
        await expect(page.getByText('Destaques')).toBeVisible();
      },
      aba(nome) {
        return page.getByRole('tab', { name: nome });
      },
    };
    await use(app);
  },
});

module.exports = { test, expect };
