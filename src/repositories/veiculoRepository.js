const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('veiculo');

module.exports = {
  listar: (id_usuario) => sql.listar.all({ id_usuario }),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorUsuarioEModelo: (id_usuario, id_modelo_veiculo) => sql.buscarPorUsuarioEModelo.get(id_usuario, id_modelo_veiculo),
  inserir: (veiculo) => sql.inserir.get(veiculo),
  atualizar: (veiculo) => sql.atualizar.get(veiculo),
  desmarcarOutrosPrincipais: (id_usuario, id_veiculo) => sql.desmarcarOutrosPrincipais.run(id_usuario, id_veiculo),
  promoverPrimeiroPrincipal: (id_usuario) => sql.promoverPrimeiroPrincipal.run({ id_usuario }),
  remover: (id) => sql.remover.run(id),
};
