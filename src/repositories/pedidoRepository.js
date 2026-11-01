const carregarQueries = require('../database/carregarQueries');

const sql = carregarQueries('pedido');

module.exports = {
  listar: (filtros) => sql.listar.all(filtros),
  buscarPorId: (id) => sql.buscarPorId.get(id),
  buscarPorNumero: (numero) => sql.buscarPorNumero.get(numero),
  inserir: (pedido) => sql.inserir.get(pedido),
  atualizar: (pedido) => sql.atualizar.get(pedido),
  atualizarStatus: (id_pedido, status) => sql.atualizarStatus.run({ id_pedido, status }),
  contarUsosDoCupom: (id_usuario, id_cupom, id_pedido) => sql.contarUsosDoCupom.get({ id_usuario, id_cupom, id_pedido }).total,
  contarComprasDoUsuario: (id_usuario, id_pedido) => sql.contarComprasDoUsuario.get({ id_usuario, id_pedido }).total,
  remover: (id) => sql.remover.run(id),
};
