const { test } = require('node:test');
const { iniciar, etapa, conferir, req, cadastrar, promoverAdmin, finalizar } = require('./apoio');

test('Rotas do Mercado Pago', async () => {
  await iniciar();
  try {
    const adm = await cadastrar('Admin', 'admin@mp.com');
    promoverAdmin('admin@mp.com');
    const cat = await req(adm.token, 'POST', '/categorias', { nome: 'Freios' }, 201, 'categoria');
    const produto = await req(adm.token, 'POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'P1', nome: 'Pastilha', marca: 'Bosch', descricao: 'x', preco_centavos: 15000 }, 201, 'produto');
    const ana = await cadastrar('Ana', 'ana@mp.com');
    const end = await req(ana.token, 'POST', '/enderecos', { logradouro: 'Rua', numero: '1', bairro: 'C', cidade: 'SP', uf: 'SP', cep: '01001000' }, 201, 'endereço');
    const car = await req(ana.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho');
    await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: produto.id_produto, quantidade: 1 }, 201, 'item');
    const pedido = await req(ana.token, 'POST', '/pedidos/checkout', { id_endereco: end.id_endereco }, 201, 'checkout');

    etapa('autenticação');
    await req(null, 'POST', '/pagamentos/mercado-pago', { id_pedido: pedido.id_pedido }, 401, 'iniciar exige login');
    await req(null, 'POST', '/pagamentos/mercado-pago/sincronizar', { id_pedido: pedido.id_pedido }, 401, 'sincronizar exige login');

    etapa('sem credencial configurada');
    const semCredencial = await req(ana.token, 'POST', '/pagamentos/mercado-pago', { id_pedido: pedido.id_pedido }, 503, 'avisa que falta o MP_ACCESS_TOKEN');
    conferir(semCredencial?.erro?.includes('MP_ACCESS_TOKEN'), 'mensagem explica o que configurar', semCredencial);
    await req(ana.token, 'POST', '/pagamentos/mercado-pago', {}, 400, 'id_pedido obrigatório');
    await req(ana.token, 'POST', '/pagamentos/mercado-pago/sincronizar', { id_pedido: pedido.id_pedido }, 404, 'pedido sem checkout do Mercado Pago');

    etapa('webhook público');
    const ignorado = await req(null, 'POST', '/pagamentos/mercado-pago/webhook?type=merchant_order&data.id=1', { type: 'merchant_order', data: { id: '1' } }, 200, 'webhook não exige login e responde 200');
    conferir(ignorado?.processado === false, 'notificação de outro tipo é ignorada', ignorado);

    etapa('sem conflito com /pagamentos/:id');
    await req(ana.token, 'GET', '/pagamentos', null, 200, 'lista de pagamentos continua funcionando');
    await req(ana.token, 'POST', '/pagamentos', { id_pedido: pedido.id_pedido, metodo: 'MERCADO_PAGO' }, 400, 'MERCADO_PAGO não entra pelo pagamento simulado');
  } finally {
    finalizar();
  }
});
