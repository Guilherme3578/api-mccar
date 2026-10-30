const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');
const carrinhoRepository = require('../repositories/carrinhoRepository');
const Perfil = require('../enums/Perfil');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { garantirDono } = require('../utils/acesso');
const { exigirCampos, selecionarCampos } = require('../utils/validacao');

const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hashParaComparacaoFalsa = bcrypt.hashSync('usuario-inexistente', 10);

function normalizarEmail(email) {
  return String(email).trim().toLowerCase();
}

function garantirEmailDisponivel(email, idAtual) {
  if (!formatoEmail.test(email)) {
    throw new AppError('E-mail inválido', 400);
  }
  const existente = usuarioRepository.buscarPorEmail(email);
  if (existente && existente.id_usuario !== idAtual) {
    throw new AppError('E-mail já cadastrado', 409);
  }
}

function gerarHashSenha(senha) {
  if (String(senha).length < 6) {
    throw new AppError('A senha deve ter pelo menos 6 caracteres', 400);
  }
  return bcrypt.hashSync(String(senha), 10);
}

function listar() {
  return usuarioRepository.listar();
}

function buscarPorId(id) {
  const usuario = usuarioRepository.buscarPorId(id);
  if (!usuario) {
    throw new AppError('Usuário não encontrado', 404);
  }
  return usuario;
}

function buscar(usuarioLogado, id) {
  garantirDono(usuarioLogado, id);
  return buscarPorId(id);
}

function criar(dados) {
  exigirCampos(dados, ['nome', 'email', 'senha']);
  const email = normalizarEmail(dados.email);
  garantirEmailDisponivel(email);

  const usuario = {
    nome: String(dados.nome).trim(),
    email,
    senha_hash: gerarHashSenha(dados.senha),
  };

  return transacao(() => {
    const criado = usuarioRepository.inserir(usuario);
    carrinhoRepository.inserir({ id_usuario: criado.id_usuario });
    return criado;
  });
}

function atualizar(usuarioLogado, id, dados) {
  const atual = buscar(usuarioLogado, id);
  const usuario = { ...atual, ...selecionarCampos(dados, ['nome', 'email']) };
  exigirCampos(usuario, ['nome', 'email']);

  usuario.nome = String(usuario.nome).trim();
  usuario.email = normalizarEmail(usuario.email);
  garantirEmailDisponivel(usuario.email, id);

  const senhaHash = dados.senha !== undefined ? gerarHashSenha(dados.senha) : null;

  return transacao(() => {
    if (senhaHash) {
      usuarioRepository.atualizarSenha(id, senhaHash);
    }
    return usuarioRepository.atualizar(usuario);
  });
}

function alterarPerfil(usuarioLogado, id, dados) {
  buscarPorId(id);
  exigirCampos(dados, ['perfil']);

  const perfil = String(dados.perfil).trim().toUpperCase();
  if (!Object.values(Perfil).includes(perfil)) {
    throw new AppError(`perfil deve ser um destes: ${Object.values(Perfil).join(', ')}`, 400);
  }
  if (id === usuarioLogado.id_usuario) {
    throw new AppError('Você não pode alterar o seu próprio perfil', 400);
  }

  return usuarioRepository.atualizarPerfil(id, perfil);
}

function remover(usuarioLogado, id) {
  buscar(usuarioLogado, id);
  usuarioRepository.remover(id);
}

function login(dados) {
  exigirCampos(dados, ['email', 'senha']);
  const usuario = usuarioRepository.buscarPorEmail(normalizarEmail(dados.email));
  const senhaConfere = bcrypt.compareSync(String(dados.senha), usuario ? usuario.senha_hash : hashParaComparacaoFalsa);

  if (!usuario || !senhaConfere) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const { senha_hash, ...usuarioSemSenha } = usuario;
  const token = jwt.sign({ id_usuario: usuario.id_usuario }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  return { usuario: usuarioSemSenha, token };
}

module.exports = { listar, buscarPorId, buscar, criar, atualizar, alterarPerfil, remover, login };
