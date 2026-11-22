import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, salvarToken, definirAoExpirar } from '../../services/api';
import { buscarCep } from '../../services/cep';
import { exportarJson } from '../../services/export';
import * as Sharing from 'expo-sharing';

function respostaJson(status, corpo) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status, json: () => Promise.resolve(corpo) });
}

beforeEach(async () => {
  global.fetch = jest.fn();
  await salvarToken(null);
  definirAoExpirar(null);
});

describe('cliente da API REST', () => {
  test('envia o token JWT e monta a query string sem valores vazios', async () => {
    await salvarToken('abc123');
    global.fetch.mockReturnValue(respostaJson(200, [{ id_produto: 1 }]));

    const lista = await api.get('/produtos', { busca: 'freio', id_categoria: 4, vazio: '', nulo: null });

    expect(lista).toEqual([{ id_produto: 1 }]);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toBe('http://192.168.0.10:3000/produtos?busca=freio&id_categoria=4');
    expect(opcoes.method).toBe('GET');
    expect(opcoes.headers.Authorization).toBe('Bearer abc123');
    expect(await AsyncStorage.getItem('mccar:token')).toBe('abc123');
  });

  test('envia JSON no corpo do POST', async () => {
    global.fetch.mockReturnValue(respostaJson(201, { id_endereco: 9 }));
    await api.post('/enderecos', { cep: '01001000' });
    const [, opcoes] = global.fetch.mock.calls[0];
    expect(opcoes.method).toBe('POST');
    expect(opcoes.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opcoes.body)).toEqual({ cep: '01001000' });
  });

  test('usa a mensagem de erro da API e o status HTTP', async () => {
    global.fetch.mockReturnValue(respostaJson(409, { erro: 'Já existe um produto com esse código' }));
    await expect(api.post('/produtos', {})).rejects.toMatchObject({ message: 'Já existe um produto com esse código', status: 409 });
  });

  test('sessão expirada (401) chama o callback de logout', async () => {
    const aoExpirar = jest.fn();
    definirAoExpirar(aoExpirar);
    await salvarToken('vencido');
    global.fetch.mockReturnValue(respostaJson(401, { erro: 'Token inválido' }));
    await expect(api.get('/usuarios/me')).rejects.toMatchObject({ status: 401 });
    expect(aoExpirar).toHaveBeenCalledTimes(1);
  });

  test('falha de rede vira erro amigável com status 0', async () => {
    global.fetch.mockRejectedValue(new TypeError('Network request failed'));
    await expect(api.get('/categorias')).rejects.toMatchObject({ status: 0 });
  });
});

describe('consulta de CEP (Correios / ViaCEP)', () => {
  test('usa a rota /cep da API', async () => {
    global.fetch.mockReturnValue(
      respostaJson(200, { cep: '01001000', logradouro: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' })
    );
    const endereco = await buscarCep('01001-000');
    expect(global.fetch.mock.calls[0][0]).toBe('http://192.168.0.10:3000/cep/01001000');
    expect(endereco).toMatchObject({ logradouro: 'Praça da Sé', cidade: 'São Paulo', uf: 'SP' });
  });

  test('cai para o ViaCEP direto quando a API está fora do ar', async () => {
    global.fetch
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockReturnValueOnce(respostaJson(200, { logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }));
    const endereco = await buscarCep('01001000');
    expect(global.fetch.mock.calls[1][0]).toBe('https://viacep.com.br/ws/01001000/json/');
    expect(endereco.cidade).toBe('São Paulo');
  });

  test('CEP inexistente e CEP incompleto', async () => {
    global.fetch.mockReturnValue(respostaJson(404, { erro: 'CEP não encontrado' }));
    await expect(buscarCep('99999999')).rejects.toThrow('CEP não encontrado.');
    await expect(buscarCep('123')).rejects.toThrow('8 dígitos');
  });
});

describe('botão Gerar JSON', () => {
  test('baixa o relatório da API, salva o arquivo .json e abre o compartilhamento', async () => {
    await salvarToken('token-admin');
    const relatorio = { gerado_em: '2026-11-22T10:00:00Z', resumo: { pedidos_total: 140 }, pedidos: [] };
    global.fetch.mockReturnValue(respostaJson(200, relatorio));

    const r = await exportarJson();

    expect(global.fetch.mock.calls[0][0]).toBe('http://192.168.0.10:3000/relatorios/dados');
    expect(r.dados).toEqual(relatorio);
    expect(r.uri).toBe('file:///cache/mccar-dados-20261122100000.json');
    expect(Sharing.shareAsync).toHaveBeenCalledWith(r.uri, expect.objectContaining({ mimeType: 'application/json' }));
  });

  test('cliente sem perfil de admin recebe 403', async () => {
    global.fetch.mockReturnValue(respostaJson(403, { erro: 'Acesso restrito a administradores' }));
    await expect(exportarJson()).rejects.toMatchObject({ status: 403 });
  });
});
