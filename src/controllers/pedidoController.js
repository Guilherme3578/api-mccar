const pedidoService = require('../services/pedidoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(pedidoService.listar(req.usuario, req.query));
}

function buscarPorId(req, res) {
  res.json(pedidoService.detalhar(req.usuario, paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(pedidoService.criar(req.usuario, req.body));
}

function checkout(req, res) {
  res.status(201).json(pedidoService.checkout(req.usuario, req.body));
}

function atualizar(req, res) {
  res.json(pedidoService.atualizar(req.usuario, paraId(req.params.id), req.body));
}

function remover(req, res) {
  pedidoService.remover(req.usuario, paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, criar, checkout, atualizar, remover };
