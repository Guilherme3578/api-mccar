const cepService = require('../services/cepService');

async function buscar(req, res) {
  res.json(await cepService.buscar(req.params.cep));
}

module.exports = { buscar };
