const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('pagamento');

module.exports = {
  listar: (filtros) => sql.listar.all(filtros),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorPedido: (id_pedido) => sql.buscarPorPedido.get(id_pedido),
  inserir: (pagamento) => sql.inserir.get({ mp_preferencia_id: null, ...pagamento }),
  reabrir: (pagamento) => sql.reabrir.get({ mp_preferencia_id: null, ...pagamento }),
  registrarMercadoPago: (dados) => sql.registrarMercadoPago.get(dados),
  atualizarStatus: (id_pagamento, status) => sql.atualizarStatus.get({ id_pagamento, status }),
  remover: (id) => sql.remover.run(id),
};
