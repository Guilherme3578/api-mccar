process.env.PAGAMENTO_APROVACAO_AUTOMATICA = 'true';

const { test } = require('node:test');
const { iniciar, etapa, conferir, req, cadastrar, promoverAdmin, finalizar } = require('./apoio');

test('Aprovação automática do pagamento', async () => {
  await iniciar();
  try {
    const adm = await cadastrar('Admin', 'admin@p.com');
    promoverAdmin('admin@p.com');
    const cat = await req(adm.token, 'POST', '/categorias', { nome: 'Freios' }, 201, 'categoria');
    const produto = await req(adm.token, 'POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'P1', nome: 'Pastilha', marca: 'Bosch', descricao: 'x', preco_centavos: 15000 }, 201, 'produto');

    const ana = await cadastrar('Ana', 'ana@p.com');
    const end = await req(ana.token, 'POST', '/enderecos', { logradouro: 'Rua', numero: '1', bairro: 'C', cidade: 'SP', uf: 'SP', cep: '01001000' }, 201, 'endereço');
    const cartao = await req(ana.token, 'POST', '/cartoes', { bandeira: 'Visa', ultimos_quatro: '1234', nome_titular: 'ANA' }, 201, 'cartão');
    const car = await req(ana.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho');

    async function comprar(metodo, extra = {}) {
      await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: produto.id_produto, quantidade: 1 }, 201, 'item no carrinho');
      const pedido = await req(ana.token, 'POST', '/pedidos/checkout', { id_endereco: end.id_endereco }, 201, 'checkout');
      const pagamento = await req(ana.token, 'POST', '/pagamentos', { id_pedido: pedido.id_pedido, metodo, ...extra }, 201, `pagamento ${metodo}`);
      const detalhe = await req(ana.token, 'GET', `/pedidos/${pedido.id_pedido}`, null, 200, 'consulta do pedido');
      return { pagamento, detalhe };
    }

    etapa('PIX e cartão aprovam na hora');
    let r = await comprar('PIX');
    conferir(r.pagamento.status === 'APROVADO' && r.pagamento.aprovado_em, 'PIX volta APROVADO com aprovado_em', r.pagamento);
    conferir(r.detalhe.status === 'PAGO', 'pedido pago com PIX fica PAGO', r.detalhe.status);
    r = await comprar('CARTAO', { id_cartao: cartao.id_cartao });
    conferir(r.pagamento.status === 'APROVADO', 'cartão volta APROVADO', r.pagamento);
    conferir(r.detalhe.status === 'PAGO', 'pedido pago com cartão fica PAGO', r.detalhe.status);

    etapa('boleto continua aguardando compensação');
    r = await comprar('BOLETO');
    conferir(r.pagamento.status === 'PENDENTE', 'boleto fica PENDENTE', r.pagamento);
    conferir(r.detalhe.status === 'AGUARDANDO_PAGAMENTO', 'pedido com boleto aguarda pagamento', r.detalhe.status);

    etapa('o resto do fluxo continua valendo');
    r = await comprar('PIX');
    await req(ana.token, 'PUT', `/pedidos/${r.detalhe.id_pedido}`, { status: 'CANCELADO' }, 403, 'cliente não cancela pedido já pago');
    await req(adm.token, 'PUT', `/pedidos/${r.detalhe.id_pedido}`, { status: 'ENVIADO' }, 200, 'admin envia o pedido');
    await req(ana.token, 'POST', '/pagamentos', { id_pedido: r.detalhe.id_pedido, metodo: 'PIX' }, 400, 'não paga duas vezes');
  } finally {
    finalizar();
  }
});
