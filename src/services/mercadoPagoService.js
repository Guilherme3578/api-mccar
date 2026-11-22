const mercadoPago = require('../integracoes/mercadoPago');
const configMercadoPago = require('../config/mercadoPago');
const pagamentoRepository = require('../repositories/pagamentoRepository');
const pedidoRepository = require('../repositories/pedidoRepository');
const itemPedidoRepository = require('../repositories/itemPedidoRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const pedidoService = require('./pedidoService');
const pagamentoService = require('./pagamentoService');
const StatusPedido = require('../enums/StatusPedido');
const StatusPagamento = require('../enums/StatusPagamento');
const MetodoPagamento = require('../enums/MetodoPagamento');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { exigirCampos, paraId } = require('../utils/validacao');

const STATUS_DO_MERCADO_PAGO = Object.freeze({
  approved: StatusPagamento.APROVADO,
  rejected: StatusPagamento.RECUSADO,
  cancelled: StatusPagamento.RECUSADO,
  refunded: StatusPagamento.ESTORNADO,
  charged_back: StatusPagamento.ESTORNADO,
});

const TIPOS_DE_CARTAO = ['credit_card', 'debit_card', 'prepaid_card'];

function paraReais(centavos) {
  return centavos / 100;
}

function statusDoMercadoPago(status) {
  return STATUS_DO_MERCADO_PAGO[status] ?? StatusPagamento.PENDENTE;
}

function metodoDoMercadoPago(pagamentoMp) {
  if (TIPOS_DE_CARTAO.includes(pagamentoMp.payment_type_id)) return MetodoPagamento.CARTAO;
  if (pagamentoMp.payment_method_id === 'pix' || pagamentoMp.payment_type_id === 'bank_transfer') return MetodoPagamento.PIX;
  if (pagamentoMp.payment_type_id === 'ticket') return MetodoPagamento.BOLETO;
  return MetodoPagamento.MERCADO_PAGO;
}

function itensDaPreferencia(pedido, itens) {
  const itensMp =
    pedido.desconto_centavos > 0
      ? [
          {
            id: pedido.numero,
            title: `Pedido ${pedido.numero} (com desconto do cupom)`,
            quantity: 1,
            unit_price: paraReais(pedido.subtotal_centavos - pedido.desconto_centavos),
            currency_id: 'BRL',
          },
        ]
      : itens.map((item) => ({
          id: item.codigo_produto,
          title: item.nome_produto,
          quantity: item.quantidade,
          unit_price: paraReais(item.preco_unitario_centavos),
          currency_id: 'BRL',
        }));

  if (pedido.frete_centavos > 0) {
    itensMp.push({ id: 'FRETE', title: 'Frete', quantity: 1, unit_price: paraReais(pedido.frete_centavos), currency_id: 'BRL' });
  }
  return itensMp;
}

function montarPreferencia(pedido, itens, comprador) {
  const corpo = {
    items: itensDaPreferencia(pedido, itens),
    external_reference: referenciaDoPedido(pedido),
    payer: { name: comprador.nome, email: comprador.email },
    statement_descriptor: configMercadoPago.nomeNaFatura,
    metadata: { numero_pedido: pedido.numero },
  };

  if (configMercadoPago.urlPublica) {
    corpo.notification_url = `${configMercadoPago.urlPublica}/pagamentos/mercado-pago/webhook`;
  }
  if (configMercadoPago.urlRetorno) {
    const retorno = (situacao) => `${configMercadoPago.urlRetorno}?pedido=${pedido.id_pedido}&situacao=${situacao}`;
    corpo.back_urls = { success: retorno('aprovado'), pending: retorno('pendente'), failure: retorno('recusado') };
    corpo.auto_return = 'approved';
  }
  return corpo;
}

function garantirQuePodePagar(pedido, pagamentoAtual) {
  if (pedido.status !== StatusPedido.AGUARDANDO_PAGAMENTO) {
    throw new AppError('O pedido precisa estar com status AGUARDANDO_PAGAMENTO', 400);
  }
  if (pedido.total_centavos <= 0) {
    throw new AppError('Este pedido não tem valor a pagar', 400);
  }
  if (!pagamentoAtual || pagamentoAtual.status === StatusPagamento.RECUSADO) return;
  if (pagamentoAtual.status === StatusPagamento.PENDENTE && pagamentoAtual.mp_preferencia_id) return;
  throw new AppError(`Este pedido já possui um pagamento com status ${pagamentoAtual.status}`, 409);
}

async function iniciarCheckout(usuarioLogado, dados) {
  exigirCampos(dados, ['id_pedido']);
  const pedido = pedidoService.buscar(usuarioLogado, paraId(dados.id_pedido, 'id_pedido'));
  garantirQuePodePagar(pedido, pagamentoRepository.buscarPorPedido(pedido.id_pedido));

  const comprador = usuarioRepository.buscarPorId(pedido.id_usuario);
  const itens = itemPedidoRepository.listar(pedido.id_pedido);
  const preferencia = await mercadoPago.criarPreferencia(montarPreferencia(pedido, itens, comprador));

  const pagamento = transacao(() => {
    const atual = pagamentoRepository.buscarPorPedido(pedido.id_pedido);
    garantirQuePodePagar(pedidoService.buscarPorId(pedido.id_pedido), atual);

    const dadosDoPagamento = {
      id_pedido: pedido.id_pedido,
      id_usuario: pedido.id_usuario,
      id_cartao: null,
      metodo: MetodoPagamento.MERCADO_PAGO,
      valor_centavos: pedido.total_centavos,
      cartao_bandeira: null,
      cartao_final: null,
      mp_preferencia_id: preferencia.id,
    };
    return atual
      ? pagamentoRepository.reabrir({ ...dadosDoPagamento, id_pagamento: atual.id_pagamento })
      : pagamentoRepository.inserir(dadosDoPagamento);
  });

  return {
    pagamento,
    checkout_url: preferencia.init_point,
    sandbox_checkout_url: preferencia.sandbox_init_point ?? null,
  };
}

function referenciaDoPedido(pedido) {
  return `MCCAR-${pedido.id_pedido}-${Date.parse(pedido.criado_em) / 1000}`;
}

function pedidoDaReferencia(referencia) {
  const encontrada = /^MCCAR-(\d+)-\d+$/.exec(String(referencia ?? ''));
  if (!encontrada) return null;
  const pedido = pedidoRepository.buscarPorId(Number(encontrada[1]));
  return pedido && referenciaDoPedido(pedido) === referencia ? pedido : null;
}

function aplicarPagamentoMercadoPago(pagamentoMp) {
  const pedido = pedidoDaReferencia(pagamentoMp.external_reference);
  if (!pedido) return null;

  const idPedido = pedido.id_pedido;
  const pagamento = pagamentoRepository.buscarPorPedido(idPedido);
  if (!pagamento || !pagamento.mp_preferencia_id) return null;

  const idMp = String(pagamentoMp.id);
  const novoStatus = statusDoMercadoPago(pagamentoMp.status);

  if (pagamento.status === StatusPagamento.APROVADO && pagamento.mp_pagamento_id && pagamento.mp_pagamento_id !== idMp) {
    return pagamento;
  }
  if (novoStatus === StatusPagamento.APROVADO && Math.round(Number(pagamentoMp.transaction_amount) * 100) < pagamento.valor_centavos) {
    console.warn(`Pagamento ${idMp} do Mercado Pago com valor menor que o pedido ${idPedido}: ignorado`);
    return pagamento;
  }

  return transacao(() => {
    let atual = pagamento;
    if (atual.status === StatusPagamento.RECUSADO && novoStatus !== StatusPagamento.RECUSADO) {
      atual = pagamentoRepository.reabrir(atual);
    }

    const registrado = pagamentoRepository.registrarMercadoPago({
      id_pagamento: atual.id_pagamento,
      mp_pagamento_id: idMp,
      metodo: metodoDoMercadoPago(pagamentoMp),
      cartao_bandeira: pagamentoMp.card?.last_four_digits ? String(pagamentoMp.payment_method_id).toUpperCase() : null,
      cartao_final: pagamentoMp.card?.last_four_digits ?? null,
    });

    if (registrado.status === novoStatus) return registrado;
    try {
      return pagamentoService.atualizar(registrado.id_pagamento, { status: novoStatus });
    } catch (erro) {
      if (!(erro instanceof AppError)) throw erro;
      console.warn(`Pagamento ${idMp} do Mercado Pago não aplicado ao pedido ${idPedido}: ${erro.message}`);
      return registrado;
    }
  });
}

async function sincronizar(usuarioLogado, dados) {
  exigirCampos(dados, ['id_pedido']);
  const pedido = pedidoService.buscar(usuarioLogado, paraId(dados.id_pedido, 'id_pedido'));
  const pagamento = pagamentoRepository.buscarPorPedido(pedido.id_pedido);
  if (!pagamento || !pagamento.mp_preferencia_id) {
    throw new AppError('Este pedido não tem pagamento pelo Mercado Pago', 404);
  }

  const pagamentosMp = await mercadoPago.buscarPagamentosDoPedido(referenciaDoPedido(pedido));
  const escolhido = pagamentosMp.find((p) => p.status === 'approved') ?? pagamentosMp[0];
  const atualizado = escolhido ? aplicarPagamentoMercadoPago(escolhido) ?? pagamento : pagamento;

  return { pagamento: atualizado, status_pedido: pedidoService.buscarPorId(pedido.id_pedido).status };
}

async function receberNotificacao({ headers, query, body }) {
  const tipo = query.type ?? query.topic ?? body?.type;
  const idMp = query['data.id'] ?? body?.data?.id;
  if (tipo !== 'payment' || !idMp) return { processado: false };

  if (!mercadoPago.assinaturaValida({ xSignature: headers['x-signature'], xRequestId: headers['x-request-id'], dataId: String(idMp) })) {
    throw new AppError('Assinatura do webhook inválida', 401);
  }

  const pagamentoMp = await mercadoPago.buscarPagamento(idMp);
  if (!pagamentoMp) return { processado: false };

  return { processado: aplicarPagamentoMercadoPago(pagamentoMp) !== null };
}

module.exports = {
  statusDoMercadoPago,
  metodoDoMercadoPago,
  montarPreferencia,
  referenciaDoPedido,
  iniciarCheckout,
  aplicarPagamentoMercadoPago,
  sincronizar,
  receberNotificacao,
};
