const frete = require('../config/frete');

function calcular(resumo, descontoCentavos) {
  if (resumo.quantidade_itens === 0) {
    return { frete_centavos: 0, prazo_min_dias: 0, prazo_max_dias: 0 };
  }

  const valorDosProdutos = resumo.subtotal_centavos - descontoCentavos;
  const diasParaEnvio = Math.ceil(resumo.maior_prazo_envio_horas / 24);

  return {
    frete_centavos: valorDosProdutos >= frete.gratisAcimaCentavos ? 0 : frete.valorPadraoCentavos,
    prazo_min_dias: diasParaEnvio + frete.transporteMinDias,
    prazo_max_dias: diasParaEnvio + frete.transporteMaxDias,
  };
}

module.exports = { calcular };
