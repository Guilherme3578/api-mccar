const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('endereco');

module.exports = {
  listar: (id_usuario) => sql.listar.all({ id_usuario }),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  inserir: (endereco) => sql.inserir.get(endereco),
  atualizar: (endereco) => sql.atualizar.get(endereco),
  desmarcarOutrosPrincipais: (id_usuario, id_endereco) => sql.desmarcarOutrosPrincipais.run(id_usuario, id_endereco),
  promoverPrimeiroPrincipal: (id_usuario) => sql.promoverPrimeiroPrincipal.run({ id_usuario }),
  remover: (id) => sql.remover.run(id),
};
