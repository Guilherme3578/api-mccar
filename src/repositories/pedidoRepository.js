const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('pedido');

module.exports = {
  listar: (filtros) => sql.listar.all(filtros),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  inserir: (pedido) => sql.inserir.get(pedido),
  atualizar: (pedido) => sql.atualizar.get(pedido),
  atualizarStatus: (id_pedido, status) => sql.atualizarStatus.run({ id_pedido, status }),
  remover: (id) => sql.remover.run(id),
};
