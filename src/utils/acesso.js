const Perfil = require('../enums/Perfil');
const AppError = require('./AppError');
const { paraIdOpcional } = require('./validacao');

function ehAdmin(usuarioLogado) {
  return usuarioLogado.perfil === Perfil.ADMIN;
}

function garantirDono(usuarioLogado, idDono) {
  if (!ehAdmin(usuarioLogado) && usuarioLogado.id_usuario !== idDono) {
    throw new AppError('Acesso negado a este recurso', 403);
  }
}

function idUsuarioDoFiltro(usuarioLogado, idInformado) {
  return ehAdmin(usuarioLogado) ? paraIdOpcional(idInformado, 'id_usuario') : usuarioLogado.id_usuario;
}

module.exports = { ehAdmin, garantirDono, idUsuarioDoFiltro };
