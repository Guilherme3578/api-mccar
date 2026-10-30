const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const caminhoBanco = path.resolve(process.env.DB_PATH || 'data/mccar.db');
fs.mkdirSync(path.dirname(caminhoBanco), { recursive: true });

const db = new Database(caminhoBanco);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8'));

function transacao(funcao) {
  return db.transaction(funcao)();
}

module.exports = { db, transacao };
