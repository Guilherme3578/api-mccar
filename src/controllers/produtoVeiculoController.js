const produtoVeiculoService = require('../services/produtoVeiculoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(produtoVeiculoService.listar(paraId(req.params.idProduto, 'idProduto')));
}

function adicionar(req, res) {
  res.status(201).json(produtoVeiculoService.adicionar(paraId(req.params.idProduto, 'idProduto'), req.body));
}

function remover(req, res) {
  produtoVeiculoService.remover(
    paraId(req.params.idProduto, 'idProduto'),
    paraId(req.params.idModeloVeiculo, 'idModeloVeiculo')
  );
  res.status(204).send();
}

module.exports = { listar, adicionar, remover };
