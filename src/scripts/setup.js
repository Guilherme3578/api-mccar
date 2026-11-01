const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const raiz = path.join(__dirname, '..', '..');
const caminhoEnv = path.join(raiz, '.env');

if (fs.existsSync(caminhoEnv)) {
  console.log('.env já existe, mantido como está');
} else {
  const modelo = fs.readFileSync(path.join(raiz, '.env.example'), 'utf8');
  const segredo = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(caminhoEnv, modelo.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${segredo}`));
  console.log('.env criado a partir do .env.example, com um JWT_SECRET novo');
}

console.log('\nPreenchendo o catálogo:');
require('./seed');

console.log('\nTudo pronto. Agora rode: npm run dev');
