const AppError = require('./AppError');

function vazio(valor) {
  return valor === undefined || valor === null || valor === '';
}

function exigirCampos(dados = {}, campos) {
  const faltando = campos.filter((campo) => vazio(dados[campo]));
  if (faltando.length > 0) {
    throw new AppError(`Campos obrigatórios não informados: ${faltando.join(', ')}`, 400);
  }
}

function selecionarCampos(dados = {}, campos) {
  return Object.fromEntries(
    campos.filter((campo) => dados[campo] !== undefined).map((campo) => [campo, dados[campo]])
  );
}

function paraId(valor, nome = 'id') {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${nome} inválido`, 400);
  }
  return id;
}

function paraIdOpcional(valor, nome) {
  return vazio(valor) ? null : paraId(valor, nome);
}

function paraInteiro(valor, nome, minimo = 0) {
  const numero = Number(valor);
  if (vazio(valor) || !Number.isInteger(numero) || numero < minimo) {
    throw new AppError(`${nome} deve ser um número inteiro maior ou igual a ${minimo}`, 400);
  }
  return numero;
}

function paraFlag(valor) {
  return valor === true || valor === 1 || valor === '1' || valor === 'true' ? 1 : 0;
}

function paraFlagOpcional(valor) {
  return vazio(valor) ? null : paraFlag(valor);
}

function paraTextoOpcional(valor) {
  return vazio(valor) ? null : String(valor).trim();
}

function paraOpcao(valor, enumeracao, nome) {
  const opcoes = Object.values(enumeracao);
  const texto = String(valor ?? '').trim().toUpperCase();
  if (!opcoes.includes(texto)) {
    throw new AppError(`${nome} deve ser um destes: ${opcoes.join(', ')}`, 400);
  }
  return texto;
}

module.exports = {
  exigirCampos,
  selecionarCampos,
  paraId,
  paraIdOpcional,
  paraInteiro,
  paraFlag,
  paraFlagOpcional,
  paraTextoOpcional,
  paraOpcao,
};
