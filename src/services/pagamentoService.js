const pagamentoRepository = require('../repositories/pagamentoRepository');
const pedidoService = require('./pedidoService');
const cartaoService = require('./cartaoService');
const StatusPagamento = require('../enums/StatusPagamento');
const StatusPedido = require('../enums/StatusPedido');
const MetodoPagamento = require('../enums/MetodoPagamento');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { garantirDono, idUsuarioDoFiltro } = require('../utils/acesso');
const { exigirCampos, paraId, paraIdOpcional, paraOpcao } = require('../utils/validacao');

const TRANSICOES = Object.freeze({
  [StatusPagamento.PENDENTE]: [StatusPagamento.APROVADO, StatusPagamento.RECUSADO],
  [StatusPagamento.APROVADO]: [StatusPagamento.ESTORNADO],
  [StatusPagamento.RECUSADO]: [],
  [StatusPagamento.ESTORNADO]: [],
});

const STATUS_REMOVIVEIS = [StatusPagamento.PENDENTE, StatusPagamento.RECUSADO];

function listar(usuarioLogado, filtros) {
  return pagamentoRepository.listar({
    id_usuario: idUsuarioDoFiltro(usuarioLogado, filtros.id_usuario),
    id_pedido: paraIdOpcional(filtros.id_pedido, 'id_pedido'),
  });
}

function buscarPorId(id) {
  const pagamento = pagamentoRepository.buscarPorId(id);
  if (!pagamento) {
    throw new AppError('Pagamento não encontrado', 404);
  }
  return pagamento;
}

function buscar(usuarioLogado, id) {
  const pagamento = buscarPorId(id);
  garantirDono(usuarioLogado, pagamento.id_usuario);
  return pagamento;
}

function dadosDoCartao(metodo, idCartao, idUsuario) {
  if (metodo !== MetodoPagamento.CARTAO) {
    return { id_cartao: null, cartao_bandeira: null, cartao_final: null };
  }

  const cartao = cartaoService.buscarPorId(paraId(idCartao, 'id_cartao'));
  if (cartao.id_usuario !== idUsuario) {
    throw new AppError('O cartão não pertence ao usuário do pedido', 403);
  }

  return { id_cartao: cartao.id_cartao, cartao_bandeira: cartao.bandeira, cartao_final: cartao.ultimos_quatro };
}

function criar(usuarioLogado, dados) {
  exigirCampos(dados, ['id_pedido', 'metodo']);
  const pedido = pedidoService.buscar(usuarioLogado, paraId(dados.id_pedido, 'id_pedido'));
  const metodo = paraOpcao(dados.metodo, MetodoPagamento, 'metodo');

  if (pedido.status !== StatusPedido.AGUARDANDO_PAGAMENTO) {
    throw new AppError('O pedido precisa estar com status AGUARDANDO_PAGAMENTO', 400);
  }
  if (metodo === MetodoPagamento.CARTAO) {
    exigirCampos(dados, ['id_cartao']);
  }

  const pagamento = {
    id_pedido: pedido.id_pedido,
    id_usuario: pedido.id_usuario,
    metodo,
    valor_centavos: pedido.total_centavos,
    ...dadosDoCartao(metodo, dados.id_cartao, pedido.id_usuario),
  };

  const existente = pagamentoRepository.buscarPorPedido(pedido.id_pedido);
  if (!existente) {
    return pagamentoRepository.inserir(pagamento);
  }
  if (existente.status !== StatusPagamento.RECUSADO) {
    throw new AppError(`Este pedido já possui um pagamento com status ${existente.status}`, 409);
  }

  return pagamentoRepository.reabrir({ ...pagamento, id_pagamento: existente.id_pagamento });
}

function atualizar(id, dados) {
  const atual = buscarPorId(id);
  exigirCampos(dados, ['status']);
  const status = paraOpcao(dados.status, StatusPagamento, 'status');

  if (status === atual.status) {
    return atual;
  }
  if (!TRANSICOES[atual.status].includes(status)) {
    throw new AppError(`Não é possível alterar o pagamento de ${atual.status} para ${status}`, 400);
  }

  return transacao(() => {
    if (status === StatusPagamento.APROVADO) {
      pedidoService.marcarComoPago(atual.id_pedido);
    }
    if (status === StatusPagamento.ESTORNADO) {
      pedidoService.cancelarPorEstorno(atual.id_pedido);
    }
    return pagamentoRepository.atualizarStatus(id, status);
  });
}

function remover(id) {
  const pagamento = buscarPorId(id);
  if (!STATUS_REMOVIVEIS.includes(pagamento.status)) {
    throw new AppError(`Pagamento ${pagamento.status} não pode ser excluído, ele faz parte do histórico do pedido`, 400);
  }
  pagamentoRepository.remover(id);
}

module.exports = { listar, buscar, criar, atualizar, remover };
