const MetodoPagamento = require('../enums/MetodoPagamento');

module.exports = Object.freeze({
  aprovacaoAutomatica: process.env.PAGAMENTO_APROVACAO_AUTOMATICA === 'true',
  metodosAprovadosNaHora: [MetodoPagamento.CARTAO, MetodoPagamento.PIX],
});
