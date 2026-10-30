const produtoService = require('../services/produtoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(produtoService.listar(req.query));
}

function buscarPorId(req, res) {
  res.json(produtoService.detalhar(paraId(req.params.id)));
}

function criar(req, res) {
  res.status(201).json(produtoService.criar(req.body));
}

function atualizar(req, res) {
  res.json(produtoService.atualizar(paraId(req.params.id), req.body));
}

function remover(req, res) {
  produtoService.remover(paraId(req.params.id));
  res.status(204).send();
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
