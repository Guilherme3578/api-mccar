const { describe, test, after } = require('node:test');
const assert = require('node:assert');
const { cenarioDeCompra, encerrar } = require('./ambiente');
const AppError = require('../../src/utils/AppError');
const carregarQueries = require('../../src/database/carregarQueries');
const pedidoService = require('../../src/services/pedidoService');
const pagamentoService = require('../../src/services/pagamentoService');
const carrinhoService = require('../../src/services/carrinhoService');
const cupomService = require('../../src/services/cupomService');
const usuarioService = require('../../src/services/usuarioService');

after(encerrar);

cupomService.garantirCupomBoasVindas();

const comStatus = (status, trecho) => (erro) => erro instanceof AppError && erro.status === status && (!trecho || erro.message.includes(trecho));
const admin = { id_usuario: 0, perfil: 'ADMIN' };

describe('carregarQueries', () => {
  test('devolve a query preparada pelo nome do arquivo', () => {
    assert.strictEqual(typeof carregarQueries('produto').listar.all, 'function');
  });

  test('acusa o nome de uma query que não existe', () => {
    assert.throws(() => carregarQueries('produto').listarTudo, /Query "listarTudo" não encontrada em queries\/produto/);
  });
});

describe('usuarioService', () => {
  test('cadastro normaliza o e-mail, nasce CLIENTE e oferece o cupom de boas-vindas', () => {
    const usuario = usuarioService.criar({ nome: ' Bia ', email: ' Bia@Teste.COM ', senha: '123456' });
    assert.strictEqual(usuario.email, 'bia@teste.com');
    assert.strictEqual(usuario.nome, 'Bia');
    assert.strictEqual(usuario.perfil, 'CLIENTE');
    assert.strictEqual(usuario.cupom_boas_vindas, 'BEMVINDO50');
    assert.ok(!('senha_hash' in usuario));
  });

  test('e-mail repetido e senha curta são recusados', () => {
    assert.throws(() => usuarioService.criar({ nome: 'Bia', email: 'BIA@teste.com', senha: '123456' }), comStatus(409));
    assert.throws(() => usuarioService.criar({ nome: 'Caio', email: 'caio@teste.com', senha: '123' }), comStatus(400, '6 caracteres'));
  });

  test('login devolve token e recusa senha errada com a mesma mensagem de e-mail inexistente', () => {
    const { token, usuario } = usuarioService.login({ email: 'bia@teste.com', senha: '123456' });
    assert.ok(token.split('.').length === 3 && !('senha_hash' in usuario));
    let erroSenha;
    let erroEmail;
    try { usuarioService.login({ email: 'bia@teste.com', senha: 'errada' }); } catch (e) { erroSenha = e; }
    try { usuarioService.login({ email: 'ninguem@teste.com', senha: 'errada' }); } catch (e) { erroEmail = e; }
    assert.strictEqual(erroSenha.status, 401);
    assert.strictEqual(erroSenha.message, erroEmail.message);
  });
});

describe('resumo do carrinho e checkout', () => {
  test('o pedido sai com os mesmos valores que o resumo do carrinho mostrou', () => {
    const { usuario, endereco, carrinho } = cenarioDeCompra({ precoCentavos: 6000, quantidade: 3 });
    const resumo = carrinhoService.detalhar(usuario, carrinho.id_carrinho, 'BEMVINDO50');
    const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco, id_cupom: resumo.cupom.id_cupom });

    for (const campo of ['subtotal_centavos', 'desconto_centavos', 'frete_centavos', 'total_centavos', 'prazo_min_dias', 'prazo_max_dias']) {
      assert.strictEqual(pedido[campo], resumo[campo], campo);
    }
    assert.strictEqual(pedido.total_centavos, 18000 - 9000 + 2990);
    assert.match(pedido.numero, /^MC-\d{5}$/);
    assert.strictEqual(carrinhoService.detalhar(usuario, carrinho.id_carrinho).quantidade_itens, 0);
  });

  test('carrinho vazio não vira pedido', () => {
    const { usuario, endereco, carrinho } = cenarioDeCompra();
    pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco });
    assert.throws(() => pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco }), comStatus(400, 'vazio'));
    assert.strictEqual(carrinhoService.detalhar(usuario, carrinho.id_carrinho).total_centavos, 0);
  });

  test('endereço de outro usuário é recusado com 403', () => {
    const ana = cenarioDeCompra();
    const bruno = cenarioDeCompra();
    assert.throws(() => pedidoService.checkout(bruno.usuario, { id_endereco: ana.endereco.id_endereco }), comStatus(403));
  });
});

