const cupomService = require('../services/cupomService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(cupomService.listar());
}

function buscarPorId(req, res) {
  res.json(cupomService.buscarPorId(paraId(req.params.id)));
}

function buscarPorCodigo(req, res) {
  res.json(cupomService.buscarPorCodigo(req.params.codigo));
}

function criar(req, res) {
  res.status(201).json(cupomService.criar(req.body));
}

function atualizar(req, res) {
  res.json(cupomService.atualizar(paraId(req.params.id), req.body));
}

function remover(req, res) {
  cupomService.remover(paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, buscarPorCodigo, criar, atualizar, remover };
