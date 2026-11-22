const viaCep = require('../integracoes/viaCep');
const AppError = require('../utils/AppError');

function normalizarCep(cep) {
  const digitos = String(cep ?? '').replace(/\D/g, '');
  if (digitos.length !== 8) {
    throw new AppError('CEP deve ter 8 dígitos', 400);
  }
  return digitos;
}

async function buscar(cepInformado) {
  const cep = normalizarCep(cepInformado);
  const endereco = await viaCep.buscarCep(cep);
  if (!endereco) {
    throw new AppError('CEP não encontrado', 404);
  }

  return {
    cep,
    logradouro: endereco.logradouro ?? '',
    complemento: endereco.complemento ?? '',
    bairro: endereco.bairro ?? '',
    cidade: endereco.localidade ?? '',
    uf: endereco.uf ?? '',
  };
}

module.exports = { normalizarCep, buscar };
