const { describe, test, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { cenarioDeCompra, encerrar } = require('./ambiente');
const AppError = require('../../src/utils/AppError');
const mercadoPago = require('../../src/integracoes/mercadoPago');
const mercadoPagoService = require('../../src/services/mercadoPagoService');
const pedidoService = require('../../src/services/pedidoService');
const pagamentoService = require('../../src/services/pagamentoService');
const cupomService = require('../../src/services/cupomService');
const carrinhoService = require('../../src/services/carrinhoService');

after(encerrar);

cupomService.garantirCupomBoasVindas();

const comStatus = (status) => (erro) => erro instanceof AppError && erro.status === status;
const somaDosItens = (itens) => Math.round(itens.reduce((soma, item) => soma + item.unit_price * item.quantity * 100, 0));

let preferenciasCriadas;
let pagamentosNoMercadoPago;

beforeEach(() => {
  mock.restoreAll();
  preferenciasCriadas = [];
  pagamentosNoMercadoPago = new Map();
  mock.method(mercadoPago, 'criarPreferencia', async (corpo) => {
    preferenciasCriadas.push(corpo);
    const id = `pref-${preferenciasCriadas.length}`;
    return { id, init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${id}` };
  });
  mock.method(mercadoPago, 'buscarPagamento', async (id) => pagamentosNoMercadoPago.get(String(id)) ?? null);
  mock.method(mercadoPago, 'buscarPagamentosDoPedido', async (referencia) =>
    [...pagamentosNoMercadoPago.values()].filter((p) => p.external_reference === referencia).reverse()
  );
});

function pagamentoMp(id, pedido, status, extra = {}) {
  const pagamento = {
    id,
    status,
    external_reference: mercadoPagoService.referenciaDoPedido(pedido),
    transaction_amount: pedido.total_centavos / 100,
    payment_type_id: 'credit_card',
    payment_method_id: 'visa',
    card: { last_four_digits: '1234' },
    ...extra,
  };
  pagamentosNoMercadoPago.set(String(id), pagamento);
  return pagamento;
}

async function pedidoComCheckout(opcoes) {
  const { usuario, endereco } = cenarioDeCompra(opcoes);
  const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco, id_cupom: opcoes?.idCupom });
  const checkout = await mercadoPagoService.iniciarCheckout(usuario, { id_pedido: pedido.id_pedido });
  return { usuario, pedido, checkout };
}

describe('tradução dos dados do Mercado Pago', () => {
  test('status do Mercado Pago para o status do pagamento', () => {
    const esperado = { approved: 'APROVADO', rejected: 'RECUSADO', cancelled: 'RECUSADO', refunded: 'ESTORNADO', charged_back: 'ESTORNADO', pending: 'PENDENTE', in_process: 'PENDENTE', authorized: 'PENDENTE' };
    for (const [mp, nosso] of Object.entries(esperado)) assert.strictEqual(mercadoPagoService.statusDoMercadoPago(mp), nosso, mp);
  });

  test('forma de pagamento do Mercado Pago para o método do pedido', () => {
    assert.strictEqual(mercadoPagoService.metodoDoMercadoPago({ payment_type_id: 'credit_card' }), 'CARTAO');
    assert.strictEqual(mercadoPagoService.metodoDoMercadoPago({ payment_type_id: 'debit_card' }), 'CARTAO');
    assert.strictEqual(mercadoPagoService.metodoDoMercadoPago({ payment_type_id: 'bank_transfer', payment_method_id: 'pix' }), 'PIX');
    assert.strictEqual(mercadoPagoService.metodoDoMercadoPago({ payment_type_id: 'ticket', payment_method_id: 'bolbradesco' }), 'BOLETO');
    assert.strictEqual(mercadoPagoService.metodoDoMercadoPago({ payment_type_id: 'account_money' }), 'MERCADO_PAGO');
  });
});

describe('montarPreferencia', () => {
  const comprador = { nome: 'Ana', email: 'ana@teste.com' };

  test('lista os produtos, cobra o frete e soma exatamente o total do pedido', () => {
    const pedido = { id_pedido: 7, numero: 'MC-12345', criado_em: '2026-11-22T14:30:00Z', subtotal_centavos: 5980, desconto_centavos: 0, frete_centavos: 2990, total_centavos: 8970 };
    const itens = [{ codigo_produto: 'MC-019', nome_produto: 'Filtro de Óleo', quantidade: 2, preco_unitario_centavos: 2990 }];
    const corpo = mercadoPagoService.montarPreferencia(pedido, itens, comprador);

    assert.deepStrictEqual(corpo.items[0], { id: 'MC-019', title: 'Filtro de Óleo', quantity: 2, unit_price: 29.9, currency_id: 'BRL' });
    assert.deepStrictEqual(corpo.items[1], { id: 'FRETE', title: 'Frete', quantity: 1, unit_price: 29.9, currency_id: 'BRL' });
    assert.strictEqual(somaDosItens(corpo.items), pedido.total_centavos);
    assert.strictEqual(corpo.external_reference, 'MCCAR-7-1795357800');
    assert.deepStrictEqual(corpo.payer, { name: 'Ana', email: 'ana@teste.com' });
  });

  test('com cupom, junta os produtos num item com o desconto aplicado', () => {
    const pedido = { id_pedido: 8, numero: 'MC-22222', criado_em: '2026-11-22T14:30:00Z', subtotal_centavos: 73960, desconto_centavos: 36980, frete_centavos: 0, total_centavos: 36980 };
    const corpo = mercadoPagoService.montarPreferencia(pedido, [], comprador);
    assert.strictEqual(corpo.items.length, 1);
    assert.strictEqual(corpo.items[0].unit_price, 369.8);
    assert.strictEqual(somaDosItens(corpo.items), pedido.total_centavos);
  });

  test('usa as URLs do .env para a notificação e o retorno ao app', () => {
    const corpo = mercadoPagoService.montarPreferencia({ id_pedido: 9, numero: 'MC-1', criado_em: '2026-11-22T14:30:00Z', subtotal_centavos: 100, desconto_centavos: 0, frete_centavos: 0, total_centavos: 100 }, [], comprador);
    assert.strictEqual(corpo.notification_url, 'https://api.mccar.test/pagamentos/mercado-pago/webhook');
    assert.strictEqual(corpo.back_urls.success, 'mccar://pagamento?pedido=9&situacao=aprovado');
    assert.strictEqual(corpo.auto_return, 'approved');
  });
});

describe('iniciarCheckout', () => {
  test('cria a preferência e registra o pagamento pendente', async () => {
    const { pedido, checkout } = await pedidoComCheckout();
    assert.strictEqual(checkout.pagamento.status, 'PENDENTE');
    assert.strictEqual(checkout.pagamento.metodo, 'MERCADO_PAGO');
    assert.strictEqual(checkout.pagamento.mp_preferencia_id, 'pref-1');
    assert.strictEqual(checkout.pagamento.valor_centavos, pedido.total_centavos);
    assert.match(checkout.checkout_url, /pref_id=pref-1/);
  });

  test('pode gerar um novo link enquanto o pagamento está pendente', async () => {
    const { usuario, pedido, checkout } = await pedidoComCheckout();
    const novo = await mercadoPagoService.iniciarCheckout(usuario, { id_pedido: pedido.id_pedido });
    assert.strictEqual(novo.pagamento.id_pagamento, checkout.pagamento.id_pagamento);
    assert.strictEqual(novo.pagamento.mp_preferencia_id, 'pref-2');
  });

  test('não abre checkout de pedido de outro usuário', async () => {
    const { pedido } = await pedidoComCheckout();
    const intruso = cenarioDeCompra().usuario;
    await assert.rejects(mercadoPagoService.iniciarCheckout(intruso, { id_pedido: pedido.id_pedido }), comStatus(403));
  });

  test('não abre checkout de pedido já pago', async () => {
    const { usuario, pedido } = await pedidoComCheckout();
    pagamentoMp(9001, pedido, 'approved');
    await mercadoPagoService.receberNotificacao({ headers: assinatura('9001'), query: { type: 'payment', 'data.id': '9001' }, body: {} });
    await assert.rejects(mercadoPagoService.iniciarCheckout(usuario, { id_pedido: pedido.id_pedido }), comStatus(400));
  });

  test('pagamento simulado pendente bloqueia o Mercado Pago', async () => {
    const { usuario, endereco } = cenarioDeCompra();
    const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco });
    pagamentoService.criar(usuario, { id_pedido: pedido.id_pedido, metodo: 'BOLETO' });
    await assert.rejects(mercadoPagoService.iniciarCheckout(usuario, { id_pedido: pedido.id_pedido }), comStatus(409));
  });
});

function assinatura(dataId, segredo = process.env.MP_WEBHOOK_SECRET) {
  const ts = String(Math.floor(Date.now() / 1000));
  const requestId = crypto.randomUUID();
  const hash = crypto.createHmac('sha256', segredo).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex');
  return { 'x-signature': `ts=${ts},v1=${hash}`, 'x-request-id': requestId };
}

describe('webhook', () => {
  test('pagamento aprovado marca o pedido como PAGO e guarda o cartão', async () => {
    const { pedido } = await pedidoComCheckout();
    pagamentoMp(1001, pedido, 'approved');
    const resposta = await mercadoPagoService.receberNotificacao({ headers: assinatura('1001'), query: { type: 'payment', 'data.id': '1001' }, body: {} });

    assert.deepStrictEqual(resposta, { processado: true });
    const atualizado = pedidoService.detalhar({ perfil: 'ADMIN' }, pedido.id_pedido);
    assert.strictEqual(atualizado.status, 'PAGO');
    assert.strictEqual(atualizado.pagamento.status, 'APROVADO');
    assert.strictEqual(atualizado.pagamento.metodo, 'CARTAO');
    assert.strictEqual(atualizado.pagamento.cartao_final, '1234');
    assert.strictEqual(atualizado.pagamento.mp_pagamento_id, '1001');
  });

  test('assinatura inválida é recusada com 401 e não altera nada', async () => {
    const { pedido } = await pedidoComCheckout();
    pagamentoMp(1002, pedido, 'approved');
    await assert.rejects(
      mercadoPagoService.receberNotificacao({ headers: assinatura('1002', 'segredo-errado'), query: { type: 'payment', 'data.id': '1002' }, body: {} }),
      comStatus(401)
    );
    assert.strictEqual(pedidoService.buscarPorId(pedido.id_pedido).status, 'AGUARDANDO_PAGAMENTO');
  });

  test('a mesma notificação repetida não muda o resultado', async () => {
    const { pedido } = await pedidoComCheckout();
    pagamentoMp(1003, pedido, 'approved');
    const notificacao = () => mercadoPagoService.receberNotificacao({ headers: assinatura('1003'), query: { type: 'payment', 'data.id': '1003' }, body: {} });
    await notificacao();
    await notificacao();
    assert.strictEqual(pedidoService.buscarPorId(pedido.id_pedido).status, 'PAGO');
  });

  test('outros tipos de notificação e pagamentos inexistentes são ignorados', async () => {
    assert.deepStrictEqual(await mercadoPagoService.receberNotificacao({ headers: {}, query: { type: 'merchant_order', 'data.id': '1' }, body: {} }), { processado: false });
    assert.deepStrictEqual(await mercadoPagoService.receberNotificacao({ headers: assinatura('404404'), query: { type: 'payment', 'data.id': '404404' }, body: {} }), { processado: false });
  });

  test('pagamento com valor menor que o pedido não aprova', async (t) => {
    t.mock.method(console, 'warn', () => {});
    const { pedido } = await pedidoComCheckout();
    pagamentoMp(1004, pedido, 'approved', { transaction_amount: 1 });
    await mercadoPagoService.receberNotificacao({ headers: assinatura('1004'), query: { type: 'payment', 'data.id': '1004' }, body: {} });
    assert.strictEqual(pedidoService.buscarPorId(pedido.id_pedido).status, 'AGUARDANDO_PAGAMENTO');
  });

  test('recusado e depois aprovado no mesmo checkout termina PAGO', async () => {
    const { pedido } = await pedidoComCheckout();
    pagamentoMp(1005, pedido, 'rejected');
    await mercadoPagoService.receberNotificacao({ headers: assinatura('1005'), query: { type: 'payment', 'data.id': '1005' }, body: {} });
    assert.strictEqual(pedidoService.detalhar({ perfil: 'ADMIN' }, pedido.id_pedido).pagamento.status, 'RECUSADO');

    pagamentoMp(1006, pedido, 'approved', { payment_type_id: 'bank_transfer', payment_method_id: 'pix', card: undefined });
    await mercadoPagoService.receberNotificacao({ headers: assinatura('1006'), query: { type: 'payment', 'data.id': '1006' }, body: {} });
    const final = pedidoService.detalhar({ perfil: 'ADMIN' }, pedido.id_pedido);
    assert.strictEqual(final.status, 'PAGO');
    assert.strictEqual(final.pagamento.metodo, 'PIX');
  });

  test('notificação atrasada de uma tentativa recusada não desfaz a aprovação', async () => {
    const { pedido } = await pedidoComCheckout();
    pagamentoMp(1007, pedido, 'approved');
    await mercadoPagoService.receberNotificacao({ headers: assinatura('1007'), query: { type: 'payment', 'data.id': '1007' }, body: {} });
    pagamentoMp(1008, pedido, 'rejected');
    await mercadoPagoService.receberNotificacao({ headers: assinatura('1008'), query: { type: 'payment', 'data.id': '1008' }, body: {} });
    assert.strictEqual(pedidoService.detalhar({ perfil: 'ADMIN' }, pedido.id_pedido).pagamento.status, 'APROVADO');
  });

  test('estorno no Mercado Pago cancela o pedido', async () => {
    const { pedido } = await pedidoComCheckout();
    pagamentoMp(1009, pedido, 'approved');
    await mercadoPagoService.receberNotificacao({ headers: assinatura('1009'), query: { type: 'payment', 'data.id': '1009' }, body: {} });
    pagamentoMp(1009, pedido, 'refunded');
    await mercadoPagoService.receberNotificacao({ headers: assinatura('1009'), query: { type: 'payment', 'data.id': '1009' }, body: {} });
    const final = pedidoService.detalhar({ perfil: 'ADMIN' }, pedido.id_pedido);
    assert.strictEqual(final.pagamento.status, 'ESTORNADO');
    assert.strictEqual(final.status, 'CANCELADO');
  });
});

describe('sincronizar (quando o app volta do checkout)', () => {
  test('busca o pagamento no Mercado Pago e atualiza o pedido', async () => {
    const { usuario, pedido } = await pedidoComCheckout();
    pagamentoMp(2001, pedido, 'approved', { payment_type_id: 'ticket', payment_method_id: 'bolbradesco', card: undefined });
    const resultado = await mercadoPagoService.sincronizar(usuario, { id_pedido: pedido.id_pedido });
    assert.strictEqual(resultado.status_pedido, 'PAGO');
    assert.strictEqual(resultado.pagamento.metodo, 'BOLETO');
  });

  test('prefere a tentativa aprovada quando há várias', async () => {
    const { usuario, pedido } = await pedidoComCheckout();
    pagamentoMp(2002, pedido, 'approved');
    pagamentoMp(2003, pedido, 'rejected');
    assert.strictEqual((await mercadoPagoService.sincronizar(usuario, { id_pedido: pedido.id_pedido })).status_pedido, 'PAGO');
  });

  test('sem pagamento no Mercado Pago, continua pendente', async () => {
    const { usuario, pedido } = await pedidoComCheckout();
    const resultado = await mercadoPagoService.sincronizar(usuario, { id_pedido: pedido.id_pedido });
    assert.strictEqual(resultado.pagamento.status, 'PENDENTE');
    assert.strictEqual(resultado.status_pedido, 'AGUARDANDO_PAGAMENTO');
  });

  test('pedido sem checkout do Mercado Pago devolve 404', async () => {
    const { usuario, endereco } = cenarioDeCompra();
    const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco });
    await assert.rejects(mercadoPagoService.sincronizar(usuario, { id_pedido: pedido.id_pedido }), comStatus(404));
  });
});

describe('identificação do pedido no Mercado Pago', () => {
  test('a referência junta o número do pedido e o momento em que ele foi criado', () => {
    assert.strictEqual(mercadoPagoService.referenciaDoPedido({ id_pedido: 1, criado_em: '2026-11-22T14:30:00Z' }), 'MCCAR-1-1795357800');
    assert.notStrictEqual(
      mercadoPagoService.referenciaDoPedido({ id_pedido: 1, criado_em: '2026-11-22T14:30:00Z' }),
      mercadoPagoService.referenciaDoPedido({ id_pedido: 1, criado_em: '2026-11-22T14:30:01Z' })
    );
  });

  test('pagamento de outro banco com o mesmo número de pedido não aprova o pedido (bug de 22/11)', async () => {
    const { usuario, pedido } = await pedidoComCheckout();
    const deOutroBanco = { ...pedido, criado_em: '2026-11-01T10:00:00Z' };
    pagamentosNoMercadoPago.set('3001', { id: 3001, status: 'approved', external_reference: mercadoPagoService.referenciaDoPedido(deOutroBanco), transaction_amount: 999, payment_type_id: 'credit_card', payment_method_id: 'master', card: { last_four_digits: '3311' } });
    pagamentosNoMercadoPago.set('3002', { id: 3002, status: 'approved', external_reference: String(pedido.id_pedido), transaction_amount: 999, payment_type_id: 'credit_card', payment_method_id: 'master', card: { last_four_digits: '3311' } });

    assert.deepStrictEqual(await mercadoPagoService.receberNotificacao({ headers: assinatura('3001'), query: { type: 'payment', 'data.id': '3001' }, body: {} }), { processado: false });
    assert.deepStrictEqual(await mercadoPagoService.receberNotificacao({ headers: assinatura('3002'), query: { type: 'payment', 'data.id': '3002' }, body: {} }), { processado: false });
    const resultado = await mercadoPagoService.sincronizar(usuario, { id_pedido: pedido.id_pedido });
    assert.strictEqual(resultado.status_pedido, 'AGUARDANDO_PAGAMENTO');
    assert.strictEqual(resultado.pagamento.status, 'PENDENTE');
  });

  test('a cobrança enviada usa a referência do pedido', async () => {
    const { pedido } = await pedidoComCheckout();
    assert.strictEqual(preferenciasCriadas.at(-1).external_reference, mercadoPagoService.referenciaDoPedido(pedido));
  });
});

describe('integração sem credencial', () => {
  test('sem MP_ACCESS_TOKEN, avisa com 503 em vez de quebrar', async () => {
    mock.restoreAll();
    await assert.rejects(mercadoPago.criarPreferencia({ items: [] }), comStatus(503));
  });
});

test('o resumo do carrinho continua igual ao valor cobrado no Mercado Pago', async () => {
  const { usuario, endereco, carrinho } = cenarioDeCompra({ precoCentavos: 12990, quantidade: 2 });
  const resumo = carrinhoService.detalhar(usuario, carrinho.id_carrinho, 'BEMVINDO50');
  const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco, id_cupom: resumo.cupom.id_cupom });
  await mercadoPagoService.iniciarCheckout(usuario, { id_pedido: pedido.id_pedido });
  assert.strictEqual(somaDosItens(preferenciasCriadas.at(-1).items), resumo.total_centavos);
});
