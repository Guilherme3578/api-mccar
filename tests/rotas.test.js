const { test } = require('node:test');
const { iniciar, etapa, falhar, conferir, enviar, req, promoverAdmin, rodarSeed, finalizar } = require('./apoio');

test('Rotas e endpoints sem conflito', async () => {
  await iniciar();
  try {
    rodarSeed();
    await req(null, 'POST', '/usuarios', { nome: 'Adm', email: 'adm@r.com', senha: '123456' }, 201, 'cadastro admin');
    promoverAdmin('adm@r.com');
    const adm = (await req(null, 'POST', '/usuarios/login', { email: 'adm@r.com', senha: '123456' }, 200, 'login admin')).token;
    const u = await req(null, 'POST', '/usuarios', { nome: 'Ana', email: 'ana@r.com', senha: '123456' }, 201, 'cadastro Ana');
    const ana = (await req(null, 'POST', '/usuarios/login', { email: 'ana@r.com', senha: '123456' }, 200, 'login Ana')).token;

    etapa('rotas literais x /:id');
    const me = await req(ana, 'GET', '/usuarios/me', null, 200, '/me não cai em /:id');
    if (me?.id_usuario !== u.id_usuario) falhar('/me devolveu outro usuário');
    await req(ana, 'GET', '/carrinhos/meu', null, 200, '/meu não cai em /:id');
    await req(ana, 'GET', '/cupons/codigo/BEMVINDO50', null, 200, '/codigo/:codigo não cai em /:id');
    await req(ana, 'GET', '/cupons/1', null, 403, 'cupom por id continua só admin');
    await req(ana, 'POST', '/pedidos/checkout', {}, 400, 'POST /checkout vai para o checkout (não para POST /)');
    await req(ana, 'GET', '/pedidos/checkout', null, [400, 404], 'GET /checkout não quebra');
    await req(adm, 'PUT', `/usuarios/${u.id_usuario}/perfil`, { perfil: 'CLIENTE' }, 200, '/:id/perfil não cai em PUT /:id');
    await req(ana, 'PUT', `/usuarios/${u.id_usuario}/perfil`, { perfil: 'ADMIN' }, 403, 'cliente não se promove');
    await req(null, 'POST', '/usuarios/login', { email: 'x@x.com', senha: '1' }, 401, '/login não cai em POST /');

    etapa('rotas aninhadas x rota pai');
    const prods = await req(null, 'GET', '/produtos', null, 200, 'lista produtos');
    const p = Array.isArray(prods) ? prods[0] : null;
    if (p) {
      await req(null, 'GET', `/produtos/${p.id_produto}`, null, 200, 'produto por id');
      await req(null, 'GET', `/produtos/${p.id_produto}/especificacoes`, null, 200, 'especificações (aninhada)');
      await req(null, 'GET', `/produtos/${p.id_produto}/veiculos`, null, 200, 'veículos compatíveis (aninhada)');
      await req(adm, 'PUT', `/produtos/${p.id_produto}/especificacoes/${encodeURIComponent('Nome Com Espaço')}`, { valor: 'x' }, [404, 400], 'especificação com espaço/acento na URL');
    }
    await req(null, 'GET', '/produtos/9999/especificacoes', null, 404, 'aninhada com pai inexistente');
    await req(ana, 'GET', `/usuarios/${u.id_usuario}/favoritos`, null, 200, 'favoritos (aninhada em /usuarios)');
    await req(ana, 'GET', '/usuarios/1/favoritos', null, 403, 'favoritos de outro usuário');
    const car = await req(ana, 'GET', '/carrinhos/meu', null, 200, 'carrinho');
    await req(ana, 'GET', `/carrinhos/${car.id_carrinho}/itens`, null, 200, 'itens do carrinho (aninhada)');

    etapa('ids malformados');
    for (const id of ['abc', '0', '-1', '1.5', '1e1', '0x10', '%20', '01']) {
      await req(null, 'GET', `/produtos/${id}`, null, 400, `id "${id}"`);
    }

    etapa('rotas e métodos inexistentes');
    await req(null, 'GET', '/naoexiste', null, 404, 'rota inexistente');
    await req(null, 'PATCH', '/produtos/1', null, 404, 'método não mapeado');
    await req(null, 'GET', '/produtos/1/qualquer', null, 404, 'subrota inexistente');
    await req(null, 'GET', '/produtos/', null, 200, 'barra no final');
    await req(null, 'GET', '/PRODUTOS', null, 200, 'maiúsculas (Express não diferencia)');

    etapa('guard antes do 404 de rota protegida');
    await req(null, 'GET', '/pedidos/1', null, 401, 'sem token em rota protegida');
    await req('lixo', 'GET', '/pedidos', null, 401, 'token inválido');

    etapa('corpo inválido');
    const r = await enviar('POST', '/usuarios', { headers: { 'Content-Type': 'application/json' }, body: '{nome:' });
    conferir(r.status === 400, 'JSON malformado devolve 400', r.status);

    etapa('datas em ISO 8601 (B1)');
    const formatoIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    conferir(formatoIso.test(u.criado_em), 'criado_em do usuário em ISO 8601', u.criado_em);
    conferir(!Number.isNaN(new Date(u.criado_em).getTime()), 'criado_em vira Date válida', u.criado_em);
    const carrinho = await req(ana, 'GET', '/carrinhos/meu', null, 200, 'carrinho');
    conferir(formatoIso.test(carrinho.atualizado_em), 'atualizado_em do carrinho em ISO 8601', carrinho.atualizado_em);
  } finally {
    finalizar();
  }
});
