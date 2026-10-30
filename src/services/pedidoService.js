const crypto = require('crypto');
const pedidoRepository = require('../repositories/pedidoRepository');
const itemPedidoRepository = require('../repositories/itemPedidoRepository');
const pagamentoRepository = require('../repositories/pagamentoRepository');
const cupomRepository = require('../repositories/cupomRepository');
const carrinhoRepository = require('../repositories/carrinhoRepository');
const itemCarrinhoRepository = require('../repositories/itemCarrinhoRepository');
const enderecoService = require('./enderecoService');
const cupomService = require('./cupomService');
const produtoService = require('./produtoService');
const freteService = require('./freteService');
const StatusPedido = require('../enums/StatusPedido');
const StatusPagamento = require('../enums/StatusPagamento');
const { transacao } = require('../config/database');
const AppError = require('../utils/AppError');
const { ehAdmin, garantirDono, idUsuarioDoFiltro } = require('../utils/acesso');
const { exigirCampos, selecionarCampos, paraId, paraIdOpcional, paraTextoOpcional, paraOpcao } = require('../utils/validacao');

const TRANSICOES = Object.freeze({
  [StatusPedido.RASCUNHO]: [StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.CANCELADO],
  [StatusPedido.AGUARDANDO_PAGAMENTO]: [StatusPedido.PAGO, StatusPedido.CANCELADO],
  [StatusPedido.PAGO]: [StatusPedido.ENVIADO, StatusPedido.CANCELADO],
  [StatusPedido.ENVIADO]: [StatusPedido.ENTREGUE],
  [StatusPedido.ENTREGUE]: [],
  [StatusPedido.CANCELADO]: [],
});

const STATUS_ALTERAVEIS_PELO_CLIENTE = [StatusPedido.RASCUNHO, StatusPedido.AGUARDANDO_PAGAMENTO];

