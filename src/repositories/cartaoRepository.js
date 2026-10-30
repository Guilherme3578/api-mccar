const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('cartao');

module.exports = {
  listar: (id_usuario) => sql.listar.all({ id_usuario }),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  inserir: (cartao) => sql.inserir.get(cartao),
  atualizar: (cartao) => sql.atualizar.get(cartao),
  desmarcarOutrosPrincipais: (id_usuario, id_cartao) => sql.desmarcarOutrosPrincipais.run(id_usuario, id_cartao),
  promoverPrimeiroPrincipal: (id_usuario) => sql.promoverPrimeiroPrincipal.run({ id_usuario }),
  remover: (id) => sql.remover.run(id),
};
