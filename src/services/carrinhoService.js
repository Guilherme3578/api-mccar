const carrinhoRepository = require('../repositories/carrinhoRepository');
const itemCarrinhoRepository = require('../repositories/itemCarrinhoRepository');
const cupomService = require('./cupomService');
const freteService = require('./freteService');
const AppError = require('../utils/AppError');
const { garantirDono, idUsuarioDoFiltro } = require('../utils/acesso');
const { paraTextoOpcional } = require('../utils/validacao');

function buscarPorId(id) {
  const carrinho = carrinhoRepository.buscarPorId(id);
  if (!carrinho) {
    throw new AppError('Carrinho não encontrado', 404);
  }
  return carrinho;
}

function listar(usuarioLogado, filtros) {
  return carrinhoRepository.listar(idUsuarioDoFiltro(usuarioLogado, filtros.id_usuario));
}

function buscar(usuarioLogado, id) {
  const carrinho = buscarPorId(id);
  garantirDono(usuarioLogado, carrinho.id_usuario);
  return carrinho;
}

function cupomDoResumo(codigo, idUsuario, subtotalCentavos) {
  if (!paraTextoOpcional(codigo)) return null;

  const cupom = cupomService.buscarPorCodigo(codigo);
  cupomService.validarParaUso(cupom.id_cupom, idUsuario);
  cupomService.garantirCompraMinima(cupom, subtotalCentavos);
  return cupom;
}

function detalhar(usuarioLogado, id, codigoCupom) {
  const carrinho = buscar(usuarioLogado, id);
  const itens = itemCarrinhoRepository.listar(id);
  const subtotal_centavos = itens.reduce((soma, item) => soma + item.total_centavos, 0);
  const cupom = cupomDoResumo(codigoCupom, carrinho.id_usuario, subtotal_centavos);
  const desconto_centavos = cupomService.calcularDesconto(cupom, subtotal_centavos);
  const envio = freteService.calcular(
    {
      quantidade_itens: itens.length,
      subtotal_centavos,
      maior_prazo_envio_horas: Math.max(0, ...itens.map((item) => item.prazo_envio_horas)),
    },
    desconto_centavos
  );

  return {
    ...carrinho,
    itens,
    quantidade_itens: itens.reduce((soma, item) => soma + item.quantidade, 0),
    subtotal_centavos,
    cupom: cupom ? { id_cupom: cupom.id_cupom, codigo: cupom.codigo, tipo: cupom.tipo, valor: cupom.valor } : null,
    desconto_centavos,
    ...envio,
    total_centavos: subtotal_centavos + envio.frete_centavos - desconto_centavos,
  };
}

function meu(usuarioLogado, codigoCupom) {
  const carrinho =
    carrinhoRepository.buscarPorUsuario(usuarioLogado.id_usuario) ??
    carrinhoRepository.inserir({ id_usuario: usuarioLogado.id_usuario });
  return detalhar(usuarioLogado, carrinho.id_carrinho, codigoCupom);
}

function criar(usuarioLogado) {
  const id_usuario = usuarioLogado.id_usuario;

  if (carrinhoRepository.buscarPorUsuario(id_usuario)) {
    throw new AppError('Usuário já possui um carrinho', 409);
  }

  return carrinhoRepository.inserir({ id_usuario });
}

function remover(usuarioLogado, id) {
  buscar(usuarioLogado, id);
  carrinhoRepository.remover(id);
}

module.exports = { listar, buscar, detalhar, meu, criar, remover };
