const pagamentoService = require('../services/pagamentoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(pagamentoService.listar(req.usuario, req.query));
}

function buscarPorId(req, res) {
  res.json(pagamentoService.buscar(req.usuario, paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(pagamentoService.criar(req.usuario, req.body));
}

function atualizar(req, res) {
  res.json(pagamentoService.atualizar(paraId(req.params.id), req.body));
}

function remover(req, res) {
  pagamentoService.remover(paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
