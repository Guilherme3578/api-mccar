const cupomRepository = require('../repositories/cupomRepository');
const pedidoRepository = require('../repositories/pedidoRepository');
const cupomBoasVindas = require('../config/cupomBoasVindas');
const TipoCupom = require('../enums/TipoCupom');
const AppError = require('../utils/AppError');
const { exigirCampos, selecionarCampos, paraInteiro, paraFlag, paraTextoOpcional, paraOpcao } = require('../utils/validacao');

const camposEditaveis = ['codigo', 'tipo', 'valor', 'minimo_compra_centavos', 'valido_ate', 'ativo'];

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function normalizar(cupom, idAtual) {
  exigirCampos(cupom, ['codigo', 'tipo', 'valor']);

  const codigo = String(cupom.codigo).trim().toUpperCase();
  const existente = cupomRepository.buscarPorCodigo(codigo);
  if (existente && existente.id_cupom !== idAtual) {
    throw new AppError('Já existe um cupom com esse código', 409);
  }

  const tipo = paraOpcao(cupom.tipo, TipoCupom, 'tipo');

  const valor = paraInteiro(cupom.valor, 'valor', 1);
  if (tipo === TipoCupom.PERCENTUAL && valor > 100) {
    throw new AppError('Cupom percentual não pode passar de 100', 400);
  }

  const validoAte = paraTextoOpcional(cupom.valido_ate);
  if (validoAte && (!/^\d{4}-\d{2}-\d{2}$/.test(validoAte) || Number.isNaN(Date.parse(validoAte)))) {
    throw new AppError('valido_ate deve estar no formato AAAA-MM-DD', 400);
  }

  return {
    ...cupom,
    codigo,
    tipo,
    valor,
    minimo_compra_centavos: paraInteiro(cupom.minimo_compra_centavos ?? 0, 'minimo_compra_centavos'),
    valido_ate: validoAte,
    ativo: cupom.ativo === undefined ? 1 : paraFlag(cupom.ativo),
  };
}

function listar() {
  return cupomRepository.listar();
}

function buscarPorId(id) {
  const cupom = cupomRepository.buscarPorId(id);
  if (!cupom) {
    throw new AppError('Cupom não encontrado', 404);
  }
  return cupom;
}

function buscarPorCodigo(codigo) {
  const cupom = cupomRepository.buscarPorCodigo(String(codigo).trim().toUpperCase());
  if (!cupom) {
    throw new AppError('Cupom não encontrado', 404);
  }
  return cupom;
}

function validarParaUso(id, idUsuario, idPedido = 0) {
  const cupom = buscarPorId(id);
  if (!cupom.ativo) {
    throw new AppError('Cupom inativo', 400);
  }
  if (cupom.valido_ate && cupom.valido_ate < hoje()) {
    throw new AppError('Cupom expirado', 400);
  }
  if (pedidoRepository.contarUsosDoCupom(idUsuario, cupom.id_cupom, idPedido) > 0) {
    throw new AppError(`Você já utilizou o cupom ${cupom.codigo}`, 400);
  }
  if (cupom.codigo === cupomBoasVindas.codigo && pedidoRepository.contarComprasDoUsuario(idUsuario, idPedido) > 0) {
    throw new AppError(`O cupom ${cupom.codigo} é válido apenas na primeira compra`, 400);
  }
  return cupom;
}

function garantirCompraMinima(cupom, subtotalCentavos) {
  if (subtotalCentavos < cupom.minimo_compra_centavos) {
    const minimo = (cupom.minimo_compra_centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    throw new AppError(`O cupom ${cupom.codigo} exige compra mínima de ${minimo}`, 400);
  }
}

function garantirCupomBoasVindas() {
  if (!cupomRepository.buscarPorCodigo(cupomBoasVindas.codigo)) {
    cupomRepository.inserir({
      ...cupomBoasVindas,
      minimo_compra_centavos: 0,
      valido_ate: null,
      ativo: 1,
    });
  }
}

function cupomBoasVindasDisponivel() {
  const cupom = cupomRepository.buscarPorCodigo(cupomBoasVindas.codigo);
  return cupom && cupom.ativo ? cupom.codigo : null;
}

function calcularDesconto(cupom, subtotalCentavos) {
  if (!cupom || subtotalCentavos < cupom.minimo_compra_centavos) return 0;
  const desconto = cupom.tipo === TipoCupom.PERCENTUAL ? Math.floor((subtotalCentavos * cupom.valor) / 100) : cupom.valor;
  return Math.min(desconto, subtotalCentavos);
}

function criar(dados) {
  return cupomRepository.inserir(normalizar(selecionarCampos(dados, camposEditaveis)));
}

function atualizar(id, dados) {
  const atual = buscarPorId(id);
  return cupomRepository.atualizar(normalizar({ ...atual, ...selecionarCampos(dados, camposEditaveis) }, id));
}

function remover(id) {
  buscarPorId(id);
  cupomRepository.remover(id);
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorCodigo,
  validarParaUso,
  garantirCompraMinima,
  garantirCupomBoasVindas,
  cupomBoasVindasDisponivel,
  calcularDesconto,
  criar,
  atualizar,
  remover,
};
