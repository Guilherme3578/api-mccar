const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

const arquivoEnv = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(arquivoEnv)) {
  for (const [chave, valor] of Object.entries(dotenv.parse(fs.readFileSync(arquivoEnv)))) {
    if (chave.startsWith('MP_') && !process.env[chave]) process.env[chave] = valor;
  }
}

const { test } = require('node:test');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const semCredencial = !process.env.MP_ACCESS_TOKEN && 'coloque o Access Token de teste em MP_ACCESS_TOKEN no .env';

function assinaturaDoWebhook(dataId) {
  if (!process.env.MP_WEBHOOK_SECRET) return {};
  const ts = String(Math.floor(Date.now() / 1000));
  const requestId = crypto.randomUUID();
  const hash = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex');
  return { 'x-signature': `ts=${ts},v1=${hash}`, 'x-request-id': requestId };
}

async function webhook(enviar, dataId) {
  const resposta = await enviar('POST', `/pagamentos/mercado-pago/webhook?type=payment&data.id=${dataId}`, {
    headers: { 'Content-Type': 'application/json', ...assinaturaDoWebhook(dataId) },
    body: JSON.stringify({ type: 'payment', action: 'payment.updated', data: { id: dataId } }),
  });
  return { status: resposta.status, corpo: await resposta.json() };
}

