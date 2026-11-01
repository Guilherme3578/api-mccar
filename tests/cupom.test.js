const { test } = require('node:test');
const { iniciar, etapa, falhar, conferir, req, cadastrar, promoverAdmin, finalizar } = require('./apoio');

async function usuario(nome, email) {
  const u = await cadastrar(nome, email);
  const end = await req(u.token, 'POST', '/enderecos', { logradouro: 'Rua', numero: '1', bairro: 'C', cidade: 'SP', uf: 'SP', cep: '01001000' }, 201, `endereço ${nome}`);
  return { ...u, id_endereco: end.id_endereco };
}

test('Cupom por usuário e cupom de boas-vindas', async () => {
  await iniciar();
  try {
    etapa('preparação');
    const adm = await usuario('Admin', 'admin@t.com');
    promoverAdmin('admin@t.com');
    const cat = await req(adm.token, 'POST', '/categorias', { nome: 'Freios' }, 201, 'categoria');
    const pastilha = await req(adm.token, 'POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'P1', nome: 'Pastilha', marca: 'Bosch', descricao: 'x', preco_centavos: 15000 }, 201, 'Pastilha R$150');
    const mc10 = await req(adm.token, 'POST', '/cupons', { codigo: 'MC10', tipo: 'PERCENTUAL', valor: 10 }, 201, 'cupom MC10');

    const ana = await usuario('Ana', 'ana@t.com');
    const bia = await usuario('Bia', 'bia@t.com');
    const caio = await usuario('Caio', 'caio@t.com');
    conferir(ana.cupom_boas_vindas === 'BEMVINDO50', 'cadastro devolve o cupom de boas-vindas', ana);
    const bv = await req(ana.token, 'GET', '/cupons/codigo/BEMVINDO50', null, 200, 'BEMVINDO50 foi criado automaticamente na inicialização');
    conferir(bv.tipo === 'PERCENTUAL' && bv.valor === 50, 'BEMVINDO50 = 50%', bv);

    async function pedidoComItem(u, idCupom) {
      const p = await req(u.token, 'POST', '/pedidos', { id_endereco: u.id_endereco, id_cupom: idCupom }, 201, 'pedido');
      await req(u.token, 'POST', `/pedidos/${p.id_pedido}/itens`, { id_produto: pastilha.id_produto, quantidade: 1 }, 201, 'item Pastilha R$150');
      return p;
    }

    etapa('cupom de boas-vindas na primeira compra');
    const p1 = await pedidoComItem(ana, bv.id_cupom);
    let d = await req(ana.token, 'GET', `/pedidos/${p1.id_pedido}`, null, 200, 'consulta');
    conferir(d.desconto_centavos === 7500 && d.frete_centavos === 2990 && d.total_centavos === 10490, 'R$150 - 50% = R$75 em produtos, abaixo de R$100: paga frete', d);
    await req(ana.token, 'PUT', `/pedidos/${p1.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'Ana finaliza a primeira compra com BEMVINDO50');
    await req(ana.token, 'POST', '/pedidos', { id_endereco: ana.id_endereco, id_cupom: bv.id_cupom }, 400, 'Ana tenta BEMVINDO50 de novo');

    etapa('cupom comum: uma vez por usuário');
    const p2 = await pedidoComItem(ana, mc10.id_cupom);
    await req(ana.token, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'Ana usa MC10');
    await req(ana.token, 'POST', '/pedidos', { id_endereco: ana.id_endereco, id_cupom: mc10.id_cupom }, 400, 'Ana tenta MC10 de novo');
    const p3 = await pedidoComItem(bia, mc10.id_cupom);
    await req(bia.token, 'PUT', `/pedidos/${p3.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'Bia também pode usar MC10 (é por usuário)');

    etapa('cancelamento devolve o cupom');
    await req(bia.token, 'PUT', `/pedidos/${p3.id_pedido}`, { status: 'CANCELADO' }, 200, 'Bia cancela o pedido com MC10');
    const p4 = await pedidoComItem(bia, mc10.id_cupom);
    await req(bia.token, 'PUT', `/pedidos/${p4.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'Bia usa MC10 de novo depois de cancelar');

    etapa('boas-vindas só vale se for a primeira compra');
    const p5 = await req(bia.token, 'POST', '/pedidos', { id_endereco: bia.id_endereco, id_cupom: bv.id_cupom }, 400, 'Bia (já comprou) tenta BEMVINDO50');

    etapa('dois rascunhos com o mesmo cupom: só o primeiro a finalizar leva');
    const r1 = await pedidoComItem(caio, bv.id_cupom);
    const r2 = await pedidoComItem(caio, bv.id_cupom);
    await req(caio.token, 'PUT', `/pedidos/${r1.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'Caio finaliza o 1º rascunho');
    await req(caio.token, 'PUT', `/pedidos/${r2.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 400, 'Caio tenta finalizar o 2º com o mesmo cupom');

    etapa('checkout com cupom de boas-vindas');
    const duda = await usuario('Duda', 'duda@t.com');
    const car = await req(duda.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho');
    await req(duda.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: pastilha.id_produto, quantidade: 2 }, 201, '2 pastilhas = R$300');
    const ck = await req(duda.token, 'POST', '/pedidos/checkout', { id_endereco: duda.id_endereco, id_cupom: bv.id_cupom }, 201, 'checkout com BEMVINDO50');
    conferir(ck.desconto_centavos === 15000 && ck.frete_centavos === 0 && ck.total_centavos === 15000, 'R$300 - 50% = R$150, acima de R$100: frete grátis', ck);

    etapa('cupom desativado não é oferecido no cadastro');
    await req(adm.token, 'PUT', `/cupons/${bv.id_cupom}`, { ativo: false }, 200, 'admin desativa BEMVINDO50');
    const eva = await req(null, 'POST', '/usuarios', { nome: 'Eva', email: 'eva@t.com', senha: '123456' }, 201, 'cadastro Eva');
    conferir(eva.cupom_boas_vindas === null, 'cadastro não devolve cupom desativado', eva);
  } finally {
    finalizar();
  }
});
