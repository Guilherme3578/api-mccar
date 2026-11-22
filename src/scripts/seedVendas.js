require('../config/env');

process.env.PAGAMENTO_APROVACAO_AUTOMATICA = 'false';

const { transacao } = require('../config/database');
const carregarQueries = require('../database/carregarQueries');
const relatorioRepository = require('../repositories/relatorioRepository');
const usuarioService = require('../services/usuarioService');
const usuarioRepository = require('../repositories/usuarioRepository');
const enderecoService = require('../services/enderecoService');
const carrinhoService = require('../services/carrinhoService');
const itemCarrinhoService = require('../services/itemCarrinhoService');
const pedidoService = require('../services/pedidoService');
const pagamentoService = require('../services/pagamentoService');
const cupomService = require('../services/cupomService');
const produtoService = require('../services/produtoService');

const QUANTIDADE_DE_CLIENTES = 30;
const QUANTIDADE_DE_PEDIDOS = 140;
const DIAS_DE_HISTORICO = 60;
const ADMIN = { id_usuario: 0, perfil: 'ADMIN' };

const CIDADES = [
  { cidade: 'São Paulo', uf: 'SP', cep: '01001000', peso: 30 },
  { cidade: 'Santo André', uf: 'SP', cep: '09010000', peso: 10 },
  { cidade: 'Campinas', uf: 'SP', cep: '13010111', peso: 8 },
  { cidade: 'Rio de Janeiro', uf: 'RJ', cep: '20010000', peso: 14 },
  { cidade: 'Belo Horizonte', uf: 'MG', cep: '30110000', peso: 10 },
  { cidade: 'Curitiba', uf: 'PR', cep: '80010000', peso: 8 },
  { cidade: 'Porto Alegre', uf: 'RS', cep: '90010000', peso: 7 },
  { cidade: 'Salvador', uf: 'BA', cep: '40010000', peso: 7 },
  { cidade: 'Recife', uf: 'PE', cep: '50010000', peso: 6 },
];

const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olivia'];
const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida'];

