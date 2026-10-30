const usuarioService = require('../services/usuarioService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(usuarioService.listar());
}

function buscarPorId(req, res) {
  res.json(usuarioService.buscar(req.usuario, paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(usuarioService.criar(req.body));
}

function atualizar(req, res) {
  res.json(usuarioService.atualizar(req.usuario, paraId(req.params.id), req.body));
}

function alterarPerfil(req, res) {
  res.json(usuarioService.alterarPerfil(req.usuario, paraId(req.params.id), req.body));
}

function remover(req, res) {
  usuarioService.remover(req.usuario, paraId(req.params.id));
  res.status(204).send();
}

function login(req, res) {
  res.json(usuarioService.login(req.body));
}

function perfil(req, res) {
  res.json(req.usuario);
}

module.exports = { listar, buscarPorId, criar, atualizar, alterarPerfil, remover, login, perfil };
