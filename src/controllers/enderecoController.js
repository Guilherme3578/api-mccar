const enderecoService = require('../services/enderecoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(enderecoService.listar(req.usuario, req.query));
}

function buscarPorId(req, res) {
  res.json(enderecoService.buscar(req.usuario, paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(enderecoService.criar(req.usuario, req.body));
}

function atualizar(req, res) {
  res.json(enderecoService.atualizar(req.usuario, paraId(req.params.id), req.body));
}

function remover(req, res) {
  enderecoService.remover(req.usuario, paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