describe('status do pedido', () => {
  function pedidoAguardando() {
    const { usuario, endereco } = cenarioDeCompra();
    return { usuario, pedido: pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco }) };
  }

  test('ninguém marca PAGO na mão', () => {
    const { usuario, pedido } = pedidoAguardando();
    assert.throws(() => pedidoService.atualizar(admin, pedido.id_pedido, { status: 'PAGO' }), comStatus(400, 'automaticamente'));
    assert.throws(() => pedidoService.atualizar(usuario, pedido.id_pedido, { status: 'PAGO' }), comStatus(400));
  });

  test('não pula etapas', () => {
    const { pedido } = pedidoAguardando();
    assert.throws(() => pedidoService.atualizar(admin, pedido.id_pedido, { status: 'ENTREGUE' }), comStatus(400, 'Não é possível'));
  });

  test('depois de pago, só o admin altera', () => {
    const { usuario, pedido } = pedidoAguardando();
    const pagamento = pagamentoService.criar(usuario, { id_pedido: pedido.id_pedido, metodo: 'PIX' });
    pagamentoService.atualizar(pagamento.id_pagamento, { status: 'APROVADO' });
    assert.throws(() => pedidoService.atualizar(usuario, pedido.id_pedido, { status: 'CANCELADO' }), comStatus(403));
    assert.strictEqual(pedidoService.atualizar(admin, pedido.id_pedido, { status: 'ENVIADO' }).status, 'ENVIADO');
  });

  test('cancelar um pedido pago estorna o pagamento', () => {
    const { usuario, pedido } = pedidoAguardando();
    const pagamento = pagamentoService.criar(usuario, { id_pedido: pedido.id_pedido, metodo: 'PIX' });
    pagamentoService.atualizar(pagamento.id_pagamento, { status: 'APROVADO' });
    pedidoService.atualizar(admin, pedido.id_pedido, { status: 'CANCELADO' });
    const depois = pagamentoService.buscar(admin, pagamento.id_pagamento);
    assert.strictEqual(depois.status, 'ESTORNADO');
    assert.ok(depois.aprovado_em, 'o histórico de aprovação é mantido');
  });
});

describe('status do pagamento', () => {
  function pagamentoPendente(metodo = 'PIX') {
    const { usuario, endereco } = cenarioDeCompra();
    const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco });
    return { usuario, pedido, pagamento: pagamentoService.criar(usuario, { id_pedido: pedido.id_pedido, metodo }) };
  }

  test('o valor do pagamento é sempre o total do pedido', () => {
    const { pedido, pagamento } = pagamentoPendente();
    assert.strictEqual(pagamento.valor_centavos, pedido.total_centavos);
  });

  test('aprovar o pagamento marca o pedido como PAGO', () => {
    const { pedido, pagamento } = pagamentoPendente();
    const aprovado = pagamentoService.atualizar(pagamento.id_pagamento, { status: 'APROVADO' });
    assert.ok(aprovado.aprovado_em);
    assert.strictEqual(pedidoService.buscarPorId(pedido.id_pedido).status, 'PAGO');
  });

  test('transições inválidas são recusadas', () => {
    const { pagamento } = pagamentoPendente();
    assert.throws(() => pagamentoService.atualizar(pagamento.id_pagamento, { status: 'ESTORNADO' }), comStatus(400));
    pagamentoService.atualizar(pagamento.id_pagamento, { status: 'RECUSADO' });
    assert.throws(() => pagamentoService.atualizar(pagamento.id_pagamento, { status: 'APROVADO' }), comStatus(400));
  });

  test('depois de recusado, o cliente pode tentar de novo no mesmo registro', () => {
    const { usuario, pedido, pagamento } = pagamentoPendente();
    pagamentoService.atualizar(pagamento.id_pagamento, { status: 'RECUSADO' });
    const novaTentativa = pagamentoService.criar(usuario, { id_pedido: pedido.id_pedido, metodo: 'BOLETO' });
    assert.strictEqual(novaTentativa.id_pagamento, pagamento.id_pagamento);
    assert.strictEqual(novaTentativa.status, 'PENDENTE');
  });

  test('cartão novo sem salvar guarda só a bandeira e o final', () => {
    const { usuario, endereco } = cenarioDeCompra();
    const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco });
    const pagamento = pagamentoService.criar(usuario, {
      id_pedido: pedido.id_pedido,
      metodo: 'CARTAO',
      cartao: { bandeira: 'visa', ultimos_quatro: '4242', nome_titular: 'Ana', numero: '4242424242424242' },
    });
    assert.strictEqual(pagamento.cartao_bandeira, 'VISA');
    assert.strictEqual(pagamento.cartao_final, '4242');
    assert.ok(!JSON.stringify(pagamento).includes('4242424242424242'));
  });

  test('MERCADO_PAGO não é aceito no pagamento simulado', () => {
    const { usuario, endereco } = cenarioDeCompra();
    const pedido = pedidoService.checkout(usuario, { id_endereco: endereco.id_endereco });
    assert.throws(() => pagamentoService.criar(usuario, { id_pedido: pedido.id_pedido, metodo: 'MERCADO_PAGO' }), comStatus(400, '/pagamentos/mercado-pago'));
  });
});
