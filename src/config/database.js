const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const VERSAO_DO_SCHEMA = 2;

const caminhoBanco = path.resolve(process.env.DB_PATH || 'data/mccar.db');
fs.mkdirSync(path.dirname(caminhoBanco), { recursive: true });

const db = new Database(caminhoBanco);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const bancoJaExistia = db.prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table'").get().total > 0;
if (bancoJaExistia && db.pragma('user_version', { simple: true }) < VERSAO_DO_SCHEMA) {
  console.error(`O banco ${caminhoBanco} foi criado com uma versão antiga do schema.`);
  console.error('Pare a API, apague a pasta data/ e rode: npm run setup');
  process.exit(1);
}

db.exec(fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8'));
db.pragma(`user_version = ${VERSAO_DO_SCHEMA}`);

function transacao(funcao) {
  return db.transaction(funcao)();
}

module.exports = { db, transacao };
