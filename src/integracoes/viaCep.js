const AppError = require('../utils/AppError');

const URL_VIACEP = 'https://viacep.com.br/ws';
const TEMPO_LIMITE_MS = 5000;

async function buscarCep(cep) {
  let resposta;
  try {
    resposta = await fetch(`${URL_VIACEP}/${cep}/json/`, { signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  } catch {
    throw new AppError('Não foi possível consultar o CEP agora. Tente novamente em instantes', 502);
  }

  if (!resposta.ok) {
    throw new AppError('Não foi possível consultar o CEP agora. Tente novamente em instantes', 502);
  }

  const dados = await resposta.json();
  return dados.erro ? null : dados;
}

module.exports = { buscarCep };
