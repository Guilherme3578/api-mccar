const especificacaoProdutoService = require('../services/especificacaoProdutoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(especificacaoProdutoService.listar(paraId(req.params.idProduto, 'idProduto')));
}

function criar(req, res) {
  res.status(201).json(especificacaoProdutoService.criar(paraId(req.params.idProduto, 'idProduto'), req.body));
}

function atualizar(req, res) {
  res.json(especificacaoProdutoService.atualizar(paraId(req.params.idProduto, 'idProduto'), req.params.nome, req.body));
}

function remover(req, res) {
  especificacaoProdutoService.remover(paraId(req.params.idProduto, 'idProduto'), req.params.nome);
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, remover };
