const cartaoService = require('../services/cartaoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(cartaoService.listar(req.usuario, req.query));
}

function buscarPorId(req, res) {
  res.json(cartaoService.buscar(req.usuario, paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(cartaoService.criar(req.usuario, req.body));
}

function atualizar(req, res) {
  res.json(cartaoService.atualizar(req.usuario, paraId(req.params.id), req.body));
}

function remover(req, res) {
  cartaoService.remover(req.usuario, paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
