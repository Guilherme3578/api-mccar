require('../config/env');

const fs = require('fs');
const path = require('path');
const { db, transacao } = require('../config/database');

const seed = fs.readFileSync(path.join(__dirname, '..', 'database', 'seed.sql'), 'utf8');

transacao(() => db.exec(seed));

for (const tabela of ['categoria', 'modelo_veiculo', 'produto', 'especificacao_produto', 'produto_veiculo']) {
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM ${tabela}`).get();
  console.log(`${tabela}: ${total}`);
}
