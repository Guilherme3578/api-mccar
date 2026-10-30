const produtoRepository = require('../repositories/produtoRepository');
const especificacaoProdutoRepository = require('../repositories/especificacaoProdutoRepository');
const produtoVeiculoRepository = require('../repositories/produtoVeiculoRepository');
const categoriaService = require('./categoriaService');
const AppError = require('../utils/AppError');
const {
  exigirCampos,
  selecionarCampos,
  paraId,
  paraIdOpcional,
  paraInteiro,
  paraFlag,
  paraFlagOpcional,
  paraTextoOpcional,
} = require('../utils/validacao');

const camposEditaveis = [
  'id_categoria',
  'codigo',
  'nome',
  'marca',
  'descricao',
  'preco_centavos',
  'imagem_uri',
  'garantia_meses',
  'destaque',
  'ativo',
  'prazo_envio_horas',
  'frete_gratis_acima_centavos',
];

function paraAvaliacao(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const nota = Number(valor);
  if (Number.isNaN(nota) || nota < 0 || nota > 5) {
    throw new AppError('avaliacao_media deve estar entre 0 e 5', 400);
  }
  return nota;
}

function normalizar(produto, idAtual) {
  exigirCampos(produto, ['id_categoria', 'codigo', 'nome', 'marca', 'descricao', 'preco_centavos']);

  const id_categoria = paraId(produto.id_categoria, 'id_categoria');
  categoriaService.buscarPorId(id_categoria);

  const codigo = String(produto.codigo).trim();
  const existente = produtoRepository.buscarPorCodigo(codigo);
  if (existente && existente.id_produto !== idAtual) {
    throw new AppError('Já existe um produto com esse código', 409);
  }

  return {
    ...produto,
    id_categoria,
    codigo,
    nome: String(produto.nome).trim(),
    marca: String(produto.marca).trim(),
    descricao: String(produto.descricao).trim(),
    preco_centavos: paraInteiro(produto.preco_centavos, 'preco_centavos'),
    imagem_uri: paraTextoOpcional(produto.imagem_uri),
    garantia_meses: paraInteiro(produto.garantia_meses ?? 0, 'garantia_meses'),
    destaque: paraFlag(produto.destaque),
    ativo: produto.ativo === undefined ? 1 : paraFlag(produto.ativo),
    avaliacao_media: paraAvaliacao(produto.avaliacao_media),
    avaliacao_quantidade: paraInteiro(produto.avaliacao_quantidade ?? 0, 'avaliacao_quantidade'),
    prazo_envio_horas: paraInteiro(produto.prazo_envio_horas ?? 0, 'prazo_envio_horas'),
    frete_gratis_acima_centavos: paraInteiro(produto.frete_gratis_acima_centavos ?? 0, 'frete_gratis_acima_centavos'),
  };
}

function listar(filtros) {
  return produtoRepository.listar({
    id_categoria: paraIdOpcional(filtros.id_categoria, 'id_categoria'),
    id_modelo_veiculo: paraIdOpcional(filtros.id_modelo_veiculo, 'id_modelo_veiculo'),
    destaque: paraFlagOpcional(filtros.destaque),
    ativo: paraFlagOpcional(filtros.ativo),
    busca: paraTextoOpcional(filtros.busca),
  });
}

function buscarPorId(id) {
  const produto = produtoRepository.buscarPorId(id);
  if (!produto) {
    throw new AppError('Produto não encontrado', 404);
  }
  return produto;
}

function detalhar(id) {
  return {
    ...buscarPorId(id),
    especificacoes: especificacaoProdutoRepository.listar(id),
    veiculos_compativeis: produtoVeiculoRepository.listar(id),
  };
}

function criar(dados) {
  return produtoRepository.inserir(normalizar(selecionarCampos(dados, camposEditaveis)));
}

function atualizar(id, dados) {
  const atual = buscarPorId(id);
  return produtoRepository.atualizar(normalizar({ ...atual, ...selecionarCampos(dados, camposEditaveis) }, id));
}

function remover(id) {
  buscarPorId(id);
  produtoRepository.remover(id);
}

module.exports = { listar, buscarPorId, detalhar, criar, atualizar, remover };
