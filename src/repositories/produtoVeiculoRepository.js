const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('produtoVeiculo');

module.exports = {
  listar: (id_produto) => sql.listar.all(id_produto),
  buscar: (id_produto, id_modelo_veiculo) => sql.buscar.get(id_produto, id_modelo_veiculo),
  inserir: (vinculo) => sql.inserir.get(vinculo),
  remover: (id_produto, id_modelo_veiculo) => sql.remover.run(id_produto, id_modelo_veiculo),
};
