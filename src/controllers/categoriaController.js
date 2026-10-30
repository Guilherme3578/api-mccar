const categoriaService = require('../services/categoriaService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(categoriaService.listar());
}

function buscarPorId(req, res) {
  res.json(categoriaService.buscarPorId(paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(categoriaService.criar(req.body));
}

function atualizar(req, res) {
  res.json(categoriaService.atualizar(paraId(req.params.id), req.body));
}

function remover(req, res) {
  categoriaService.remover(paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
