const frete = require('../config/frete');

function temFreteGratis(resumo) {
  const todosOferecemFreteGratis = resumo.menor_limite_frete_gratis_centavos > 0;
  return todosOferecemFreteGratis && resumo.subtotal_centavos >= resumo.maior_limite_frete_gratis_centavos;
}

function calcular(resumo) {
  if (resumo.quantidade_itens === 0) {
    return { frete_centavos: 0, prazo_min_dias: 0, prazo_max_dias: 0 };
  }

  const diasParaEnvio = Math.ceil(resumo.maior_prazo_envio_horas / 24);

  return {
    frete_centavos: temFreteGratis(resumo) ? 0 : frete.valorPadraoCentavos,
    prazo_min_dias: diasParaEnvio + frete.transporteMinDias,
    prazo_max_dias: diasParaEnvio + frete.transporteMaxDias,
  };
}

module.exports = { calcular };
