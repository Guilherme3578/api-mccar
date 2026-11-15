import { api } from './api';

export function meuCarrinho(cupom) {
  return api.get('/carrinhos/meu', { cupom: cupom });
}

export async function adicionarAoCarrinho(produtoId, quantidade) {
  const carrinho = await meuCarrinho();
  const existente = carrinho.itens.find((i) => i.id_produto === produtoId);
  if (existente) {
    return api.put('/carrinhos/' + carrinho.id_carrinho + '/itens/' + produtoId, {
      quantidade: existente.quantidade + quantidade,
    });
  }
  return api.post('/carrinhos/' + carrinho.id_carrinho + '/itens', {
    id_produto: produtoId,
    quantidade: quantidade,
  });
}

export function alterarQuantidade(idCarrinho, produtoId, quantidade) {
  return api.put('/carrinhos/' + idCarrinho + '/itens/' + produtoId, { quantidade: quantidade });
}

export function removerItem(idCarrinho, produtoId) {
  return api.del('/carrinhos/' + idCarrinho + '/itens/' + produtoId);
}

export function finalizarPedido(idEndereco, idCupom) {
  const corpo = { id_endereco: idEndereco };
  if (idCupom) corpo.id_cupom = idCupom;
  return api.post('/pedidos/checkout', corpo);
}

export function pagar(dados) {
  return api.post('/pagamentos', dados);
}

export function listarPedidos() {
  return api.get('/pedidos');
}

export function detalharPedido(id) {
  return api.get('/pedidos/' + id);
}

export function cancelarPedido(id) {
  return api.put('/pedidos/' + id, { status: 'CANCELADO' });
}
