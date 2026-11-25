const { defineConfig } = require('@playwright/test');
const { API_PORTA, WEB_PORTA, API_URL, BANCO } = require('./e2e-web/ambiente');

module.exports = defineConfig({
  testDir: './e2e-web',
  workers: 1,
  timeout: 120000,
  expect: { timeout: 20000 },
  outputDir: 'e2e-web/resultados',
  reporter: [['list'], ['html', { outputFolder: 'e2e-web/relatorio', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORTA}`,
    viewport: { width: 390, height: 844 },
    locale: 'pt-BR',
    screenshot: 'on',
    video: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'preparar', testMatch: /preparar\.setup\.js/ },
    { name: 'fluxos', testMatch: /\.e2e\.js/, dependencies: ['preparar'] },
  ],
  webServer: [
    {
      command: 'node mobile/e2e-web/subir-api.js',
      cwd: '..',
      url: API_URL,
      env: { PORT: String(API_PORTA), DB_PATH: BANCO, PAGAMENTO_APROVACAO_AUTOMATICA: 'true' },
      timeout: 60000,
    },
    {
      command: `npx expo start --web --port ${WEB_PORTA} --clear`,
      url: `http://localhost:${WEB_PORTA}`,
      env: { CI: '1', EXPO_PUBLIC_API_URL: API_URL },
      timeout: 240000,
    },
  ],
});
