const AppError = require('../utils/AppError');

const errosSqlite = {
  SQLITE_CONSTRAINT_UNIQUE: [409, 'Já existe um registro com esses dados'],
  SQLITE_CONSTRAINT_PRIMARYKEY: [409, 'Já existe um registro com esses dados'],
  SQLITE_CONSTRAINT_FOREIGNKEY: [409, 'Operação não permitida: registro relacionado inexistente ou em uso'],
  SQLITE_CONSTRAINT_CHECK: [400, 'Valor inválido para um dos campos'],
  SQLITE_CONSTRAINT_NOTNULL: [400, 'Campo obrigatório não informado'],
};

function errorHandler(erro, req, res, next) {
  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  if (errosSqlite[erro.code]) {
    const [status, mensagem] = errosSqlite[erro.code];
    return res.status(status).json({ erro: mensagem });
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = errorHandler;