function geradorAleatorio(semente) {
  let estado = semente;
  return function () {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const aleatorio = geradorAleatorio(2026);
const inteiro = (min, max) => min + Math.floor(aleatorio() * (max - min + 1));
const sortear = (lista) => lista[Math.floor(aleatorio() * lista.length)];
const chance = (probabilidade) => aleatorio() < probabilidade;

function sortearComPeso(lista) {
  const total = lista.reduce((soma, item) => soma + item.peso, 0);
  let alvo = aleatorio() * total;
  for (const item of lista) {
    alvo -= item.peso;
    if (alvo <= 0) return item;
  }
  return lista[lista.length - 1];
}

function dataDoPedido(indice) {
  const agora = Date.now();
  const inicio = agora - DIAS_DE_HISTORICO * 24 * 60 * 60 * 1000;
  const fracao = (indice + aleatorio()) / QUANTIDADE_DE_PEDIDOS;
  const crescimento = Math.sqrt(fracao);
  const data = new Date(inicio + crescimento * (agora - inicio));
  data.setUTCHours(inteiro(11, 23), inteiro(0, 59), inteiro(0, 59), 0);
  return data.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function criarClientes() {
  return Array.from({ length: QUANTIDADE_DE_CLIENTES }, (_, i) => {
    const nome = `${sortear(NOMES)} ${sortear(SOBRENOMES)}`;
    const criado = usuarioService.criar({ nome, email: `cliente${i + 1}@demo.mccar.com`, senha: 'demo123' });
    const usuario = usuarioRepository.buscarPorId(criado.id_usuario);
    const local = sortearComPeso(CIDADES);
    const endereco = enderecoService.criar(usuario, {
      logradouro: `Rua Demonstração ${i + 1}`,
      numero: String(inteiro(10, 999)),
      bairro: 'Centro',
      cidade: local.cidade,
      uf: local.uf,
      cep: local.cep,
    });
    return { usuario, endereco, compras: 0 };
  });
}

function montarCarrinho(cliente, produtos) {
  const carrinho = carrinhoService.meu(cliente.usuario);
  const escolhidos = new Set();
  const quantidadeDeProdutos = sortearComPeso([{ n: 1, peso: 5 }, { n: 2, peso: 3 }, { n: 3, peso: 2 }]).n;

  while (escolhidos.size < quantidadeDeProdutos) {
    escolhidos.add(sortearComPeso(produtos));
  }
  for (const produto of escolhidos) {
    const quantidade = produto.preco_centavos < 10000 ? inteiro(1, 3) : 1;
    itemCarrinhoService.adicionar(cliente.usuario, carrinho.id_carrinho, { id_produto: produto.id_produto, quantidade });
  }
}

function pagar(cliente, pedido) {
  const metodo = sortearComPeso([
    { metodo: 'PIX', peso: 45 },
    { metodo: 'CARTAO', peso: 40 },
    { metodo: 'BOLETO', peso: 15 },
  ]).metodo;

  const dados = { id_pedido: pedido.id_pedido, metodo };
  if (metodo === 'CARTAO') {
    dados.cartao = { bandeira: sortear(['VISA', 'MASTERCARD', 'ELO']), ultimos_quatro: String(inteiro(1000, 9999)), nome_titular: cliente.usuario.nome };
  }
  return pagamentoService.criar(cliente.usuario, dados);
}

function avancarPedido(cliente, pedido, antiguidade) {
  const recente = antiguidade < 0.1;
  const destino = sortearComPeso([
    { fim: 'PAGO', peso: 78 },
    { fim: 'AGUARDANDO', peso: recente ? 40 : 0 },
    { fim: 'CANCELADO', peso: 12 },
  ]).fim;

  if (destino === 'CANCELADO') {
    pedidoService.atualizar(cliente.usuario, pedido.id_pedido, { status: 'CANCELADO' });
    return;
  }

  const pagamento = pagar(cliente, pedido);
  if (destino === 'AGUARDANDO') return;

  pagamentoService.atualizar(pagamento.id_pagamento, { status: 'APROVADO' });
  if (antiguidade > 0.05 && chance(0.9)) {
    pedidoService.atualizar(ADMIN, pedido.id_pedido, { status: 'ENVIADO' });
    if (antiguidade > 0.15 && chance(0.9)) {
      pedidoService.atualizar(ADMIN, pedido.id_pedido, { status: 'ENTREGUE' });
    }
  }
}

function gerarVendas() {
  const demo = carregarQueries('demonstracao');
  if (demo.contarClientesDemo.get().total > 0) {
    console.log('As vendas de demonstração já foram geradas. Para gerar de novo, apague a pasta data/ e rode npm run setup.');
    return;
  }

  const produtos = produtoService.listar({ ativo: 1 }).map((produto) => ({ ...produto, peso: produto.destaque ? 3 : 1 }));
  if (produtos.length === 0) {
    console.error('Catálogo vazio. Rode antes: npm run seed');
    process.exit(1);
  }

  cupomService.garantirCupomBoasVindas();
  const boasVindas = cupomService.buscarPorCodigo('BEMVINDO50');

  transacao(() => {
    const clientes = criarClientes();

    for (let i = 0; i < QUANTIDADE_DE_PEDIDOS; i++) {
      const cliente = sortear(clientes);
      montarCarrinho(cliente, produtos);

      const usarCupom = cliente.compras === 0 && chance(0.35);
      const pedido = pedidoService.checkout(cliente.usuario, {
        id_endereco: cliente.endereco.id_endereco,
        id_cupom: usarCupom ? boasVindas.id_cupom : undefined,
      });

      const data = dataDoPedido(i);
      const antiguidade = (Date.now() - Date.parse(data)) / (DIAS_DE_HISTORICO * 24 * 60 * 60 * 1000);
      avancarPedido(cliente, pedido, antiguidade);
      const status = pedidoService.buscarPorId(pedido.id_pedido).status;
      if (status !== 'CANCELADO') cliente.compras += 1;

      demo.datarPedido.run({ id_pedido: pedido.id_pedido, data });
      demo.datarPagamento.run({ id_pedido: pedido.id_pedido, data });
    }
  });

  console.log(`${QUANTIDADE_DE_CLIENTES} clientes e ${QUANTIDADE_DE_PEDIDOS} pedidos de demonstração criados nos últimos ${DIAS_DE_HISTORICO} dias:`);
  for (const linha of relatorioRepository.pedidosPorStatus()) console.log(`  ${linha.status}: ${linha.quantidade}`);
  console.log('Login dos clientes: cliente1@demo.mccar.com até cliente30@demo.mccar.com, senha demo123');
}

gerarVendas();
