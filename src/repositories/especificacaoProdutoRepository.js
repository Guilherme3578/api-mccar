const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('especificacaoProduto');

module.exports = {
  listar: (id_produto) => sql.listar.all(id_produto),
  buscar: (id_produto, nome) => sql.buscar.get(id_produto, nome),
  inserir: (especificacao) => sql.inserir.get(especificacao),
  atualizar: (especificacao) => sql.atualizar.get(especificacao),
  remover: (id_produto, nome) => sql.remover.run(id_produto, nome),
};
