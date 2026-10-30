const itemCarrinhoService = require('../services/itemCarrinhoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(itemCarrinhoService.listar(req.usuario, paraId(req.params.idCarrinho, 'idCarrinho')));
}

function adicionar(req, res) {
  res.status(201).json(itemCarrinhoService.adicionar(req.usuario, paraId(req.params.idCarrinho, 'idCarrinho'), req.body));
}

function atualizar(req, res) {
  res.json(
    itemCarrinhoService.atualizar(
      req.usuario,
      paraId(req.params.idCarrinho, 'idCarrinho'),
      paraId(req.params.idProduto, 'idProduto'),
      req.body
    )
  );
}

function remover(req, res) {
  itemCarrinhoService.remover(
    req.usuario,
    paraId(req.params.idCarrinho, 'idCarrinho'),
    paraId(req.params.idProduto, 'idProduto')
  );
  res.status(204).send();
}

module.exports = { listar, adicionar, atualizar, remover };
