const relatorioRepository = require('../repositories/relatorioRepository');

function dados() {
  const resumo = relatorioRepository.resumo();

  return {
    gerado_em: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    moeda: 'BRL',
    valores_em: 'centavos',
    resumo: {
      ...resumo,
      ticket_medio_centavos: resumo.pedidos_pagos > 0 ? Math.round(resumo.faturamento_centavos / resumo.pedidos_pagos) : 0,
    },
    vendas_por_dia: relatorioRepository.vendasPorDia(),
    vendas_por_categoria: relatorioRepository.vendasPorCategoria(),
    produtos_mais_vendidos: relatorioRepository.produtosMaisVendidos(),
    pedidos_por_status: relatorioRepository.pedidosPorStatus(),
    pagamentos_por_metodo: relatorioRepository.pagamentosPorMetodo(),
    vendas_por_estado: relatorioRepository.vendasPorEstado(),
    cupons: relatorioRepository.cupons(),
    pedidos: relatorioRepository.pedidos(),
  };
}

function nomeDoArquivo(geradoEm) {
  return `mccar-dados-${geradoEm.slice(0, 10)}.json`;
}

module.exports = { dados, nomeDoArquivo };
