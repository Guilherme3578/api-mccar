const {
  MercadoPagoConfig,
  Preference,
  Payment,
  MPAuthenticationError,
  MPNotFoundError,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} = require('mercadopago');
const config = require('../config/mercadoPago');
const AppError = require('../utils/AppError');

let cliente = null;

function obterCliente() {
  if (!config.accessToken) {
    throw new AppError('Mercado Pago não configurado: defina MP_ACCESS_TOKEN no .env', 503);
  }
  cliente ??= new MercadoPagoConfig({ accessToken: config.accessToken, options: { timeout: 10000 } });
  return cliente;
}

async function chamar(operacao) {
  const mp = obterCliente();
  try {
    return await operacao(mp);
  } catch (erro) {
    if (erro instanceof MPNotFoundError) return null;
    if (erro instanceof MPAuthenticationError) {
      throw new AppError('Credencial do Mercado Pago inválida: confira o MP_ACCESS_TOKEN no .env', 503);
    }
    console.error('Erro na API do Mercado Pago:', erro.message, erro.causes ?? '');
    throw new AppError('Não foi possível falar com o Mercado Pago. Tente novamente em instantes', 502);
  }
}

function criarPreferencia(corpo) {
  return chamar((mp) => new Preference(mp).create({ body: corpo }));
}

function buscarPagamento(id) {
  return chamar((mp) => new Payment(mp).get({ id }));
}

async function buscarPagamentosDoPedido(referencia) {
  const resultado = await chamar((mp) =>
    new Payment(mp).search({ options: { external_reference: referencia, sort: 'date_last_updated', criteria: 'desc' } })
  );
  return resultado?.results ?? [];
}

function assinaturaValida({ xSignature, xRequestId, dataId }) {
  if (!config.segredoWebhook) return true;
  try {
    WebhookSignatureValidator.validate({ xSignature, xRequestId, dataId, secret: config.segredoWebhook, toleranceSeconds: 300 });
    return true;
  } catch (erro) {
    if (erro instanceof InvalidWebhookSignatureError) return false;
    throw erro;
  }
}

module.exports = { criarPreferencia, buscarPagamento, buscarPagamentosDoPedido, assinaturaValida };