test('Mercado Pago de verdade (credencial de teste)', { skip: semCredencial, timeout: 60000 }, async (t) => {
  const { iniciar, etapa, conferir, falhar, enviar, req, cadastrar, rodarSeed, finalizar } = require('../api/apoio');
  await iniciar();
  try {
    rodarSeed();
    const preferencias = new Preference(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN }));

    const ana = await cadastrar('Ana Teste', `ana.${Date.now()}@mccar.com`);
    const end = await req(ana.token, 'POST', '/enderecos', { logradouro: 'Rua das Oficinas', numero: '120', bairro: 'Centro', cidade: 'Santo André', uf: 'SP', cep: '09010000' }, 201, 'endereço');
    const produtos = await req(null, 'GET', '/produtos', null, 200, 'catálogo');
    const filtro = produtos.find((p) => p.codigo === 'MC-019');
    const pastilha = produtos.find((p) => p.codigo === 'MC-006');
    const car = await req(ana.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho');

    etapa('pedido sem cupom: produtos e frete separados');
    await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: filtro.id_produto, quantidade: 2 }, 201, '2 filtros de óleo');
    const pedido = await req(ana.token, 'POST', '/pedidos/checkout', { id_endereco: end.id_endereco }, 201, 'checkout R$ 59,80 + frete');
    const checkout = await req(ana.token, 'POST', '/pagamentos/mercado-pago', { id_pedido: pedido.id_pedido }, 201, 'cria a cobrança no Mercado Pago');
    if (!checkout?.pagamento) return;

    conferir(/^https:\/\/[^/]*mercadopago\.com/.test(checkout.checkout_url ?? ''), 'checkout_url aponta para o Mercado Pago', checkout.checkout_url);
    conferir(checkout.pagamento.status === 'PENDENTE' && checkout.pagamento.metodo === 'MERCADO_PAGO', 'pagamento pendente no Mercado Pago', checkout.pagamento);

    const noMercadoPago = await preferencias.get({ preferenceId: checkout.pagamento.mp_preferencia_id });
    const somaCentavos = Math.round(noMercadoPago.items.reduce((soma, item) => soma + item.unit_price * item.quantity * 100, 0));
    conferir(new RegExp(`^MCCAR-${pedido.id_pedido}-\\d+$`).test(noMercadoPago.external_reference ?? ''), 'a cobrança está ligada ao pedido (external_reference único)', noMercadoPago.external_reference);
    const sincronizadoAntes = await req(ana.token, 'POST', '/pagamentos/mercado-pago/sincronizar', { id_pedido: pedido.id_pedido }, 200, 'sincroniza logo após criar a cobrança');
    conferir(sincronizadoAntes?.status_pedido === 'AGUARDANDO_PAGAMENTO', 'pagamentos antigos de outro banco não marcam este pedido como pago', sincronizadoAntes);
    conferir(somaCentavos === pedido.total_centavos, 'o Mercado Pago vai cobrar exatamente o total do pedido', { somaCentavos, total: pedido.total_centavos });
    conferir(noMercadoPago.items.some((item) => item.title === 'Frete' && item.unit_price === 29.9), 'o frete aparece como item na cobrança', noMercadoPago.items);
    conferir(noMercadoPago.items.some((item) => item.title === 'Filtro de Óleo' && item.quantity === 2), 'os produtos aparecem com a quantidade', noMercadoPago.items);
    conferir(noMercadoPago.payer?.email === ana.email, 'o comprador é o usuário do pedido', noMercadoPago.payer);
    if (process.env.MP_URL_PUBLICA) {
      conferir(noMercadoPago.notification_url?.endsWith('/pagamentos/mercado-pago/webhook'), 'notificação configurada para o webhook da API', noMercadoPago.notification_url);
    }

    etapa('antes de pagar');
    const sincronizado = await req(ana.token, 'POST', '/pagamentos/mercado-pago/sincronizar', { id_pedido: pedido.id_pedido }, 200, 'sincroniza sem pagamento feito');
    conferir(sincronizado?.status_pedido === 'AGUARDANDO_PAGAMENTO' && sincronizado?.pagamento?.status === 'PENDENTE', 'sem pagamento no Mercado Pago, o pedido continua aguardando', sincronizado);
    const novoLink = await req(ana.token, 'POST', '/pagamentos/mercado-pago', { id_pedido: pedido.id_pedido }, 201, 'gera um novo link');
    conferir(novoLink?.pagamento?.mp_preferencia_id !== checkout.pagamento.mp_preferencia_id, 'o novo link é uma nova cobrança', novoLink?.pagamento);
    conferir(novoLink?.pagamento?.id_pagamento === checkout.pagamento.id_pagamento, 'o pagamento continua sendo o mesmo registro', novoLink?.pagamento);

    etapa('pedido com cupom: desconto aplicado na cobrança');
    const bia = await cadastrar('Bia Teste', `bia.${Date.now()}@mccar.com`);
    const endBia = await req(bia.token, 'POST', '/enderecos', { logradouro: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP', cep: '01310100' }, 201, 'endereço da Bia');
    const carBia = await req(bia.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho da Bia');
    await req(bia.token, 'POST', `/carrinhos/${carBia.id_carrinho}/itens`, { id_produto: pastilha.id_produto, quantidade: 1 }, 201, 'pastilha');
    const resumo = await req(bia.token, 'GET', '/carrinhos/meu?cupom=BEMVINDO50', null, 200, 'resumo com BEMVINDO50 na primeira compra');
    if (!resumo?.cupom) return;
    const pedidoComCupom = await req(bia.token, 'POST', '/pedidos/checkout', { id_endereco: endBia.id_endereco, id_cupom: resumo.cupom.id_cupom }, 201, 'checkout com cupom');
    const checkoutComCupom = await req(bia.token, 'POST', '/pagamentos/mercado-pago', { id_pedido: pedidoComCupom.id_pedido }, 201, 'cobrança com cupom');
    const cobrancaComCupom = await preferencias.get({ preferenceId: checkoutComCupom.pagamento.mp_preferencia_id });
    const somaComCupom = Math.round(cobrancaComCupom.items.reduce((soma, item) => soma + item.unit_price * item.quantity * 100, 0));
    conferir(somaComCupom === resumo.total_centavos && somaComCupom === pedidoComCupom.total_centavos, 'com cupom, o Mercado Pago cobra o total com desconto', { somaComCupom, resumo: resumo.total_centavos });

    etapa('webhook com um pagamento que não existe no Mercado Pago');
    const ignorado = await webhook(enviar, '1');
    conferir(ignorado.status === 200 && ignorado.corpo.processado === false, 'o Mercado Pago responde que não existe e a API ignora sem erro', ignorado);

    etapa('credencial inválida');
    const errada = new Preference(new MercadoPagoConfig({ accessToken: 'TEST-credencial-invalida' }));
    try {
      await errada.create({ body: { items: [{ id: 'X', title: 'X', quantity: 1, unit_price: 1, currency_id: 'BRL' }] } });
      falhar('o Mercado Pago aceitou uma credencial inválida');
    } catch (erro) {
      conferir(erro.status === 401 || erro.status === 403 || erro.status === 400, 'o Mercado Pago recusa credencial inválida', erro.status);
    }

    t.diagnostic(`Para testar o pagamento até o fim, abra este link, pague com um cartão de teste e depois chame POST /pagamentos/mercado-pago/sincronizar: ${checkoutComCupom.checkout_url}`);
  } finally {
    finalizar();
  }
});
