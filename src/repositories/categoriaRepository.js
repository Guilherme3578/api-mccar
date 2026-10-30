const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('categoria');

module.exports = {
  listar: () => sql.listar.all(),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorNome: (nome) => sql.buscarPorNome.get(nome),
  inserir: (categoria) => sql.inserir.get(categoria),
  atualizar: (categoria) => sql.atualizar.get(categoria),
  remover: (id) => sql.remover.run(id),
};
