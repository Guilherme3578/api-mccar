const modeloVeiculoRepository = require('../repositories/modeloVeiculoRepository');
const AppError = require('../utils/AppError');
const { exigirCampos, selecionarCampos, paraInteiro } = require('../utils/validacao');

const camposEditaveis = ['marca', 'modelo', 'ano'];

function normalizar(modelo) {
  exigirCampos(modelo, camposEditaveis);
  return {
    ...modelo,
    marca: String(modelo.marca).trim(),
    modelo: String(modelo.modelo).trim(),
    ano: paraInteiro(modelo.ano, 'ano', 1900),
  };
}

function listar() {
  return modeloVeiculoRepository.listar();
}

function buscarPorId(id) {
  const modelo = modeloVeiculoRepository.buscarPorId(id);
  if (!modelo) {
    throw new AppError('Modelo de veículo não encontrado', 404);
  }
  return modelo;
}

function criar(dados) {
  return modeloVeiculoRepository.inserir(normalizar(selecionarCampos(dados, camposEditaveis)));
}

function atualizar(id, dados) {
  const atual = buscarPorId(id);
  return modeloVeiculoRepository.atualizar(normalizar({ ...atual, ...selecionarCampos(dados, camposEditaveis) }));
}

function remover(id) {
  buscarPorId(id);
  modeloVeiculoRepository.remover(id);
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
