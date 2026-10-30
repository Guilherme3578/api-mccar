const favoritoRepository = require('../repositories/favoritoRepository');
const usuarioService = require('./usuarioService');
const produtoService = require('./produtoService');
const AppError = require('../utils/AppError');
const { garantirDono } = require('../utils/acesso');
const { exigirCampos, paraId } = require('../utils/validacao');

function listar(usuarioLogado, idUsuario) {
  usuarioService.buscar(usuarioLogado, idUsuario);
  return favoritoRepository.listar(idUsuario);
}

function adicionar(usuarioLogado, idUsuario, dados) {
  usuarioService.buscar(usuarioLogado, idUsuario);
  exigirCampos(dados, ['id_produto']);
  const id_produto = paraId(dados.id_produto, 'id_produto');
  produtoService.buscarPorId(id_produto);

  if (favoritoRepository.buscar(idUsuario, id_produto)) {
    throw new AppError('Produto já está nos favoritos', 409);
  }

  return favoritoRepository.inserir({ id_usuario: idUsuario, id_produto });
}

function remover(usuarioLogado, idUsuario, idProduto) {
  garantirDono(usuarioLogado, idUsuario);
  if (!favoritoRepository.buscar(idUsuario, idProduto)) {
    throw new AppError('Favorito não encontrado', 404);
  }
  favoritoRepository.remover(idUsuario, idProduto);
}

module.exports = { listar, adicionar, remover };
