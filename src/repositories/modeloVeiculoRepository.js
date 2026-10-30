const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('modeloVeiculo');

module.exports = {
  listar: () => sql.listar.all(),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  inserir: (modelo) => sql.inserir.get(modelo),
  atualizar: (modelo) => sql.atualizar.get(modelo),
  remover: (id) => sql.remover.run(id),
};
