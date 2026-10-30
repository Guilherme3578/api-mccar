const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('produto');

module.exports = {
  listar: (filtros) => sql.listar.all(filtros),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorCodigo: (codigo) => sql.buscarPorCodigo.get(codigo),
  inserir: (produto) => sql.inserir.get(produto),
  atualizar: (produto) => sql.atualizar.get(produto),
  remover: (id) => sql.remover.run(id),
};
