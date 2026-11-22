const { describe, test, after, mock, beforeEach } = require('node:test');
const assert = require('node:assert');
const { cenarioDeCompra, encerrar } = require('./ambiente');
const AppError = require('../../src/utils/AppError');
const relatorioService = require('../../src/services/relatorioService');
const pedidoService = require('../../src/services/pedidoService');
const pagamentoService = require('../../src/services/pagamentoService');
const cupomService = require('../../src/services/cupomService');
const cepService = require('../../src/services/cepService');
const viaCep = require('../../src/integracoes/viaCep');

after(encerrar);

cupomService.garantirCupomBoasVindas();

const admin = { id_usuario: 0, perfil: 'ADMIN' };
const comStatus = (status) => (erro) => erro instanceof AppError && erro.status === status;

describe('relatorioService.dados', () => {
  test('sem vendas, devolve tudo zerado e listas vazias', () => {
    const dados = relatorioService.dados();
    assert.strictEqual(dados.resumo.faturamento_centavos, 0);
    assert.strictEqual(dados.resumo.ticket_medio_centavos, 0);
    assert.deepStrictEqual(dados.vendas_por_dia, []);
    assert.deepStrictEqual(dados.pedidos, []);
    assert.match(dados.gerado_em, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  test('só pedidos pagos, enviados ou entregues contam como faturamento', () => {
    const pago = cenarioDeCompra({ precoCentavos: 20000 });
    const pedidoPago = pedidoService.checkout(pago.usuario, { id_endereco: pago.endereco.id_endereco });
    const pagamento = pagamentoService.criar(pago.usuario, { id_pedido: pedidoPago.id_pedido, metodo: 'PIX' });
    pagamentoService.atualizar(pagamento.id_pagamento, { status: 'APROVADO' });

    const enviado = cenarioDeCompra({ precoCentavos: 5000, quantidade: 2 });
    const pedidoEnviado = pedidoService.checkout(enviado.usuario, { id_endereco: enviado.endereco.id_endereco });
    const pagamento2 = pagamentoService.criar(enviado.usuario, { id_pedido: pedidoEnviado.id_pedido, metodo: 'BOLETO' });
    pagamentoService.atualizar(pagamento2.id_pagamento, { status: 'APROVADO' });
    pedidoService.atualizar(admin, pedidoEnviado.id_pedido, { status: 'ENVIADO' });

    const aguardando = cenarioDeCompra({ precoCentavos: 99900 });
    pedidoService.checkout(aguardando.usuario, { id_endereco: aguardando.endereco.id_endereco });

    const cancelado = cenarioDeCompra({ precoCentavos: 88800 });
    const pedidoCancelado = pedidoService.checkout(cancelado.usuario, { id_endereco: cancelado.endereco.id_endereco });
    pedidoService.atualizar(cancelado.usuario, pedidoCancelado.id_pedido, { status: 'CANCELADO' });

    const { resumo, pedidos_por_status, pagamentos_por_metodo } = relatorioService.dados();
    assert.strictEqual(resumo.pedidos_total, 4);
    assert.strictEqual(resumo.pedidos_pagos, 2);
    assert.strictEqual(resumo.pedidos_aguardando, 1);
    assert.strictEqual(resumo.pedidos_cancelados, 1);
    assert.strictEqual(resumo.faturamento_centavos, 20000 + 10000);
    assert.strictEqual(resumo.ticket_medio_centavos, 15000);
    assert.strictEqual(resumo.clientes_que_compraram, 2);
    assert.deepStrictEqual(
      pedidos_por_status.map((s) => s.status).sort(),
      ['AGUARDANDO_PAGAMENTO', 'CANCELADO', 'ENVIADO', 'PAGO']
    );
    assert.deepStrictEqual(pagamentos_por_metodo.map((m) => m.metodo).sort(), ['BOLETO', 'PIX']);
  });

  test('categorias, produtos, estados e cupons batem com os pedidos', () => {
    const comCupom = cenarioDeCompra({ precoCentavos: 30000 });
    const resumoCarrinho = require('../../src/services/carrinhoService').detalhar(comCupom.usuario, comCupom.carrinho.id_carrinho, 'BEMVINDO50');
    const pedido = pedidoService.checkout(comCupom.usuario, { id_endereco: comCupom.endereco.id_endereco, id_cupom: resumoCarrinho.cupom.id_cupom });
    const pagamento = pagamentoService.criar(comCupom.usuario, { id_pedido: pedido.id_pedido, metodo: 'PIX' });
    pagamentoService.atualizar(pagamento.id_pagamento, { status: 'APROVADO' });

    const dados = relatorioService.dados();
    const bemVindo = dados.cupons.find((c) => c.codigo === 'BEMVINDO50');
    assert.strictEqual(bemVindo.usos, 1);
    assert.strictEqual(bemVindo.desconto_centavos, 15000);

    const produto = dados.produtos_mais_vendidos.find((p) => p.codigo === comCupom.produto.codigo);
    assert.strictEqual(produto.quantidade, 1);
    assert.strictEqual(produto.faturamento_bruto_centavos, 30000);

    const somaCategorias = dados.vendas_por_categoria.reduce((soma, c) => soma + c.faturamento_bruto_centavos, 0);
    const somaProdutos = dados.produtos_mais_vendidos.reduce((soma, p) => soma + p.faturamento_bruto_centavos, 0);
    assert.strictEqual(somaCategorias, somaProdutos);

    const somaEstados = dados.vendas_por_estado.reduce((soma, e) => soma + e.faturamento_centavos, 0);
    const somaDias = dados.vendas_por_dia.reduce((soma, d) => soma + d.faturamento_centavos, 0);
    assert.strictEqual(somaEstados, dados.resumo.faturamento_centavos);
    assert.strictEqual(somaDias, dados.resumo.faturamento_centavos);
  });

  test('a lista de pedidos traz cada pedido com pagamento, cupom e local', () => {
    const { pedidos } = relatorioService.dados();
    const comCupom = pedidos.find((p) => p.cupom === 'BEMVINDO50');
    assert.ok(comCupom);
    assert.strictEqual(comCupom.metodo_pagamento, 'PIX');
    assert.strictEqual(comCupom.status_pagamento, 'APROVADO');
    assert.strictEqual(comCupom.uf, 'SP');
    assert.strictEqual(comCupom.quantidade_itens, 1);
    assert.ok(pedidos.every((p) => p.status !== 'RASCUNHO'));
  });

  test('nome do arquivo para download usa a data da geração', () => {
    assert.strictEqual(relatorioService.nomeDoArquivo('2026-11-22T14:30:00Z'), 'mccar-dados-2026-11-22.json');
  });
});

describe('cepService', () => {
  beforeEach(() => mock.restoreAll());

  test('aceita CEP com ou sem traço e devolve só dígitos', () => {
    assert.strictEqual(cepService.normalizarCep('01001-000'), '01001000');
    assert.strictEqual(cepService.normalizarCep(' 01001000 '), '01001000');
  });

  test('CEP com tamanho errado devolve 400 sem consultar o serviço', async () => {
    const consulta = mock.method(viaCep, 'buscarCep', async () => ({}));
    assert.throws(() => cepService.normalizarCep('123'), comStatus(400));
    await assert.rejects(cepService.buscar('abcdefgh'), comStatus(400));
    assert.strictEqual(consulta.mock.callCount(), 0);
  });

  test('traduz a resposta do ViaCEP para os campos do endereço', async () => {
    mock.method(viaCep, 'buscarCep', async () => ({ cep: '01001-000', logradouro: 'Praça da Sé', complemento: 'lado ímpar', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }));
    assert.deepStrictEqual(await cepService.buscar('01001-000'), {
      cep: '01001000',
      logradouro: 'Praça da Sé',
      complemento: 'lado ímpar',
      bairro: 'Sé',
      cidade: 'São Paulo',
      uf: 'SP',
    });
  });

  test('CEP inexistente devolve 404', async () => {
    mock.method(viaCep, 'buscarCep', async () => null);
    await assert.rejects(cepService.buscar('99999999'), comStatus(404));
  });

  test('ViaCEP fora do ar devolve 502', async () => {
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('sem rede');
    });
    await assert.rejects(viaCep.buscarCep('01001000'), comStatus(502));
  });

  test('resposta de erro do ViaCEP vira "não encontrado"', async () => {
    mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ erro: 'true' }) }));
    assert.strictEqual(await viaCep.buscarCep('99999999'), null);
  });
});
