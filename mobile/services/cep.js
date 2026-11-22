import { api } from './api';

function normalizar(dados) {
  return {
    logradouro: dados.logradouro || '',
    bairro: dados.bairro || '',
    cidade: dados.cidade || dados.localidade || '',
    uf: dados.uf || '',
    complemento: dados.complemento || '',
  };
}

async function viaCepDireto(digitos) {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 10000);
  try {
    const resposta = await fetch('https://viacep.com.br/ws/' + digitos + '/json/', { signal: controle.signal });
    if (!resposta.ok) throw new Error('Não foi possível consultar o CEP.');
    const dados = await resposta.json();
    if (dados.erro) throw new Error('CEP não encontrado.');
    return normalizar(dados);
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('A consulta do CEP demorou demais.');
    if (/CEP/.test(e.message)) throw e;
    throw new Error('Sem conexão para consultar o CEP.');
  } finally {
    clearTimeout(limite);
  }
}

export async function buscarCep(cep) {
  const digitos = String(cep).replace(/\D/g, '');
  if (digitos.length !== 8) throw new Error('CEP deve ter 8 dígitos.');
  try {
    return normalizar(await api.get('/cep/' + digitos));
  } catch (e) {
    if (e.status === 400 || (e.status === 404 && /CEP/i.test(e.message))) throw new Error('CEP não encontrado.');
    return viaCepDireto(digitos);
  }
}
