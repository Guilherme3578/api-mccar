const { test } = require('node:test');
const { iniciar, etapa, conferir, req, cadastrar, promoverAdmin, rodarSeed, finalizar } = require('./apoio');

test('Telas do Figma: carrinho, checkout, pagamento, listagem e pedidos', async () => {
  await iniciar();
  try {
    rodarSeed();
    const adm = await cadastrar('Admin', 'admin@f.com');
    promoverAdmin('admin@f.com');
    await req(adm.token, 'POST', '/cupons', { codigo: 'MINIMO500', tipo: 'VALOR', valor: 1000, minimo_compra_centavos: 50000 }, 201, 'cupom com mínimo de R$ 500');

    const ana = await cadastrar('Ana', 'ana@f.com');
    const end = await req(ana.token, 'POST', '/enderecos', { logradouro: 'Rua das Oficinas', numero: '120', bairro: 'Centro', cidade: 'Santo André', uf: 'SP', cep: '09010000' }, 201, 'endereço');
    const produtos = await req(null, 'GET', '/produtos', null, 200, 'catálogo');
    const pastilha = produtos.find((p) => p.codigo === 'MC-006');
    const bateria = produtos.find((p) => p.codigo === 'MC-014');
    const filtro = produtos.find((p) => p.codigo === 'MC-019');

    etapa('tela 4: carrinho com frete estimado');
    let car = await req(ana.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho vazio');
    conferir(car.total_centavos === 0 && car.frete_centavos === 0 && car.quantidade_itens === 0, 'carrinho vazio zerado', car);
    await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: filtro.id_produto, quantidade: 2 }, 201, '2 filtros de óleo');
    car = await req(ana.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho R$ 59,80');
    conferir(car.itens[0].marca === 'Tecfil', 'item traz a marca', car.itens[0]);
    conferir(car.quantidade_itens === 2 && car.subtotal_centavos === 5980, 'quantidade e subtotal', car);
    conferir(car.frete_centavos === 2990 && car.total_centavos === 8970, 'abaixo de R$ 100: frete entra no total', car);
    conferir(car.prazo_min_dias === 3 && car.prazo_max_dias === 8, 'prazo: 1 dia de envio + 2 a 7 de transporte', car);
    await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: pastilha.id_produto, quantidade: 1 }, 201, 'pastilha');
    await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: bateria.id_produto, quantidade: 1 }, 201, 'bateria');
    car = await req(ana.token, 'GET', '/carrinhos/meu', null, 200, 'carrinho R$ 739,60');
    conferir(car.subtotal_centavos === 73960 && car.frete_centavos === 0 && car.total_centavos === 73960, 'acima de R$ 100: frete grátis', car);
    conferir(car.cupom === null && car.desconto_centavos === 0, 'sem cupom, sem desconto', car);

    etapa('tela 5: checkout com código promocional');
    car = await req(ana.token, 'GET', '/carrinhos/meu?cupom=bemvindo50', null, 200, 'aplica BEMVINDO50 (minúsculo)');
    conferir(car.cupom?.codigo === 'BEMVINDO50' && car.desconto_centavos === 36980, 'resumo mostra o cupom e 50% de desconto', car);
    conferir(car.total_centavos === 36980 && car.frete_centavos === 0, 'total com desconto e frete grátis', car);
    await req(ana.token, 'GET', '/carrinhos/meu?cupom=NAOEXISTE', null, 404, 'cupom inexistente');
    const resumo = car;
    const pedido = await req(ana.token, 'POST', '/pedidos/checkout', { id_endereco: end.id_endereco, id_cupom: resumo.cupom.id_cupom }, 201, 'fazer pedido');
    conferir(
      pedido.subtotal_centavos === resumo.subtotal_centavos && pedido.desconto_centavos === resumo.desconto_centavos && pedido.frete_centavos === resumo.frete_centavos && pedido.total_centavos === resumo.total_centavos && pedido.prazo_max_dias === resumo.prazo_max_dias,
      'o pedido sai com os mesmos valores que o resumo mostrou',
      { resumo, pedido }
    );
    await req(ana.token, 'GET', '/carrinhos/meu?cupom=BEMVINDO50', null, 400, 'BEMVINDO50 não vale na segunda compra');
    await req(ana.token, 'POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: filtro.id_produto, quantidade: 1 }, 201, 'novo item');
    await req(ana.token, 'GET', '/carrinhos/meu?cupom=MINIMO500', null, 400, 'cupom com mínimo não atingido');

    etapa('tela 6: pagamento com cartão novo');
    await req(ana.token, 'POST', '/pagamentos', { id_pedido: pedido.id_pedido, metodo: 'CARTAO' }, 400, 'cartão sem dados');
    await req(ana.token, 'POST', '/pagamentos', { id_pedido: pedido.id_pedido, metodo: 'CARTAO', cartao: { bandeira: 'Visa', ultimos_quatro: '12', nome_titular: 'ANA' } }, 400, 'cartão com final inválido');
    const pag = await req(ana.token, 'POST', '/pagamentos', { id_pedido: pedido.id_pedido, metodo: 'CARTAO', cartao: { bandeira: 'Visa', ultimos_quatro: '1234', nome_titular: 'Ana Souza' } }, 201, 'paga sem salvar o cartão');
    conferir(pag.id_cartao === null && pag.cartao_bandeira === 'VISA' && pag.cartao_final === '1234', 'pagamento guarda bandeira e final', pag);
    let cartoes = await req(ana.token, 'GET', '/cartoes', null, 200, 'cartões');
    conferir(cartoes.length === 0, 'sem salvar_cartao, nada fica salvo', cartoes);

    const pedido2 = await req(ana.token, 'POST', '/pedidos/checkout', { id_endereco: end.id_endereco }, 201, 'segundo pedido');
    const pag2 = await req(ana.token, 'POST', '/pagamentos', { id_pedido: pedido2.id_pedido, metodo: 'CARTAO', salvar_cartao: true, cartao: { bandeira: 'Mastercard', ultimos_quatro: '5678', nome_titular: 'Ana Souza' } }, 201, 'paga salvando o cartão');
    cartoes = await req(ana.token, 'GET', '/cartoes', null, 200, 'cartões');
    conferir(cartoes.length === 1 && cartoes[0].ultimos_quatro === '5678' && cartoes[0].principal === 1, 'cartão salvo e principal', cartoes);
    conferir(pag2.id_cartao === cartoes[0].id_cartao, 'pagamento aponta para o cartão salvo', pag2);

    etapa('telas 7 e 9: número do pedido');
    conferir(/^MC-\d{5}$/.test(pedido.numero) && /^MC-\d{5}$/.test(pedido2.numero), 'número no formato MC-30523', [pedido.numero, pedido2.numero]);
    const lista = await req(ana.token, 'GET', '/pedidos', null, 200, 'meus pedidos');
    conferir(lista.length === 2 && lista[0].id_pedido === pedido2.id_pedido, 'pedidos do mais novo para o mais antigo', lista.map((p) => p.numero));

    etapa('tela 2: ordenação da listagem');
    const precos = (lista) => lista.map((p) => p.preco_centavos);
    const crescente = (v) => v.every((x, i) => i === 0 || v[i - 1] <= x);
    const menor = await req(null, 'GET', '/produtos?ordenar=menor_preco', null, 200, 'menor preço');
    conferir(crescente(precos(menor)), 'menor preço em ordem crescente', precos(menor));
    const maior = await req(null, 'GET', '/produtos?ordenar=MAIOR_PRECO', null, 200, 'maior preço');
    conferir(crescente(precos(maior).reverse()), 'maior preço em ordem decrescente', precos(maior));
    const avaliacao = await req(null, 'GET', '/produtos?ordenar=avaliacao', null, 200, 'melhor avaliação');
    conferir(crescente(avaliacao.map((p) => p.avaliacao_media).reverse()), 'avaliação em ordem decrescente', avaliacao.map((p) => p.avaliacao_media));
    const relevancia = await req(null, 'GET', '/produtos', null, 200, 'relevância (padrão)');
    conferir(relevancia[0].destaque === 1, 'relevância começa pelos destaques', relevancia[0]);
    const freios = await req(null, 'GET', '/produtos?id_categoria=4&busca=freio&ordenar=menor_preco', null, 200, 'buscar em Freios');
    conferir(freios.length > 0 && freios.every((p) => p.id_categoria === 4) && crescente(precos(freios)), 'filtro, busca e ordenação juntos', freios.map((p) => p.nome));
    await req(null, 'GET', '/produtos?ordenar=aleatorio', null, 400, 'ordenação inválida');
  } finally {
    finalizar();
  }
});
