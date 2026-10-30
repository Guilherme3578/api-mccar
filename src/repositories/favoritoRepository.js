const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('favorito');

module.exports = {
  listar: (id_usuario) => sql.listar.all(id_usuario),
  buscar: (id_usuario, id_produto) => sql.buscar.get(id_usuario, id_produto),
  inserir: (favorito) => sql.inserir.get(favorito),
  remover: (id_usuario, id_produto) => sql.remover.run(id_usuario, id_produto),
};
