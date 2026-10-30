function inteiroDoAmbiente(nome, padrao) {
  const valor = process.env[nome];
  return valor === undefined || valor === '' ? padrao : Number(valor);
}

module.exports = Object.freeze({
  valorPadraoCentavos: inteiroDoAmbiente('FRETE_PADRAO_CENTAVOS', 2990),
  transporteMinDias: inteiroDoAmbiente('FRETE_TRANSPORTE_MIN_DIAS', 2),
  transporteMaxDias: inteiroDoAmbiente('FRETE_TRANSPORTE_MAX_DIAS', 7),
});
