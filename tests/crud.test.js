const { test } = require('node:test');
const { iniciar, etapa, falhar, req: requisicao, promoverAdmin, finalizar } = require('./apoio');

let token = null;
const req = (metodo, rota, corpo, esperado) => requisicao(token, metodo, rota, corpo, esperado);

test('CRUDs de todas as entidades', async () => {
  await iniciar();
  try {
    await req('GET', '/', null, 200);
    await req('GET', '/enderecos', null, 401);
    const u = await req('POST', '/usuarios', { nome: 'Gui', email: 'Gui@Teste.com', senha: '123456' }, 201);
    await req('POST', '/usuarios', { nome: 'Gui', email: 'gui@teste.com', senha: '123456' }, 409);
    promoverAdmin('gui@teste.com');
    await req('POST', '/usuarios/login', { email: 'gui@teste.com', senha: 'errada' }, 401);
    const l = await req('POST', '/usuarios/login', { email: 'gui@teste.com', senha: '123456' }, 200);
    token = l.token;
    const me = await req('GET', '/usuarios/me', null, 200);
    if (me.senha_hash) falhar('senha_hash exposta');
    await req('PUT', `/usuarios/${u.id_usuario}`, { nome: 'Guilherme', senha: 'nova123' }, 200);

    const e1 = await req('POST', '/enderecos', { id_usuario: u.id_usuario, logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'SP', uf: 'sp', cep: '01001-000' }, 201);
    const e2 = await req('POST', '/enderecos', { id_usuario: u.id_usuario, logradouro: 'Rua B', numero: '20', bairro: 'Centro', cidade: 'SP', uf: 'SP', cep: '01001000', principal: true }, 201);
    const ends = await req('GET', `/enderecos?id_usuario=${u.id_usuario}`, null, 200);
    await req('POST', '/enderecos', { id_usuario: u.id_usuario, logradouro: 'x', numero: '1', bairro: 'x', cidade: 'x', uf: 'SPP', cep: '1' }, 400);

    const c = await req('POST', '/cartoes', { id_usuario: u.id_usuario, bandeira: 'visa', ultimos_quatro: '4242', nome_titular: 'gui' }, 201);
    await req('POST', '/cartoes', { id_usuario: u.id_usuario, bandeira: 'visa', ultimos_quatro: '42', nome_titular: 'gui' }, 400);

    const m = await req('POST', '/modelos-veiculo', { marca: 'Fiat', modelo: 'Uno', ano: 2015 }, 201);
    const v = await req('POST', '/veiculos', { id_usuario: u.id_usuario, id_modelo_veiculo: m.id_modelo_veiculo }, 201);
    await req('PUT', `/veiculos/${v.id_veiculo}`, { principal: 0 }, 200);

    const cat = await req('POST', '/categorias', { nome: 'Freios', icone: 'disc' }, 201);
    await req('POST', '/categorias', { nome: 'Freios' }, 409);
    const p = await req('POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'PF-01', nome: 'Pastilha', marca: 'Bosch', descricao: 'Pastilha dianteira', preco_centavos: 15000, destaque: true }, 201);
    await req('POST', '/produtos', { id_categoria: 999, codigo: 'X', nome: 'x', marca: 'x', descricao: 'x', preco_centavos: 1 }, 404);
    await req('POST', `/produtos/${p.id_produto}/especificacoes`, { nome: 'Material', valor: 'Cerâmica' }, 201);
    await req('PUT', `/produtos/${p.id_produto}/especificacoes/Material`, { valor: 'Metálica' }, 200);
    await req('POST', `/produtos/${p.id_produto}/veiculos`, { id_modelo_veiculo: m.id_modelo_veiculo }, 201);
    await req('POST', `/produtos/${p.id_produto}/veiculos`, { id_modelo_veiculo: m.id_modelo_veiculo }, 409);
    const t = token; token = null;
    const det = await req('GET', `/produtos/${p.id_produto}`, null, 200);
    const lista = await req('GET', `/produtos?id_modelo_veiculo=${m.id_modelo_veiculo}&busca=pastilha`, null, 200);
    await req('POST', '/produtos', {}, 401);
    token = t;
    await req('PUT', `/produtos/${p.id_produto}`, { preco_centavos: 20000 }, 200);

    await req('POST', `/usuarios/${u.id_usuario}/favoritos`, { id_produto: p.id_produto }, 201);
    await req('GET', `/usuarios/${u.id_usuario}/favoritos`, null, 200);
    await req('DELETE', `/usuarios/${u.id_usuario}/favoritos/${p.id_produto}`, null, 204);

    const car = await req('GET', '/carrinhos/meu', null, 200);
    await req('POST', '/carrinhos', {}, 409);
    await req('POST', `/carrinhos/${car.id_carrinho}/itens`, { id_produto: p.id_produto, quantidade: 2 }, 201);
    await req('PUT', `/carrinhos/${car.id_carrinho}/itens/${p.id_produto}`, { quantidade: 3 }, 200);
    const carDet = await req('GET', `/carrinhos/${car.id_carrinho}`, null, 200);

    const cup = await req('POST', '/cupons', { codigo: 'mccar10', tipo: 'percentual', valor: 10, minimo_compra_centavos: 10000 }, 201);
    await req('GET', '/cupons/codigo/MCCAR10', null, 200);
    await req('POST', '/cupons', { codigo: 'x', tipo: 'PERCENTUAL', valor: 150 }, 400);

    const ped = await req('POST', '/pedidos', { id_usuario: u.id_usuario, id_endereco: e2.id_endereco, id_cupom: cup.id_cupom, frete_centavos: 2000, prazo_min_dias: 3, prazo_max_dias: 5 }, 201);
    await req('PUT', `/pedidos/${ped.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 400);
    await req('POST', `/pedidos/${ped.id_pedido}/itens`, { id_produto: p.id_produto, quantidade: 2 }, 201);
    const ped2 = await req('GET', `/pedidos/${ped.id_pedido}`, null, 200);
    await req('POST', '/pagamentos', { id_pedido: ped.id_pedido, metodo: 'PIX' }, 400);
    await req('PUT', `/pedidos/${ped.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200);
    await req('POST', `/pedidos/${ped.id_pedido}/itens`, { id_produto: p.id_produto, quantidade: 1 }, 400);
    await req('PUT', `/pedidos/${ped.id_pedido}`, { id_cupom: null }, 400);
    const pag = await req('POST', '/pagamentos', { id_pedido: ped.id_pedido, metodo: 'cartao', id_cartao: c.id_cartao }, 201);
    const pagAp = await req('PUT', `/pagamentos/${pag.id_pagamento}`, { status: 'APROVADO' }, 200);
    const ped3 = await req('GET', `/pedidos/${ped.id_pedido}`, null, 200);
    await req('DELETE', `/pagamentos/${pag.id_pagamento}`, null, 400);
    await req('DELETE', `/pedidos/${ped.id_pedido}`, null, 400);
    await req('DELETE', `/produtos/${p.id_produto}`, null, 409);
    await req('DELETE', `/usuarios/${u.id_usuario}`, null, 409);
    await req('GET', '/usuarios/abc', null, 400);
    await req('GET', '/nada', null, 404);
  } finally {
    finalizar();
  }
});
