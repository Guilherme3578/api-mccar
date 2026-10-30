const cartaoRepository = require('../repositories/cartaoRepository');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { garantirDono, idUsuarioDoFiltro } = require('../utils/acesso');
const { exigirCampos, selecionarCampos, paraFlag, paraTextoOpcional } = require('../utils/validacao');

const camposEditaveis = ['apelido', 'bandeira', 'ultimos_quatro', 'nome_titular', 'principal'];

function normalizar(cartao) {
  exigirCampos(cartao, ['bandeira', 'ultimos_quatro', 'nome_titular']);

  const ultimosQuatro = String(cartao.ultimos_quatro).trim();
  if (!/^\d{4}$/.test(ultimosQuatro)) {
    throw new AppError('ultimos_quatro deve conter exatamente 4 dígitos', 400);
  }

  return {
    ...cartao,
    apelido: paraTextoOpcional(cartao.apelido),
    bandeira: String(cartao.bandeira).trim().toUpperCase(),
    ultimos_quatro: ultimosQuatro,
    nome_titular: String(cartao.nome_titular).trim().toUpperCase(),
    principal: paraFlag(cartao.principal),
  };
}

function salvar(operacao, cartao) {
  return transacao(() => {
    const salvo = operacao(cartao);
    if (salvo.principal) {
      cartaoRepository.desmarcarOutrosPrincipais(salvo.id_usuario, salvo.id_cartao);
    }
    return salvo;
  });
}

function buscarPorId(id) {
  const cartao = cartaoRepository.buscarPorId(id);
  if (!cartao) {
    throw new AppError('Cartão não encontrado', 404);
  }
  return cartao;
}

function listar(usuarioLogado, filtros) {
  return cartaoRepository.listar(idUsuarioDoFiltro(usuarioLogado, filtros.id_usuario));
}

function buscar(usuarioLogado, id) {
  const cartao = buscarPorId(id);
  garantirDono(usuarioLogado, cartao.id_usuario);
  return cartao;
}

function criar(usuarioLogado, dados) {
  const id_usuario = usuarioLogado.id_usuario;
  const cartao = normalizar({ ...selecionarCampos(dados, camposEditaveis), id_usuario });

  if (cartaoRepository.listar(id_usuario).length === 0) {
    cartao.principal = 1;
  }

  return salvar(cartaoRepository.inserir, cartao);
}

function atualizar(usuarioLogado, id, dados) {
  const atual = buscar(usuarioLogado, id);
  const cartao = normalizar({ ...atual, ...selecionarCampos(dados, camposEditaveis) });
  return salvar(cartaoRepository.atualizar, cartao);
}

function remover(usuarioLogado, id) {
  const cartao = buscar(usuarioLogado, id);
  transacao(() => {
    cartaoRepository.remover(id);
    cartaoRepository.promoverPrimeiroPrincipal(cartao.id_usuario);
  });
}

module.exports = { buscarPorId, listar, buscar, criar, atualizar, remover };
