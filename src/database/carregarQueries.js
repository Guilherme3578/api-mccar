const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');

function carregarQueries(entidade) {
  const pasta = path.join(__dirname, 'queries', entidade);
  const queries = {};

  for (const arquivo of fs.readdirSync(pasta)) {
    if (path.extname(arquivo) !== '.sql') continue;
    const nome = path.basename(arquivo, '.sql');
    queries[nome] = db.prepare(fs.readFileSync(path.join(pasta, arquivo), 'utf8'));
  }

  return new Proxy(queries, {
    get(alvo, nome) {
      if (typeof nome === 'string' && !(nome in alvo)) {
        throw new Error(`Query "${nome}" não encontrada em queries/${entidade}`);
      }
      return alvo[nome];
    },
  });
}

module.exports = carregarQueries;
