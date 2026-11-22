const { test } = require('node:test');
const { iniciar, etapa, falhar, conferir, req, cadastrar: usuario, promoverAdmin, finalizar } = require('./apoio');

test('Regras de negócio (R1 a R6)', async () => {
  await iniciar();
  try {
    etapa('preparação');
    const adm = await usuario('Admin', 'admin@t.com');
    promoverAdmin('admin@t.com');
    const ana = await usuario('Ana', 'ana@t.com');
    const A = ana.token;
    const ADM = adm.token;

    const cat = await req(ADM, 'POST', '/categorias', { nome: 'Freios' }, 201, 'categoria');
    const pastilha = await req(ADM, 'POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'P1', nome: 'Pastilha', marca: 'Bosch', descricao: 'x', preco_centavos: 10000, prazo_envio_horas: 48, frete_gratis_acima_centavos: 30000, avaliacao_media: 5, avaliacao_quantidade: 999 }, 201, 'produto com frete grátis acima de R$300');
    const disco = await req(ADM, 'POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'D1', nome: 'Disco', marca: 'Fremax', descricao: 'x', preco_centavos: 20000, prazo_envio_horas: 24, frete_gratis_acima_centavos: 20000 }, 201, 'produto com frete grátis acima de R$200');
    const oleo = await req(ADM, 'POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'O1', nome: 'Óleo', marca: 'Mobil', descricao: 'x', preco_centavos: 5000 }, 201, 'produto sem frete grátis');
    conferir(pastilha.avaliacao_media === null && pastilha.avaliacao_quantidade === 0, 'R6: avaliacao enviada no cadastro é ignorada', pastilha);
    const end1 = await req(A, 'POST', '/enderecos', { logradouro: 'Rua A', numero: '1', bairro: 'C', cidade: 'SP', uf: 'SP', cep: '01001000' }, 201, 'endereço 1');
    const end2 = await req(A, 'POST', '/enderecos', { logradouro: 'Rua B', numero: '2', bairro: 'C', cidade: 'SP', uf: 'SP', cep: '01001000' }, 201, 'endereço 2');
    const cartao = await req(A, 'POST', '/cartoes', { bandeira: 'visa', ultimos_quatro: '4242', nome_titular: 'ana' }, 201, 'cartão');

    async function pedidoPronto(itens) {
      const p = await req(A, 'POST', '/pedidos', { id_endereco: end1.id_endereco }, 201, 'pedido novo');
      for (const [produto, quantidade] of itens) {
        await req(A, 'POST', `/pedidos/${p.id_pedido}/itens`, { id_produto: produto.id_produto, quantidade }, 201, `item ${produto.nome} x${quantidade}`);
      }
      return p;
    }

    etapa('R3: frete e prazo calculados no backend');
    const p1 = await req(A, 'POST', '/pedidos', { id_endereco: end1.id_endereco, frete_centavos: 0, prazo_min_dias: 0 }, 201, 'pedido tentando mandar frete 0');
    conferir(p1.frete_centavos === 0 && p1.total_centavos === 0, 'pedido vazio: frete 0', p1);
    await req(A, 'POST', `/pedidos/${p1.id_pedido}/itens`, { id_produto: oleo.id_produto, quantidade: 1 }, 201, 'adiciona Óleo R$50');
    let d = await req(A, 'GET', `/pedidos/${p1.id_pedido}`, null, 200, 'consulta');
    conferir(d.frete_centavos === 2990 && d.total_centavos === 7990, 'abaixo de R$100: frete R$29,90', d);
    conferir(d.prazo_min_dias === 2 && d.prazo_max_dias === 7, 'prazo sem tempo de envio: 2 a 7 dias', d);
    await req(A, 'PUT', `/pedidos/${p1.id_pedido}`, { frete_centavos: 0 }, 200, 'tenta zerar frete no PUT');
    d = await req(A, 'GET', `/pedidos/${p1.id_pedido}`, null, 200, 'consulta');
    conferir(d.frete_centavos === 2990, 'frete enviado pelo app é ignorado', d);
    await req(A, 'PUT', `/pedidos/${p1.id_pedido}/itens/${oleo.id_produto}`, { quantidade: 2 }, 200, 'Óleo x2 = R$100 exatos');
    d = await req(A, 'GET', `/pedidos/${p1.id_pedido}`, null, 200, 'consulta');
    conferir(d.frete_centavos === 0 && d.total_centavos === 10000, 'R$100 exatos: frete grátis', d);
    await req(A, 'POST', `/pedidos/${p1.id_pedido}/itens`, { id_produto: pastilha.id_produto, quantidade: 1 }, 201, 'adiciona Pastilha (48h de envio)');
    d = await req(A, 'GET', `/pedidos/${p1.id_pedido}`, null, 200, 'consulta');
    conferir(d.prazo_min_dias === 4 && d.prazo_max_dias === 9, 'prazo: 2 dias de envio + 2 a 7 de transporte', d);

    etapa('R4: cupom revalidado na finalização');
    const cMin = await req(ADM, 'POST', '/cupons', { codigo: 'MIN500', tipo: 'VALOR', valor: 5000, minimo_compra_centavos: 50000 }, 201, 'cupom com mínimo R$500');
    const p2 = await pedidoPronto([[pastilha, 1]]);
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { id_cupom: cMin.id_cupom }, 200, 'vincula cupom com mínimo não atingido (rascunho aceita)');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 400, 'finaliza sem atingir o mínimo');
    const cExp = await req(ADM, 'POST', '/cupons', { codigo: 'EXPIRA', tipo: 'PERCENTUAL', valor: 10 }, 201, 'cupom 10%');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { id_cupom: cExp.id_cupom }, 200, 'troca para cupom válido');
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await req(ADM, 'PUT', `/cupons/${cExp.id_cupom}`, { valido_ate: ontem }, 200, 'admin faz o cupom expirar');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 400, 'finaliza com cupom expirado');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { id_cupom: null }, 200, 'remove o cupom');

    etapa('R1: transições de status do pedido');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'ENVIADO' }, 400, 'RASCUNHO -> ENVIADO');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'PAGO' }, 400, 'cliente RASCUNHO -> PAGO');
    await req(ADM, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'PAGO' }, 400, 'admin também não marca PAGO manualmente');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'RASCUNHO -> AGUARDANDO_PAGAMENTO');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'RASCUNHO' }, 400, 'AGUARDANDO_PAGAMENTO -> RASCUNHO');
    const pag2 = await req(A, 'POST', '/pagamentos', { id_pedido: p2.id_pedido, metodo: 'PIX' }, 201, 'pagamento PIX pendente');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'CANCELADO' }, 200, 'cliente cancela pedido aguardando pagamento');
    d = await req(A, 'GET', `/pagamentos/${pag2.id_pagamento}`, null, 200, 'consulta pagamento');
    conferir(d.status === 'RECUSADO', 'cancelar o pedido recusa o pagamento pendente', d);
    await req(ADM, 'PUT', `/pagamentos/${pag2.id_pagamento}`, { status: 'APROVADO' }, 400, 'aprovar pagamento de pedido cancelado');
    await req(A, 'PUT', `/pedidos/${p2.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 400, 'CANCELADO -> AGUARDANDO_PAGAMENTO');

    etapa('R2: transições do pagamento e sincronia com o pedido');
    const p3 = await pedidoPronto([[pastilha, 1]]);
    await req(A, 'PUT', `/pedidos/${p3.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'finaliza');
    const pag3 = await req(A, 'POST', '/pagamentos', { id_pedido: p3.id_pedido, metodo: 'PIX' }, 201, 'paga com PIX');
    await req(ADM, 'PUT', `/pagamentos/${pag3.id_pagamento}`, { status: 'ESTORNADO' }, 400, 'PENDENTE -> ESTORNADO');
    await req(ADM, 'PUT', `/pagamentos/${pag3.id_pagamento}`, { status: 'RECUSADO' }, 200, 'operadora recusa');
    const nova = await req(A, 'POST', '/pagamentos', { id_pedido: p3.id_pedido, metodo: 'CARTAO', id_cartao: cartao.id_cartao }, 201, 'R6: nova tentativa após recusa');
    conferir(nova.id_pagamento === pag3.id_pagamento && nova.status === 'PENDENTE' && nova.metodo === 'CARTAO', 'tentativa reaproveita o pagamento (UNIQUE do DER)', nova);
    await req(A, 'POST', '/pagamentos', { id_pedido: p3.id_pedido, metodo: 'PIX' }, 409, 'segunda tentativa com pagamento pendente');
    const ap = await req(ADM, 'PUT', `/pagamentos/${pag3.id_pagamento}`, { status: 'APROVADO' }, 200, 'aprova');
    d = await req(A, 'GET', `/pedidos/${p3.id_pedido}`, null, 200, 'consulta pedido');
    conferir(d.status === 'PAGO', 'aprovar o pagamento marca o pedido PAGO', d.status);
    await req(ADM, 'PUT', `/pagamentos/${pag3.id_pagamento}`, { status: 'PENDENTE' }, 400, 'APROVADO -> PENDENTE');
    await req(A, 'PUT', `/pedidos/${p3.id_pedido}`, { status: 'CANCELADO' }, 403, 'cliente cancela pedido já PAGO');
    await req(ADM, 'DELETE', `/pagamentos/${pag3.id_pagamento}`, null, 400, 'excluir pagamento aprovado');
    const est = await req(ADM, 'PUT', `/pagamentos/${pag3.id_pagamento}`, { status: 'ESTORNADO' }, 200, 'admin estorna');
    conferir(est.aprovado_em === ap.aprovado_em && est.aprovado_em !== null, 'estorno mantém aprovado_em no histórico', est);
    d = await req(A, 'GET', `/pedidos/${p3.id_pedido}`, null, 200, 'consulta pedido');
    conferir(d.status === 'CANCELADO', 'estorno cancela o pedido', d.status);

    const p4 = await pedidoPronto([[pastilha, 1]]);
    await req(A, 'PUT', `/pedidos/${p4.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'finaliza');
    const pag4 = await req(A, 'POST', '/pagamentos', { id_pedido: p4.id_pedido, metodo: 'BOLETO' }, 201, 'paga com boleto');
    await req(ADM, 'PUT', `/pagamentos/${pag4.id_pagamento}`, { status: 'APROVADO' }, 200, 'aprova');
    await req(ADM, 'PUT', `/pedidos/${p4.id_pedido}`, { status: 'ENVIADO' }, 200, 'admin PAGO -> ENVIADO');
    await req(ADM, 'PUT', `/pagamentos/${pag4.id_pagamento}`, { status: 'ESTORNADO' }, 400, 'estorno de pedido já enviado');
    await req(ADM, 'PUT', `/pedidos/${p4.id_pedido}`, { status: 'CANCELADO' }, 400, 'ENVIADO -> CANCELADO');
    await req(ADM, 'PUT', `/pedidos/${p4.id_pedido}`, { status: 'ENTREGUE' }, 200, 'ENVIADO -> ENTREGUE');
    await req(ADM, 'PUT', `/pedidos/${p4.id_pedido}`, { status: 'CANCELADO' }, 400, 'ENTREGUE -> CANCELADO');

    const p5 = await pedidoPronto([[pastilha, 1]]);
    await req(A, 'PUT', `/pedidos/${p5.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'finaliza');
    const pag5 = await req(A, 'POST', '/pagamentos', { id_pedido: p5.id_pedido, metodo: 'PIX' }, 201, 'paga');
    await req(ADM, 'PUT', `/pagamentos/${pag5.id_pagamento}`, { status: 'APROVADO' }, 200, 'aprova');
    await req(ADM, 'PUT', `/pedidos/${p5.id_pedido}`, { status: 'CANCELADO' }, 200, 'admin cancela pedido PAGO');
    d = await req(A, 'GET', `/pagamentos/${pag5.id_pagamento}`, null, 200, 'consulta pagamento');
    conferir(d.status === 'ESTORNADO', 'cancelar pedido pago estorna o pagamento', d.status);

    etapa('R5: checkout do carrinho');
    const car = await req(A, 'GET', '/carrinhos/meu', null, 200, 'R6: carrinho já existe desde o cadastro');
    await req(A, 'POST', '/carrinhos', {}, 409, 'criar segundo carrinho');
    await req(A, 'POST', '/pedidos/checkout', { id_endereco: end1.id_endereco }, 400, 'checkout com carrinho vazio');
    await req(A, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: pastilha.id_produto, quantidade: 2 }, 201, 'carrinho: 2 pastilhas');
    await req(A, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: oleo.id_produto, quantidade: 1 }, 201, 'carrinho: 1 óleo');
    await req(ADM, 'PUT', `/produtos/${oleo.id_produto}`, { ativo: false }, 200, 'admin desativa o óleo');
    const antes = await req(A, 'GET', '/pedidos', null, 200, 'conta pedidos');
    await req(A, 'POST', '/pedidos/checkout', { id_endereco: end1.id_endereco }, 400, 'checkout com produto desativado');
    const depois = await req(A, 'GET', '/pedidos', null, 200, 'conta pedidos');
    conferir(antes.length === depois.length, 'checkout com erro não deixa pedido pela metade (rollback)', { antes: antes.length, depois: depois.length });
    await req(A, 'DELETE', `/carrinhos/${car.id_carrinho}/itens/${oleo.id_produto}`, null, 204, 'tira o óleo');
    const ck = await req(A, 'POST', '/pedidos/checkout', { id_endereco: end2.id_endereco }, 201, 'checkout');
    conferir(ck.status === 'AGUARDANDO_PAGAMENTO' && ck.itens.length === 1 && ck.itens[0].quantidade === 2, 'pedido nasce aguardando pagamento com os itens do carrinho', ck);
    conferir(ck.subtotal_centavos === 20000 && ck.frete_centavos === 0 && ck.entrega_logradouro === 'Rua B', 'totais e endereço corretos', ck);
    const carDepois = await req(A, 'GET', '/carrinhos/meu', null, 200, 'consulta carrinho');
    conferir(carDepois.itens.length === 0, 'carrinho esvaziado após o checkout', carDepois);

    etapa('R6: principal e veículo duplicado');
    await req(A, 'DELETE', `/enderecos/${end1.id_endereco}`, null, 409, 'endereço usado em pedido não pode ser excluído');
    const end3 = await req(A, 'POST', '/enderecos', { logradouro: 'Rua C', numero: '3', bairro: 'C', cidade: 'SP', uf: 'SP', cep: '01001000', principal: true }, 201, 'endereço 3 principal');
    await req(A, 'DELETE', `/enderecos/${end3.id_endereco}`, null, 204, 'exclui o principal');
    const ends = await req(A, 'GET', '/enderecos', null, 200, 'lista endereços');
    conferir(ends.filter((e) => e.principal === 1).length === 1 && ends.find((e) => e.principal === 1).id_endereco === end1.id_endereco, 'o mais antigo vira principal', ends.map((e) => [e.id_endereco, e.principal]));
    const modelo = await req(ADM, 'POST', '/modelos-veiculo', { marca: 'Fiat', modelo: 'Uno', ano: 2015 }, 201, 'modelo');
    await req(A, 'POST', '/veiculos', { id_modelo_veiculo: modelo.id_modelo_veiculo }, 201, 'veículo');
    await req(A, 'POST', '/veiculos', { id_modelo_veiculo: modelo.id_modelo_veiculo }, 409, 'mesmo veículo de novo');
  } finally {
    finalizar();
  }
});
