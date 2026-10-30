const especificacaoProdutoRepository = require('../repositories/especificacaoProdutoRepository');
const produtoService = require('./produtoService');
const AppError = require('../utils/AppError');
const { exigirCampos } = require('../utils/validacao');

function buscar(idProduto, nome) {
  const especificacao = especificacaoProdutoRepository.buscar(idProduto, nome);
  if (!especificacao) {
    throw new AppError('Especificação não encontrada', 404);
  }
  return especificacao;
}

function listar(idProduto) {
  produtoService.buscarPorId(idProduto);
  return especificacaoProdutoRepository.listar(idProduto);
}

function criar(idProduto, dados) {
  produtoService.buscarPorId(idProduto);
  exigirCampos(dados, ['nome', 'valor']);
  const nome = String(dados.nome).trim();

  if (especificacaoProdutoRepository.buscar(idProduto, nome)) {
    throw new AppError('Este produto já possui uma especificação com esse nome', 409);
  }

  return especificacaoProdutoRepository.inserir({ id_produto: idProduto, nome, valor: String(dados.valor).trim() });
}

function atualizar(idProduto, nome, dados) {
  buscar(idProduto, nome);
  exigirCampos(dados, ['valor']);
  return especificacaoProdutoRepository.atualizar({ id_produto: idProduto, nome, valor: String(dados.valor).trim() });
}

function remover(idProduto, nome) {
  buscar(idProduto, nome);
  especificacaoProdutoRepository.remover(idProduto, nome);
}

module.exports = { listar, criar, atualizar, remover };