function formatarReais(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarNumero() {
  const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `MC${data}${crypto.randomInt(100000, 1000000)}`;
}

function dadosDeEntrega(idEndereco, idUsuario) {
  const endereco = enderecoService.buscarPorId(idEndereco);
  if (endereco.id_usuario !== idUsuario) {
    throw new AppError('O endereço não pertence ao usuário do pedido', 403);
  }

  return {
    id_endereco: endereco.id_endereco,
    entrega_logradouro: endereco.logradouro,
    entrega_numero: endereco.numero,
    entrega_complemento: endereco.complemento,
    entrega_bairro: endereco.bairro,
    entrega_cidade: endereco.cidade,
    entrega_uf: endereco.uf,
    entrega_cep: endereco.cep,
  };
}

function cupomValidado(idCupom) {
  const id = paraIdOpcional(idCupom, 'id_cupom');
  if (id) {
    cupomService.validarParaUso(id);
  }
  return id;
}

function itemDoPedido(idPedido, produto, quantidade) {
  if (!produto.ativo) {
    throw new AppError(`O produto ${produto.nome} não está disponível`, 400);
  }

  return {
    id_pedido: idPedido,
    id_produto: produto.id_produto,
    nome_produto: produto.nome,
    codigo_produto: produto.codigo,
    quantidade,
    preco_unitario_centavos: produto.preco_centavos,
  };
}

function aplicarTotais(pedido) {
  const resumo = itemPedidoRepository.resumo(pedido.id_pedido);
  const cupom = pedido.id_cupom ? cupomRepository.buscarPorId(pedido.id_cupom) : null;
  const desconto_centavos = cupomService.calcularDesconto(cupom, resumo.subtotal_centavos);
  const envio = freteService.calcular(resumo);

  return {
    ...pedido,
    ...envio,
    subtotal_centavos: resumo.subtotal_centavos,
    desconto_centavos,
    total_centavos: Math.max(resumo.subtotal_centavos + envio.frete_centavos - desconto_centavos, 0),
  };
}

function validarFinalizacao(pedido) {
  if (itemPedidoRepository.resumo(pedido.id_pedido).quantidade_itens === 0) {
    throw new AppError('O pedido precisa ter ao menos um item para ser finalizado', 400);
  }

  if (pedido.id_cupom) {
    const cupom = cupomService.validarParaUso(pedido.id_cupom);
    if (pedido.subtotal_centavos < cupom.minimo_compra_centavos) {
      throw new AppError(
        `O cupom ${cupom.codigo} exige compra mínima de ${formatarReais(cupom.minimo_compra_centavos)}`,
        400
      );
    }
  }
}

function garantirTransicao(usuarioLogado, de, para) {
  if (para === StatusPedido.PAGO) {
    throw new AppError('O pedido passa para PAGO automaticamente quando o pagamento é aprovado', 400);
  }
  if (!TRANSICOES[de].includes(para)) {
    throw new AppError(`Não é possível alterar o pedido de ${de} para ${para}`, 400);
  }
  if (!ehAdmin(usuarioLogado) && !STATUS_ALTERAVEIS_PELO_CLIENTE.includes(de)) {
    throw new AppError(`Somente administradores podem alterar um pedido com status ${de}`, 403);
  }
}

function cancelarPagamentoDoPedido(idPedido) {
  const pagamento = pagamentoRepository.buscarPorPedido(idPedido);
  if (!pagamento) return;

  if (pagamento.status === StatusPagamento.PENDENTE) {
    pagamentoRepository.atualizarStatus(pagamento.id_pagamento, StatusPagamento.RECUSADO);
  }
  if (pagamento.status === StatusPagamento.APROVADO) {
    pagamentoRepository.atualizarStatus(pagamento.id_pagamento, StatusPagamento.ESTORNADO);
  }
}

function listar(usuarioLogado, filtros) {
  return pedidoRepository.listar({
    id_usuario: idUsuarioDoFiltro(usuarioLogado, filtros.id_usuario),
    status: paraTextoOpcional(filtros.status) ? paraOpcao(filtros.status, StatusPedido, 'status') : null,
  });
}

function buscarPorId(id) {
  const pedido = pedidoRepository.buscarPorId(id);
  if (!pedido) {
    throw new AppError('Pedido não encontrado', 404);
  }
  return pedido;
}

function buscar(usuarioLogado, id) {
  const pedido = buscarPorId(id);
  garantirDono(usuarioLogado, pedido.id_usuario);
  return pedido;
}

function detalhar(usuarioLogado, id) {
  return {
    ...buscar(usuarioLogado, id),
    itens: itemPedidoRepository.listar(id),
    pagamento: pagamentoRepository.buscarPorPedido(id) ?? null,
  };
}

function recalcularTotais(id) {
  return pedidoRepository.atualizar(aplicarTotais(buscarPorId(id)));
}

function novoPedido(idUsuario, idEndereco, idCupom) {
  return pedidoRepository.inserir({
    id_usuario: idUsuario,
    id_cupom: idCupom,
    numero: gerarNumero(),
    ...dadosDeEntrega(idEndereco, idUsuario),
    frete_centavos: 0,
    prazo_min_dias: 0,
    prazo_max_dias: 0,
  });
}

function criar(usuarioLogado, dados) {
  exigirCampos(dados, ['id_endereco']);
  const idEndereco = paraId(dados.id_endereco, 'id_endereco');
  const idCupom = cupomValidado(dados.id_cupom);

  return transacao(() => {
    const pedido = novoPedido(usuarioLogado.id_usuario, idEndereco, idCupom);
    return pedidoRepository.atualizar(aplicarTotais(pedido));
  });
}

function checkout(usuarioLogado, dados) {
  exigirCampos(dados, ['id_endereco']);
  const idEndereco = paraId(dados.id_endereco, 'id_endereco');
  const idCupom = cupomValidado(dados.id_cupom);

  const carrinho = carrinhoRepository.buscarPorUsuario(usuarioLogado.id_usuario);
  const itensDoCarrinho = carrinho ? itemCarrinhoRepository.listar(carrinho.id_carrinho) : [];
  if (itensDoCarrinho.length === 0) {
    throw new AppError('O carrinho está vazio', 400);
  }

  const idPedido = transacao(() => {
    const criado = novoPedido(usuarioLogado.id_usuario, idEndereco, idCupom);

    for (const item of itensDoCarrinho) {
      const produto = produtoService.buscarPorId(item.id_produto);
      itemPedidoRepository.inserir(itemDoPedido(criado.id_pedido, produto, item.quantidade));
    }

    const pedido = aplicarTotais(criado);
    validarFinalizacao(pedido);
    pedidoRepository.atualizar({ ...pedido, status: StatusPedido.AGUARDANDO_PAGAMENTO });

    itemCarrinhoRepository.limpar(carrinho.id_carrinho);
    carrinhoRepository.registrarAtualizacao(carrinho.id_carrinho);
    return criado.id_pedido;
  });

  return detalhar(usuarioLogado, idPedido);
}

function atualizar(usuarioLogado, id, dados) {
  const atual = buscar(usuarioLogado, id);
  const alteracoes = selecionarCampos(dados, ['id_endereco', 'id_cupom']);

  if (atual.status !== StatusPedido.RASCUNHO && Object.keys(alteracoes).length > 0) {
    throw new AppError('Depois que o pedido sai de RASCUNHO, apenas o status pode ser alterado', 400);
  }

  let pedido = { ...atual };

  if (alteracoes.id_endereco !== undefined) {
    Object.assign(pedido, dadosDeEntrega(paraId(alteracoes.id_endereco, 'id_endereco'), atual.id_usuario));
  }
  if (alteracoes.id_cupom !== undefined) {
    pedido.id_cupom = cupomValidado(alteracoes.id_cupom);
  }
  if (atual.status === StatusPedido.RASCUNHO) {
    pedido = aplicarTotais(pedido);
  }

  const novoStatus = dados.status === undefined ? atual.status : paraOpcao(dados.status, StatusPedido, 'status');

  if (novoStatus !== atual.status) {
    garantirTransicao(usuarioLogado, atual.status, novoStatus);
    if (novoStatus === StatusPedido.AGUARDANDO_PAGAMENTO) {
      validarFinalizacao(pedido);
    }
    pedido.status = novoStatus;
  }

  return transacao(() => {
    if (pedido.status === StatusPedido.CANCELADO && atual.status !== StatusPedido.CANCELADO) {
      cancelarPagamentoDoPedido(id);
    }
    return pedidoRepository.atualizar(pedido);
  });
}

function marcarComoPago(idPedido) {
  const pedido = buscarPorId(idPedido);
  if (pedido.status !== StatusPedido.AGUARDANDO_PAGAMENTO) {
    throw new AppError(`Não é possível aprovar o pagamento de um pedido com status ${pedido.status}`, 400);
  }
  pedidoRepository.atualizarStatus(idPedido, StatusPedido.PAGO);
}

function cancelarPorEstorno(idPedido) {
  const pedido = buscarPorId(idPedido);
  if (pedido.status === StatusPedido.ENVIADO || pedido.status === StatusPedido.ENTREGUE) {
    throw new AppError(`Não é possível estornar o pagamento de um pedido ${pedido.status}`, 400);
  }
  pedidoRepository.atualizarStatus(idPedido, StatusPedido.CANCELADO);
}

function remover(usuarioLogado, id) {
  const pedido = buscar(usuarioLogado, id);
  if (pedido.status !== StatusPedido.RASCUNHO) {
    throw new AppError('Apenas pedidos em RASCUNHO podem ser excluídos, use o status CANCELADO', 400);
  }
  pedidoRepository.remover(id);
}

module.exports = {
  listar,
  buscarPorId,
  buscar,
  detalhar,
  itemDoPedido,
  recalcularTotais,
  criar,
  checkout,
  atualizar,
  marcarComoPago,
  cancelarPorEstorno,
  remover,
};
