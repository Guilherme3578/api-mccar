const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('usuario');

module.exports = {
  listar: () => sql.listar.all(),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorEmail: (email) => sql.buscarPorEmail.get(email),
  inserir: (usuario) => sql.inserir.get(usuario),
  atualizar: (usuario) => sql.atualizar.get(usuario),
  atualizarSenha: (id_usuario, senha_hash) => sql.atualizarSenha.run({ id_usuario, senha_hash }),
  atualizarPerfil: (id_usuario, perfil) => sql.atualizarPerfil.get({ id_usuario, perfil }),
  remover: (id) => sql.remover.run(id),
};
