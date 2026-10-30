const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('cupom');

module.exports = {
  listar: () => sql.listar.all(),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorCodigo: (codigo) => sql.buscarPorCodigo.get(codigo),
  inserir: (cupom) => sql.inserir.get(cupom),
  atualizar: (cupom) => sql.atualizar.get(cupom),
  remover: (id) => sql.remover.run(id),
};
