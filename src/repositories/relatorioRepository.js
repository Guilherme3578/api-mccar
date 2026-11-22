const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('relatorio');

module.exports = {
  resumo: () => sql.resumo.get(),
  vendasPorDia: () => sql.vendasPorDia.all(),
  vendasPorCategoria: () => sql.vendasPorCategoria.all(),
  produtosMaisVendidos: () => sql.produtosMaisVendidos.all(),
  pedidosPorStatus: () => sql.pedidosPorStatus.all(),
  pagamentosPorMetodo: () => sql.pagamentosPorMetodo.all(),
  vendasPorEstado: () => sql.vendasPorEstado.all(),
  cupons: () => sql.cupons.all(),
  pedidos: () => sql.pedidos.all(),
};
