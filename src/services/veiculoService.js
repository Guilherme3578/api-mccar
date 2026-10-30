const veiculoRepository = require('../repositories/veiculoRepository');
const modeloVeiculoService = require('./modeloVeiculoService');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { garantirDono, idUsuarioDoFiltro } = require('../utils/acesso');
const { exigirCampos, paraId, paraFlag } = require('../utils/validacao');

function salvar(operacao, veiculo) {
  const salvo = transacao(() => {
    const resultado = operacao(veiculo);
    if (resultado.principal) {
      veiculoRepository.desmarcarOutrosPrincipais(resultado.id_usuario, resultado.id_veiculo);
    }
    return resultado;
  });
  return veiculoRepository.buscarPorId(salvo.id_veiculo);
}

function garantirModeloNaoCadastrado(idUsuario, idModeloVeiculo, idVeiculoAtual) {
  const existente = veiculoRepository.buscarPorUsuarioEModelo(idUsuario, idModeloVeiculo);
  if (existente && existente.id_veiculo !== idVeiculoAtual) {
    throw new AppError('Você já possui um veículo desse modelo cadastrado', 409);
  }
}

function buscarPorId(id) {
  const veiculo = veiculoRepository.buscarPorId(id);
  if (!veiculo) {
    throw new AppError('Veículo não encontrado', 404);
  }
  return veiculo;
}

function listar(usuarioLogado, filtros) {
  return veiculoRepository.listar(idUsuarioDoFiltro(usuarioLogado, filtros.id_usuario));
}

function buscar(usuarioLogado, id) {
  const veiculo = buscarPorId(id);
  garantirDono(usuarioLogado, veiculo.id_usuario);
  return veiculo;
}

function criar(usuarioLogado, dados) {
  exigirCampos(dados, ['id_modelo_veiculo']);
  const id_usuario = usuarioLogado.id_usuario;
  const id_modelo_veiculo = paraId(dados.id_modelo_veiculo, 'id_modelo_veiculo');
  modeloVeiculoService.buscarPorId(id_modelo_veiculo);
  garantirModeloNaoCadastrado(id_usuario, id_modelo_veiculo);

  const principal = veiculoRepository.listar(id_usuario).length === 0 ? 1 : paraFlag(dados.principal);

  return salvar(veiculoRepository.inserir, { id_usuario, id_modelo_veiculo, principal });
}

function atualizar(usuarioLogado, id, dados) {
  const atual = buscar(usuarioLogado, id);
  const veiculo = {
    id_veiculo: id,
    id_modelo_veiculo: atual.id_modelo_veiculo,
    principal: dados.principal !== undefined ? paraFlag(dados.principal) : atual.principal,
  };

  if (dados.id_modelo_veiculo !== undefined) {
    veiculo.id_modelo_veiculo = paraId(dados.id_modelo_veiculo, 'id_modelo_veiculo');
    modeloVeiculoService.buscarPorId(veiculo.id_modelo_veiculo);
    garantirModeloNaoCadastrado(atual.id_usuario, veiculo.id_modelo_veiculo, id);
  }

  return salvar(veiculoRepository.atualizar, veiculo);
}

function remover(usuarioLogado, id) {
  const veiculo = buscar(usuarioLogado, id);
  transacao(() => {
    veiculoRepository.remover(id);
    veiculoRepository.promoverPrimeiroPrincipal(veiculo.id_usuario);
  });
}

module.exports = { buscarPorId, listar, buscar, criar, atualizar, remover };
