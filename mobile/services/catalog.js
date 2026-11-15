import { api } from './api';

export const ORDENACOES = [
  { valor: 'RELEVANCIA', label: 'Relevância' },
  { valor: 'MENOR_PRECO', label: 'Menor preço' },
  { valor: 'MAIOR_PRECO', label: 'Maior preço' },
  { valor: 'AVALIACAO', label: 'Avaliação' },
  { valor: 'NOME', label: 'Nome (A-Z)' },
];

export function listarCategorias() {
  return api.get('/categorias');
}

export function listarProdutos(filtros = {}) {
  return api.get('/produtos', { ativo: 1, ...filtros });
}

export function detalharProduto(id) {
  return api.get('/produtos/' + id);
}

export function listarModelos() {
  return api.get('/modelos-veiculo');
}
