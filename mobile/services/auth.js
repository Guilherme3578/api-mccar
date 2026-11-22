import { api, salvarToken, carregarToken } from './api';

export async function login(email, senha) {
  const mail = String(email).trim();
  if (!mail || !senha) {
    throw new Error('Informe e-mail e senha.');
  }
  const dados = await api.post('/usuarios/login', { email: mail, senha: senha }, { semExpirar: true });
  await salvarToken(dados.token);
  return dados.usuario;
}

export async function cadastrar(nome, email, senha) {
  return api.post('/usuarios', { nome: nome.trim(), email: email.trim(), senha: senha });
}

export async function restaurarSessao() {
  const token = await carregarToken();
  if (!token) return null;
  try {
    return await api.get('/usuarios/me');
  } catch (e) {
    if (e.status === 401 || e.status === 403 || e.status === 404) {
      await salvarToken(null);
      return null;
    }
    throw e;
  }
}

export async function sair() {
  await salvarToken(null);
}
