const itemCarrinhoRepository = require('../repositories/itemCarrinhoRepository');
const carrinhoRepository = require('../repositories/carrinhoRepository');
const carrinhoService = require('./carrinhoService');
const produtoService = require('./produtoService');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { exigirCampos, paraId, paraInteiro } = require('../utils/validacao');

function buscar(idCarrinho, idProduto) {
  const item = itemCarrinhoRepository.buscar(idCarrinho, idProduto);
  if (!item) {
    throw new AppError('Item não encontrado no carrinho', 404);
  }
  return item;
}

function listar(usuarioLogado, idCarrinho) {
  carrinhoService.buscar(usuarioLogado, idCarrinho);
  return itemCarrinhoRepository.listar(idCarrinho);
}

function adicionar(usuarioLogado, idCarrinho, dados) {
  carrinhoService.buscar(usuarioLogado, idCarrinho);
  exigirCampos(dados, ['id_produto', 'quantidade']);
  const id_produto = paraId(dados.id_produto, 'id_produto');
  const quantidade = paraInteiro(dados.quantidade, 'quantidade', 1);

  const produto = produtoService.buscarPorId(id_produto);
  if (!produto.ativo) {
    throw new AppError('Produto indisponível', 400);
  }
  if (itemCarrinhoRepository.buscar(idCarrinho, id_produto)) {
    throw new AppError('Produto já está no carrinho, altere a quantidade', 409);
  }

  return transacao(() => {
    const item = itemCarrinhoRepository.inserir({ id_carrinho: idCarrinho, id_produto, quantidade });
    carrinhoRepository.registrarAtualizacao(idCarrinho);
    return item;
  });
}

function atualizar(usuarioLogado, idCarrinho, idProduto, dados) {
  carrinhoService.buscar(usuarioLogado, idCarrinho);
  buscar(idCarrinho, idProduto);
  exigirCampos(dados, ['quantidade']);
  const quantidade = paraInteiro(dados.quantidade, 'quantidade', 1);

  return transacao(() => {
    const item = itemCarrinhoRepository.atualizar({ id_carrinho: idCarrinho, id_produto: idProduto, quantidade });
    carrinhoRepository.registrarAtualizacao(idCarrinho);
    return item;
  });
}

function remover(usuarioLogado, idCarrinho, idProduto) {
  carrinhoService.buscar(usuarioLogado, idCarrinho);
  buscar(idCarrinho, idProduto);

  transacao(() => {
    itemCarrinhoRepository.remover(idCarrinho, idProduto);
    carrinhoRepository.registrarAtualizacao(idCarrinho);
  });
}

module.exports = { listar, adicionar, atualizar, remover };
