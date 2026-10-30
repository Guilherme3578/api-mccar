const itemPedidoRepository = require('../repositories/itemPedidoRepository');
const pedidoService = require('./pedidoService');
const produtoService = require('./produtoService');
const StatusPedido = require('../enums/StatusPedido');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { exigirCampos, paraId, paraInteiro } = require('../utils/validacao');

function pedidoEmRascunho(usuarioLogado, idPedido) {
  const pedido = pedidoService.buscar(usuarioLogado, idPedido);
  if (pedido.status !== StatusPedido.RASCUNHO) {
    throw new AppError('Itens só podem ser alterados enquanto o pedido está em RASCUNHO', 400);
  }
  return pedido;
}

function buscar(idPedido, idProduto) {
  const item = itemPedidoRepository.buscar(idPedido, idProduto);
  if (!item) {
    throw new AppError('Item não encontrado no pedido', 404);
  }
  return item;
}

function listar(usuarioLogado, idPedido) {
  pedidoService.buscar(usuarioLogado, idPedido);
  return itemPedidoRepository.listar(idPedido);
}

function adicionar(usuarioLogado, idPedido, dados) {
  pedidoEmRascunho(usuarioLogado, idPedido);
  exigirCampos(dados, ['id_produto', 'quantidade']);
  const quantidade = paraInteiro(dados.quantidade, 'quantidade', 1);
  const produto = produtoService.buscarPorId(paraId(dados.id_produto, 'id_produto'));

  if (itemPedidoRepository.buscar(idPedido, produto.id_produto)) {
    throw new AppError('Produto já está no pedido, altere a quantidade', 409);
  }

  const novoItem = pedidoService.itemDoPedido(idPedido, produto, quantidade);

  return transacao(() => {
    const item = itemPedidoRepository.inserir(novoItem);
    pedidoService.recalcularTotais(idPedido);
    return item;
  });
}

function atualizar(usuarioLogado, idPedido, idProduto, dados) {
  pedidoEmRascunho(usuarioLogado, idPedido);
  buscar(idPedido, idProduto);
  exigirCampos(dados, ['quantidade']);
  const quantidade = paraInteiro(dados.quantidade, 'quantidade', 1);

  return transacao(() => {
    const item = itemPedidoRepository.atualizar({ id_pedido: idPedido, id_produto: idProduto, quantidade });
    pedidoService.recalcularTotais(idPedido);
    return item;
  });
}

function remover(usuarioLogado, idPedido, idProduto) {
  pedidoEmRascunho(usuarioLogado, idPedido);
  buscar(idPedido, idProduto);

  transacao(() => {
    itemPedidoRepository.remover(idPedido, idProduto);
    pedidoService.recalcularTotais(idPedido);
  });
}

module.exports = { listar, adicionar, atualizar, remover };
