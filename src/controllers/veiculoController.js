const veiculoService = require('../services/veiculoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(veiculoService.listar(req.usuario, req.query));
}

function buscarPorId(req, res) {
  res.json(veiculoService.buscar(req.usuario, paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(veiculoService.criar(req.usuario, req.body));
}

function atualizar(req, res) {
  res.json(veiculoService.atualizar(req.usuario, paraId(req.params.id), req.body));
}

function remover(req, res) {
  veiculoService.remover(req.usuario, paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
