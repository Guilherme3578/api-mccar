const os = require('os');
const path = require('path');

const API_PORTA = 3100;
const WEB_PORTA = 8090;

module.exports = {
  API_PORTA,
  WEB_PORTA,
  API_URL: `http://localhost:${API_PORTA}`,
  BANCO: path.join(os.tmpdir(), 'mccar-e2e', 'mccar-e2e.db'),
  CLIENTE: { nome: 'Cliente E2E', email: 'cliente@e2e.mccar.com', senha: 'senha123' },
  ADMIN: { nome: 'Admin E2E', email: 'admin@e2e.mccar.com', senha: 'senha123' },
};
