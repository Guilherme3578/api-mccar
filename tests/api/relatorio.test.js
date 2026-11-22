const { test, mock } = require('node:test');
const { iniciar, etapa, conferir, enviar, req, cadastrar, promoverAdmin, rodarSeed, finalizar } = require('./apoio');
const viaCep = require('../../src/integracoes/viaCep');

test('Relatório em JSON e busca de CEP', async () => {
  await iniciar();
  try {
    rodarSeed();
    const adm = await cadastrar('Admin', 'admin@rel.com');
    promoverAdmin('admin@rel.com');
    const admin = (await req(null, 'POST', '/usuarios/login', { email: 'admin@rel.com', senha: '123456' }, 200, 'login admin')).token;
    const ana = await cadastrar('Ana', 'ana@rel.com');

    etapa('acesso ao relatório');
    await req(null, 'GET', '/relatorios/dados', null, 401, 'sem login');
    await req(ana.token, 'GET', '/relatorios/dados', null, 403, 'cliente não vê dados da empresa');

    etapa('uma venda real aparece no relatório');
    const end = await req(ana.token, 'POST', '/enderecos', { logradouro: 'Rua', numero: '1', bairro: 'Centro', cidade: 'Recife', uf: 'PE', cep: '50010000' }, 201, 'endereço');
    const produtos = await req(null, 'GET', '/produtos', null, 200, 'catálogo');
    const bateria = produtos.find((p) => p.codigo === 'MC-014');
    const car = await req(ana.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho');
    await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: bateria.id_produto, quantidade: 1 }, 201, 'bateria');
    const pedido = await req(ana.token, 'POST', '/pedidos/checkout', { id_endereco: end.id_endereco }, 201, 'checkout');
    const pagamento = await req(ana.token, 'POST', '/pagamentos', { id_pedido: pedido.id_pedido, metodo: 'PIX' }, 201, 'paga com PIX');
    await req(admin, 'PUT', `/pagamentos/${pagamento.id_pagamento}`, { status: 'APROVADO' }, 200, 'aprova');

    const dados = await req(admin, 'GET', '/relatorios/dados', null, 200, 'admin baixa os dados');
    const secoes = ['resumo', 'vendas_por_dia', 'vendas_por_categoria', 'produtos_mais_vendidos', 'pedidos_por_status', 'pagamentos_por_metodo', 'vendas_por_estado', 'cupons', 'pedidos'];
    conferir(secoes.every((secao) => secao in (dados ?? {})), 'o JSON tem todas as seções do dashboard', Object.keys(dados ?? {}));
    conferir(dados?.resumo?.faturamento_centavos === 54990 && dados?.resumo?.pedidos_pagos === 1, 'faturamento é o valor da venda', dados?.resumo);
    conferir(dados?.produtos_mais_vendidos?.[0]?.codigo === 'MC-014', 'a bateria aparece como mais vendida', dados?.produtos_mais_vendidos);
    conferir(dados?.vendas_por_estado?.[0]?.uf === 'PE', 'a venda aparece no estado do endereço de entrega', dados?.vendas_por_estado);
    conferir(dados?.pedidos?.[0]?.numero === pedido.numero && dados?.pedidos?.[0]?.metodo_pagamento === 'PIX', 'o pedido aparece na lista com o método de pagamento', dados?.pedidos);

    etapa('download do arquivo');
    const arquivo = await enviar('GET', '/relatorios/dados?download=1', { headers: { Authorization: `Bearer ${admin}` } });
    const disposicao = arquivo.headers.get('content-disposition') ?? '';
    conferir(arquivo.status === 200 && /attachment; filename="?mccar-dados-\d{4}-\d{2}-\d{2}\.json"?/.test(disposicao), 'com ?download=1 vem como arquivo .json', disposicao);
    conferir((arquivo.headers.get('content-type') ?? '').includes('application/json'), 'o arquivo é JSON', arquivo.headers.get('content-type'));

    etapa('CEP');
    mock.method(viaCep, 'buscarCep', async (cep) =>
      cep === '01001000' ? { cep: '01001-000', logradouro: 'Praça da Sé', complemento: '', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' } : null
    );
    const cep = await req(null, 'GET', '/cep/01001-000', null, 200, 'busca de CEP é pública');
    conferir(cep?.cidade === 'São Paulo' && cep?.uf === 'SP' && cep?.logradouro === 'Praça da Sé', 'devolve rua, cidade e UF', cep);
    await req(null, 'GET', '/cep/99999999', null, 404, 'CEP inexistente');
    await req(null, 'GET', '/cep/123', null, 400, 'CEP com tamanho errado');
    mock.restoreAll();
  } finally {
    finalizar();
  }
});
