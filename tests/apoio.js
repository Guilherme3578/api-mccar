const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert');

const caminhoBanco = path.join(os.tmpdir(), `mccar-teste-${process.pid}.db`);
process.env.DB_PATH = caminhoBanco;
process.env.JWT_SECRET ||= 'segredo-usado-apenas-nos-testes-automatizados';
process.env.FRETE_PADRAO_CENTAVOS = '2990';
process.env.FRETE_GRATIS_ACIMA_CENTAVOS = '10000';
process.env.FRETE_TRANSPORTE_MIN_DIAS = '2';
process.env.FRETE_TRANSPORTE_MAX_DIAS = '7';
process.env.PAGAMENTO_APROVACAO_AUTOMATICA ??= 'false';

const app = require('../src/app');
const { db } = require('../src/config/database');
const usuarioRepository = require('../src/repositories/usuarioRepository');
const cupomService = require('../src/services/cupomService');
const Perfil = require('../src/enums/Perfil');

cupomService.garantirCupomBoasVindas();

const falhas = [];
let servidor;
let base;
let etapaAtual = '';

function iniciar() {
  return new Promise((resolve) => {
    servidor = app.listen(0, () => {
      base = `http://localhost:${servidor.address().port}`;
      resolve();
    });
  });
}

function etapa(nome) {
  etapaAtual = nome;
}

function falhar(mensagem) {
  falhas.push(etapaAtual ? `[${etapaAtual}] ${mensagem}` : mensagem);
}

function conferir(condicao, titulo, detalhe) {
  if (!condicao) falhar(`${titulo} -> ${JSON.stringify(detalhe)}`);
}

async function enviar(metodo, rota, opcoes = {}) {
  return fetch(base + rota, { method: metodo, ...opcoes });
}

async function req(token, metodo, rota, corpo, esperado, titulo = `${metodo} ${rota}`) {
  const resp = await fetch(base + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resp.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = texto;
  }
  const esperados = Array.isArray(esperado) ? esperado : [esperado];
  if (!esperados.includes(resp.status)) {
    falhar(`${titulo}: recebeu ${resp.status}, esperado ${esperados.join(' ou ')} ${texto.slice(0, 300)}`);
  }
  return dados;
}

async function cadastrar(nome, email, senha = '123456') {
  const usuario = await req(null, 'POST', '/usuarios', { nome, email, senha }, 201, `cadastro ${nome}`);
  const login = await req(null, 'POST', '/usuarios/login', { email, senha }, 200, `login ${nome}`);
  return { ...usuario, token: login.token };
}

function promoverAdmin(email) {
  const usuario = usuarioRepository.buscarPorEmail(email.toLowerCase());
  usuarioRepository.atualizarPerfil(usuario.id_usuario, Perfil.ADMIN);
}

function rodarSeed() {
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'seed.sql'), 'utf8'));
}

function finalizar() {
  servidor.close();
  db.close();
  for (const sufixo of ['', '-wal', '-shm']) fs.rmSync(caminhoBanco + sufixo, { force: true });
  assert.deepStrictEqual(falhas, [], `${falhas.length} verificação(ões) falharam:\n${falhas.join('\n')}`);
}

module.exports = { iniciar, etapa, falhar, conferir, enviar, req, cadastrar, promoverAdmin, rodarSeed, finalizar };
