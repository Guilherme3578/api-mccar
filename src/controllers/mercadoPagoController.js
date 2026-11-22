const mercadoPagoService = require('../services/mercadoPagoService');

async function iniciarCheckout(req, res) {
  res.status(201).json(await mercadoPagoService.iniciarCheckout(req.usuario, req.body));
}

async function sincronizar(req, res) {
  res.json(await mercadoPagoService.sincronizar(req.usuario, req.body));
}

async function receberNotificacao(req, res) {
  res.status(200).json(await mercadoPagoService.receberNotificacao(req));
}

module.exports = { iniciarCheckout, sincronizar, receberNotificacao };
