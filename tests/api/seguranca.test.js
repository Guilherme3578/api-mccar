const { test } = require('node:test');
const { iniciar, etapa, falhar, req, cadastrar: cadastrarELogar, promoverAdmin, finalizar } = require('./apoio');

test('Segurança e acesso (S1 a S5)', async () => {
  await iniciar();
  try {
    etapa('preparação');
    const a = await cadastrarELogar('Ana', 'ana@t.com');
    const b = await cadastrarELogar('Bruno', 'bruno@t.com');
    const adm = await cadastrarELogar('Admin', 'admin@t.com');
    if (a.perfil !== 'CLIENTE') falhar('cadastro deveria nascer CLIENTE');
    await req(null, 'POST', '/usuarios', { nome: 'Hacker', email: 'h@t.com', senha: '123456', perfil: 'ADMIN' }, 201, 'cadastro tentando perfil ADMIN (ignorado)');
    const h = await req(null, 'POST', '/usuarios/login', { email: 'h@t.com', senha: '123456' }, 200, 'login hacker');
    if (h.usuario.perfil !== 'CLIENTE') falhar('hacker virou admin no cadastro!');
    if ('senha_hash' in h.usuario) falhar('login expôs senha_hash');

    promoverAdmin('admin@t.com');

    etapa('S2: perfil de administrador');
    await req(a.token, 'GET', '/usuarios', null, 403, 'cliente lista todos os usuários');
    await req(adm.token, 'GET', '/usuarios', null, 200, 'admin lista todos os usuários');
    await req(a.token, 'POST', '/categorias', { nome: 'Freios' }, 403, 'cliente cria categoria');
    const cat = await req(adm.token, 'POST', '/categorias', { nome: 'Freios' }, 201, 'admin cria categoria');
    const p = await req(adm.token, 'POST', '/produtos', { id_categoria: cat.id_categoria, codigo: 'P1', nome: 'Pastilha', marca: 'Bosch', descricao: 'x', preco_centavos: 10000 }, 201, 'admin cria produto');
    await req(a.token, 'PUT', `/produtos/${p.id_produto}`, { preco_centavos: 1 }, 403, 'cliente muda preço do produto');
    await req(a.token, 'POST', `/produtos/${p.id_produto}/especificacoes`, { nome: 'x', valor: 'y' }, 403, 'cliente cria especificação');
    await req(a.token, 'POST', '/modelos-veiculo', { marca: 'x', modelo: 'y', ano: 2000 }, 403, 'cliente cria modelo de veículo');
    await req(a.token, 'POST', '/cupons', { codigo: 'GRATIS', tipo: 'PERCENTUAL', valor: 100 }, 403, 'cliente cria cupom de 100%');
    await req(adm.token, 'POST', '/cupons', { codigo: 'MC10', tipo: 'PERCENTUAL', valor: 10 }, 201, 'admin cria cupom');
    await req(a.token, 'GET', '/cupons', null, 403, 'cliente lista todos os cupons');
    await req(a.token, 'GET', '/cupons/codigo/MC10', null, 200, 'cliente consulta cupom pelo código (checkout)');
    await req(null, 'GET', '/produtos', null, 200, 'catálogo continua público');
    await req(adm.token, 'PUT', `/usuarios/${adm.id_usuario}/perfil`, { perfil: 'CLIENTE' }, 400, 'admin rebaixa a si mesmo');
    await req(a.token, 'PUT', `/usuarios/${b.id_usuario}/perfil`, { perfil: 'ADMIN' }, 403, 'cliente promove outro usuário');

    etapa('S1: dados de outro usuário');
    const endA = await req(a.token, 'POST', '/enderecos', { id_usuario: b.id_usuario, logradouro: 'Rua A', numero: '1', bairro: 'C', cidade: 'SP', uf: 'SP', cep: '01001000' }, 201, 'Ana cria endereço (id_usuario do body ignorado)');
    if (endA.id_usuario !== a.id_usuario) falhar('endereço criado para outro usuário!');
    await req(b.token, 'GET', `/enderecos/${endA.id_endereco}`, null, 403, 'Bruno lê endereço da Ana');
    await req(b.token, 'PUT', `/enderecos/${endA.id_endereco}`, { cidade: 'Hack' }, 403, 'Bruno altera endereço da Ana');
    await req(b.token, 'DELETE', `/enderecos/${endA.id_endereco}`, null, 403, 'Bruno exclui endereço da Ana');
    const listaB = await req(b.token, 'GET', `/enderecos?id_usuario=${a.id_usuario}`, null, 200, 'Bruno filtra endereços pelo id da Ana');
    if (listaB.length !== 0) falhar('filtro vazou endereços da Ana');
    const listaAdm = await req(adm.token, 'GET', `/enderecos?id_usuario=${a.id_usuario}`, null, 200, 'admin filtra endereços da Ana');
    if (listaAdm.length !== 1) falhar('admin deveria ver o endereço');
    await req(b.token, 'GET', `/usuarios/${a.id_usuario}`, null, 403, 'Bruno lê o cadastro da Ana');
    await req(b.token, 'PUT', `/usuarios/${a.id_usuario}`, { senha: 'trocada' }, 403, 'Bruno troca a senha da Ana');
    await req(b.token, 'DELETE', `/usuarios/${a.id_usuario}`, null, 403, 'Bruno exclui a Ana');
    const cA = await req(a.token, 'POST', '/cartoes', { bandeira: 'visa', ultimos_quatro: '4242', nome_titular: 'ana' }, 201, 'Ana cria cartão');
    await req(b.token, 'GET', `/cartoes/${cA.id_cartao}`, null, 403, 'Bruno lê cartão da Ana');
    await req(a.token, 'POST', `/usuarios/${a.id_usuario}/favoritos`, { id_produto: p.id_produto }, 201, 'Ana favorita produto');
    await req(b.token, 'GET', `/usuarios/${a.id_usuario}/favoritos`, null, 403, 'Bruno lê favoritos da Ana');
    await req(b.token, 'DELETE', `/usuarios/${a.id_usuario}/favoritos/${p.id_produto}`, null, 403, 'Bruno remove favorito da Ana');
    const carA = await req(a.token, 'GET', '/carrinhos/meu', null, 200, 'Ana consulta o próprio carrinho');
    await req(b.token, 'GET', `/carrinhos/${carA.id_carrinho}`, null, 403, 'Bruno lê carrinho da Ana');
    await req(b.token, 'POST', `/carrinhos/${carA.id_carrinho}/itens`, { id_produto: p.id_produto, quantidade: 1 }, 403, 'Bruno coloca item no carrinho da Ana');

    etapa('S1/S2: pedido e pagamento');
    await req(b.token, 'POST', '/pedidos', { id_endereco: endA.id_endereco }, 403, 'Bruno cria pedido com endereço da Ana');
    const ped = await req(a.token, 'POST', '/pedidos', { id_endereco: endA.id_endereco }, 201, 'Ana cria pedido');
    await req(b.token, 'GET', `/pedidos/${ped.id_pedido}`, null, 403, 'Bruno lê pedido da Ana');
    await req(b.token, 'POST', `/pedidos/${ped.id_pedido}/itens`, { id_produto: p.id_produto, quantidade: 1 }, 403, 'Bruno adiciona item no pedido da Ana');
    await req(a.token, 'POST', `/pedidos/${ped.id_pedido}/itens`, { id_produto: p.id_produto, quantidade: 1 }, 201, 'Ana adiciona item');
    await req(a.token, 'PUT', `/pedidos/${ped.id_pedido}`, { status: 'PAGO' }, 400, 'Ana marca o próprio pedido como PAGO');
    await req(a.token, 'PUT', `/pedidos/${ped.id_pedido}`, { status: 'AGUARDANDO_PAGAMENTO' }, 200, 'Ana finaliza o pedido');
    const pedidosB = await req(b.token, 'GET', `/pedidos?id_usuario=${a.id_usuario}`, null, 200, 'Bruno filtra pedidos pelo id da Ana');
    if (pedidosB.length !== 0) falhar('filtro vazou pedidos da Ana');
    await req(b.token, 'POST', '/pagamentos', { id_pedido: ped.id_pedido, metodo: 'PIX' }, 403, 'Bruno paga pedido da Ana');
    const cB = await req(b.token, 'POST', '/cartoes', { bandeira: 'master', ultimos_quatro: '1111', nome_titular: 'bruno' }, 201, 'Bruno cria cartão');
    await req(a.token, 'POST', '/pagamentos', { id_pedido: ped.id_pedido, metodo: 'CARTAO', id_cartao: cB.id_cartao }, 403, 'Ana paga com cartão do Bruno');
    const pag = await req(a.token, 'POST', '/pagamentos', { id_pedido: ped.id_pedido, metodo: 'CARTAO', id_cartao: cA.id_cartao }, 201, 'Ana paga com o próprio cartão');
    await req(a.token, 'PUT', `/pagamentos/${pag.id_pagamento}`, { status: 'APROVADO' }, 403, 'Ana aprova o próprio pagamento');
    await req(b.token, 'GET', `/pagamentos/${pag.id_pagamento}`, null, 403, 'Bruno lê pagamento da Ana');
    await req(adm.token, 'PUT', `/pagamentos/${pag.id_pagamento}`, { status: 'APROVADO' }, 200, 'admin aprova pagamento');
    const pedFinal = await req(a.token, 'GET', `/pedidos/${ped.id_pedido}`, null, 200, 'Ana vê o pedido');
    if (pedFinal.status !== 'PAGO') falhar('pedido deveria estar PAGO');

    etapa('S3: token de usuário excluído / token adulterado');
    const c = await cadastrarELogar('Carlos', 'carlos@t.com');
    await req(c.token, 'DELETE', `/usuarios/${c.id_usuario}`, null, 204, 'Carlos exclui a própria conta');
    await req(c.token, 'GET', '/usuarios/me', null, 401, 'token do Carlos depois da exclusão');
    const [cab, , ass] = a.token.split('.');
    const corpoFalso = Buffer.from(JSON.stringify({ id_usuario: adm.id_usuario })).toString('base64url');
    await req(`${cab}.${corpoFalso}.${ass}`, 'GET', '/usuarios', null, 401, 'token adulterado se passando pelo admin');
    const semAssinatura = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${corpoFalso}.`;
    await req(semAssinatura, 'GET', '/usuarios', null, 401, 'token com alg none');

    etapa('promoção em tempo real');
    await req(adm.token, 'PUT', `/usuarios/${b.id_usuario}/perfil`, { perfil: 'ADMIN' }, 200, 'admin promove Bruno');
    await req(b.token, 'GET', '/usuarios', null, 200, 'Bruno (mesmo token) já tem acesso de admin');

    etapa('S5: limite de tentativas de login');
    for (let i = 1; i <= 5; i++) {
      await req(null, 'POST', '/usuarios/login', { email: 'ana@t.com', senha: 'errada' }, 401, `tentativa errada ${i}`);
    }
    await req(null, 'POST', '/usuarios/login', { email: 'ana@t.com', senha: 'errada' }, 429, '6ª tentativa bloqueada');
    await req(null, 'POST', '/usuarios/login', { email: 'ana@t.com', senha: '123456' }, 429, 'senha certa também bloqueada durante o bloqueio');
    await req(null, 'POST', '/usuarios/login', { email: 'bruno@t.com', senha: '123456' }, 200, 'outro e-mail continua liberado');
    await req(null, 'POST', '/usuarios/login', { email: 'naoexiste@t.com', senha: 'x' }, 401, 'e-mail inexistente responde igual a senha errada');
  } finally {
    finalizar();
  }
});
