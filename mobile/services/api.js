import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const CHAVE_TOKEN = 'mccar:token';
let token = null;
let aoExpirar = null;

const armazenamento =
  Platform.OS === 'web'
    ? {
        getItem: async (chave) => window.sessionStorage.getItem(chave),
        setItem: async (chave, valor) => window.sessionStorage.setItem(chave, valor),
        removeItem: async (chave) => window.sessionStorage.removeItem(chave),
      }
    : AsyncStorage;

export async function carregarToken() {
  token = await armazenamento.getItem(CHAVE_TOKEN);
  return token;
}

export async function salvarToken(novo) {
  token = novo;
  if (novo) {
    await armazenamento.setItem(CHAVE_TOKEN, novo);
  } else {
    await armazenamento.removeItem(CHAVE_TOKEN);
  }
}

export function definirAoExpirar(funcao) {
  aoExpirar = funcao;
}

function montarQuery(params) {
  if (!params) return '';
  const partes = [];
  Object.keys(params).forEach(function (chave) {
    const valor = params[chave];
    if (valor !== undefined && valor !== null && valor !== '') {
      partes.push(encodeURIComponent(chave) + '=' + encodeURIComponent(valor));
    }
  });
  return partes.length ? '?' + partes.join('&') : '';
}

export async function request(metodo, caminho, opcoes = {}) {
  const headers = { Accept: 'application/json' };
  if (opcoes.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;

  const controle = new AbortController();
  const limite = setTimeout(function () {
    controle.abort();
  }, 15000);

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho + montarQuery(opcoes.params), {
      method: metodo,
      headers: headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
      signal: controle.signal,
    });
  } catch (e) {
    const erro = new Error('Não foi possível conectar à API. Verifique o Wi-Fi e o endereço do servidor (' + API_URL + ').');
    erro.status = 0;
    throw erro;
  } finally {
    clearTimeout(limite);
  }

  if (resposta.status === 204) return null;

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (e) {
    dados = null;
  }

  if (!resposta.ok) {
    const mensagem = dados && dados.erro ? dados.erro : 'Erro ' + resposta.status;
    const erro = new Error(mensagem);
    erro.status = resposta.status;
    if (resposta.status === 401 && token && opcoes.semExpirar !== true && aoExpirar) {
      aoExpirar();
    }
    throw erro;
  }
  return dados;
}

export const api = {
  get: (c, params) => request('GET', c, { params: params }),
  post: (c, body, extra) => request('POST', c, { body: body === undefined ? {} : body, ...extra }),
  put: (c, body) => request('PUT', c, { body: body }),
  del: (c) => request('DELETE', c),
};
