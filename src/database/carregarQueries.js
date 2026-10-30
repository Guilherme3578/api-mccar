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

  return queries;
}

module.exports = carregarQueries;
