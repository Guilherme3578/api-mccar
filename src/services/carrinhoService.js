const carrinhoRepository = require('../repositories/carrinhoRepository');
const itemCarrinhoRepository = require('../repositories/itemCarrinhoRepository');
const AppError = require('../utils/AppError');
const { garantirDono, idUsuarioDoFiltro } = require('../utils/acesso');

function buscarPorId(id) {
  const carrinho = carrinhoRepository.buscarPorId(id);
  if (!carrinho) {
    throw new AppError('Carrinho não encontrado', 404);
  }
  return carrinho;
}

function listar(usuarioLogado, filtros) {
  return carrinhoRepository.listar(idUsuarioDoFiltro(usuarioLogado, filtros.id_usuario));
}

function buscar(usuarioLogado, id) {
  const carrinho = buscarPorId(id);
  garantirDono(usuarioLogado, carrinho.id_usuario);
  return carrinho;
}

function detalhar(usuarioLogado, id) {
  const carrinho = buscar(usuarioLogado, id);
  const itens = itemCarrinhoRepository.listar(id);
  const total_centavos = itens.reduce((soma, item) => soma + item.total_centavos, 0);
  return { ...carrinho, itens, total_centavos };
}

function meu(usuarioLogado) {
  const carrinho =
    carrinhoRepository.buscarPorUsuario(usuarioLogado.id_usuario) ??
    carrinhoRepository.inserir({ id_usuario: usuarioLogado.id_usuario });
  return detalhar(usuarioLogado, carrinho.id_carrinho);
}

function criar(usuarioLogado) {
  const id_usuario = usuarioLogado.id_usuario;

  if (carrinhoRepository.buscarPorUsuario(id_usuario)) {
    throw new AppError('Usuário já possui um carrinho', 409);
  }

  return carrinhoRepository.inserir({ id_usuario });
}

function remover(usuarioLogado, id) {
  buscar(usuarioLogado, id);
  carrinhoRepository.remover(id);
}

module.exports = { listar, buscar, detalhar, meu, criar, remover };
