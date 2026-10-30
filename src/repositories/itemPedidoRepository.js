const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('itemPedido');

module.exports = {
  listar: (id_pedido) => sql.listar.all(id_pedido),
  buscar: (id_pedido, id_produto) => sql.buscar.get(id_pedido, id_produto),
  resumo: (id_pedido) => sql.resumo.get(id_pedido),
  inserir: (item) => sql.inserir.get(item),
  atualizar: (item) => sql.atualizar.get(item),
  remover: (id_pedido, id_produto) => sql.remover.run(id_pedido, id_produto),
};
