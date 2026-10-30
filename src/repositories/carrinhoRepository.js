const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('carrinho');

module.exports = {
  listar: (id_usuario) => sql.listar.all({ id_usuario }),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorUsuario: (id_usuario) => sql.buscarPorUsuario.get(id_usuario),
  inserir: (carrinho) => sql.inserir.get(carrinho),
  registrarAtualizacao: (id) => sql.registrarAtualizacao.run(id),
  remover: (id) => sql.remover.run(id),
};
