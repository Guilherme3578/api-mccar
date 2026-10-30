const itemPedidoService = require('../services/itemPedidoService');
const { paraId } = require('../utils/validacao');

function listar(req, res) {
  res.json(itemPedidoService.listar(req.usuario, paraId(req.params.idPedido, 'idPedido')));
}

function adicionar(req, res) {
  res.status(201).json(itemPedidoService.adicionar(req.usuario, paraId(req.params.idPedido, 'idPedido'), req.body));
}

function atualizar(req, res) {
  res.json(
    itemPedidoService.atualizar(
      req.usuario,
      paraId(req.params.idPedido, 'idPedido'),
      paraId(req.params.idProduto, 'idProduto'),
      req.body
    )
  );
}

function remover(req, res) {
  itemPedidoService.remover(
    req.usuario,
    paraId(req.params.idPedido, 'idPedido'),
    paraId(req.params.idProduto, 'idProduto')
  );
  res.status(204).send();
}

module.exports = { listar, adicionar, atualizar, remover };
