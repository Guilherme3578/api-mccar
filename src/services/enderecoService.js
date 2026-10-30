const enderecoRepository = require('../repositories/enderecoRepository');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { garantirDono, idUsuarioDoFiltro } = require('../utils/acesso');
const { exigirCampos, selecionarCampos, paraFlag, paraTextoOpcional } = require('../utils/validacao');

const camposEditaveis = ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'principal'];

function normalizar(endereco) {
  exigirCampos(endereco, ['logradouro', 'numero', 'bairro', 'cidade', 'uf', 'cep']);

  const uf = String(endereco.uf).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) {
    throw new AppError('UF deve ter 2 letras', 400);
  }

  const cep = String(endereco.cep).replace(/\D/g, '');
  if (cep.length !== 8) {
    throw new AppError('CEP deve ter 8 dígitos', 400);
  }

  return {
    ...endereco,
    logradouro: String(endereco.logradouro).trim(),
    numero: String(endereco.numero).trim(),
    complemento: paraTextoOpcional(endereco.complemento),
    bairro: String(endereco.bairro).trim(),
    cidade: String(endereco.cidade).trim(),
    uf,
    cep,
    principal: paraFlag(endereco.principal),
  };
}

function salvar(operacao, endereco) {
  return transacao(() => {
    const salvo = operacao(endereco);
    if (salvo.principal) {
      enderecoRepository.desmarcarOutrosPrincipais(salvo.id_usuario, salvo.id_endereco);
    }
    return salvo;
  });
}

function buscarPorId(id) {
  const endereco = enderecoRepository.buscarPorId(id);
  if (!endereco) {
    throw new AppError('Endereço não encontrado', 404);
  }
  return endereco;
}

function listar(usuarioLogado, filtros) {
  return enderecoRepository.listar(idUsuarioDoFiltro(usuarioLogado, filtros.id_usuario));
}

function buscar(usuarioLogado, id) {
  const endereco = buscarPorId(id);
  garantirDono(usuarioLogado, endereco.id_usuario);
  return endereco;
}

function criar(usuarioLogado, dados) {
  const id_usuario = usuarioLogado.id_usuario;
  const endereco = normalizar({ ...selecionarCampos(dados, camposEditaveis), id_usuario });

  if (enderecoRepository.listar(id_usuario).length === 0) {
    endereco.principal = 1;
  }

  return salvar(enderecoRepository.inserir, endereco);
}

function atualizar(usuarioLogado, id, dados) {
  const atual = buscar(usuarioLogado, id);
  const endereco = normalizar({ ...atual, ...selecionarCampos(dados, camposEditaveis) });
  return salvar(enderecoRepository.atualizar, endereco);
}

function remover(usuarioLogado, id) {
  const endereco = buscar(usuarioLogado, id);
  transacao(() => {
    enderecoRepository.remover(id);
    enderecoRepository.promoverPrimeiroPrincipal(endereco.id_usuario);
  });
}

module.exports = { buscarPorId, listar, buscar, criar, atualizar, remover };
