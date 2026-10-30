const categoriaRepository = require('../repositories/categoriaRepository');
const AppError = require('../utils/AppError');
const { exigirCampos, selecionarCampos, paraTextoOpcional } = require('../utils/validacao');

const camposEditaveis = ['nome', 'icone'];

function normalizar(categoria, idAtual) {
  exigirCampos(categoria, ['nome']);
  const nome = String(categoria.nome).trim();

  const existente = categoriaRepository.buscarPorNome(nome);
  if (existente && existente.id_categoria !== idAtual) {
    throw new AppError('Já existe uma categoria com esse nome', 409);
  }

  return { ...categoria, nome, icone: paraTextoOpcional(categoria.icone) };
}

function listar() {
  return categoriaRepository.listar();
}

function buscarPorId(id) {
  const categoria = categoriaRepository.buscarPorId(id);
  if (!categoria) {
    throw new AppError('Categoria não encontrada', 404);
  }
  return categoria;
}

function criar(dados) {
  return categoriaRepository.inserir(normalizar(selecionarCampos(dados, camposEditaveis)));
}

function atualizar(id, dados) {
  const atual = buscarPorId(id);
  return categoriaRepository.atualizar(normalizar({ ...atual, ...selecionarCampos(dados, camposEditaveis) }, id));
}

function remover(id) {
  buscarPorId(id);
  categoriaRepository.remover(id);
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
