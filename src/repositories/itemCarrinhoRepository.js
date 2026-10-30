const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('itemCarrinho');

module.exports = {
  listar: (id_carrinho) => sql.listar.all(id_carrinho),
  buscar: (id_carrinho, id_produto) => sql.buscar.get(id_carrinho, id_produto),
  inserir: (item) => sql.inserir.get(item),
  atualizar: (item) => sql.atualizar.get(item),
  remover: (id_carrinho, id_produto) => sql.remover.run(id_carrinho, id_produto),
  limpar: (id_carrinho) => sql.limpar.run(id_carrinho),
};
