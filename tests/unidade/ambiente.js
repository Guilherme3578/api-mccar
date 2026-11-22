const fs = require('fs');
const os = require('os');
const path = require('path');

const caminhoBanco = path.join(os.tmpdir(), `mccar-unidade-${process.pid}-${Date.now()}.db`);

process.env.DB_PATH = caminhoBanco;
process.env.JWT_SECRET = 'segredo-usado-apenas-nos-testes-automatizados';
process.env.FRETE_PADRAO_CENTAVOS = '2990';
process.env.FRETE_GRATIS_ACIMA_CENTAVOS = '10000';
process.env.FRETE_TRANSPORTE_MIN_DIAS = '2';
process.env.FRETE_TRANSPORTE_MAX_DIAS = '7';
process.env.PAGAMENTO_APROVACAO_AUTOMATICA = 'false';
process.env.MP_ACCESS_TOKEN = '';
process.env.MP_URL_PUBLICA = 'https://api.mccar.test/';
process.env.MP_WEBHOOK_SECRET = 'segredo-do-webhook-de-teste';
process.env.MP_URL_RETORNO = 'mccar://pagamento';

let contador = 0;

function cenarioDeCompra({ precoCentavos = 15000, quantidade = 1, prazoEnvioHoras = 24 } = {}) {
  const usuarioService = require('../../src/services/usuarioService');
  const usuarioRepository = require('../../src/repositories/usuarioRepository');
  const categoriaService = require('../../src/services/categoriaService');
  const produtoService = require('../../src/services/produtoService');
  const enderecoService = require('../../src/services/enderecoService');
  const carrinhoService = require('../../src/services/carrinhoService');
  const itemCarrinhoService = require('../../src/services/itemCarrinhoService');

  contador += 1;
  const criado = usuarioService.criar({ nome: `Cliente ${contador}`, email: `cliente${contador}@teste.com`, senha: '123456' });
  const usuario = usuarioRepository.buscarPorId(criado.id_usuario);
  const categoria = categoriaService.criar({ nome: `Categoria ${contador}` });
  const produto = produtoService.criar({
    id_categoria: categoria.id_categoria,
    codigo: `T-${contador}`,
    nome: `Produto ${contador}`,
    marca: 'Marca',
    descricao: 'Produto de teste',
    preco_centavos: precoCentavos,
    prazo_envio_horas: prazoEnvioHoras,
  });
  const endereco = enderecoService.criar(usuario, { logradouro: 'Rua', numero: '1', bairro: 'Centro', cidade: 'SP', uf: 'SP', cep: '01001000' });
  const carrinho = carrinhoService.meu(usuario);
  itemCarrinhoService.adicionar(usuario, carrinho.id_carrinho, { id_produto: produto.id_produto, quantidade });

  return { usuario, produto, endereco, carrinho };
}

function encerrar() {
  const { db } = require('../../src/config/database');
  db.close();
  for (const sufixo of ['', '-wal', '-shm']) fs.rmSync(caminhoBanco + sufixo, { force: true });
}

module.exports = { cenarioDeCompra, encerrar };
