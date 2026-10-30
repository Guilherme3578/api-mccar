const produtoVeiculoRepository = require('../repositories/produtoVeiculoRepository');
const produtoService = require('./produtoService');
const modeloVeiculoService = require('./modeloVeiculoService');
const AppError = require('../utils/AppError');
const { exigirCampos, paraId } = require('../utils/validacao');

function listar(idProduto) {
  produtoService.buscarPorId(idProduto);
  return produtoVeiculoRepository.listar(idProduto);
}

function adicionar(idProduto, dados) {
  produtoService.buscarPorId(idProduto);
  exigirCampos(dados, ['id_modelo_veiculo']);
  const id_modelo_veiculo = paraId(dados.id_modelo_veiculo, 'id_modelo_veiculo');
  modeloVeiculoService.buscarPorId(id_modelo_veiculo);

  if (produtoVeiculoRepository.buscar(idProduto, id_modelo_veiculo)) {
    throw new AppError('Este modelo já está vinculado ao produto', 409);
  }

  return produtoVeiculoRepository.inserir({ id_produto: idProduto, id_modelo_veiculo });
}

function remover(idProduto, idModeloVeiculo) {
  if (!produtoVeiculoRepository.buscar(idProduto, idModeloVeiculo)) {
    throw new AppError('Vínculo entre produto e modelo não encontrado', 404);
  }
  produtoVeiculoRepository.remover(idProduto, idModeloVeiculo);
}

module.exports = { listar, adicionar, remover };
