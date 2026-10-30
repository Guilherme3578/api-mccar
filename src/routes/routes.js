const { Router } = require('express');

const usuarioRoutes = require('./usuarioRoutes');
const favoritoRoutes = require('./favoritoRoutes');
const enderecoRoutes = require('./enderecoRoutes');
const cartaoRoutes = require('./cartaoRoutes');
const modeloVeiculoRoutes = require('./modeloVeiculoRoutes');
const veiculoRoutes = require('./veiculoRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const produtoRoutes = require('./produtoRoutes');
const especificacaoProdutoRoutes = require('./especificacaoProdutoRoutes');
const produtoVeiculoRoutes = require('./produtoVeiculoRoutes');
const carrinhoRoutes = require('./carrinhoRoutes');
const itemCarrinhoRoutes = require('./itemCarrinhoRoutes');
const cupomRoutes = require('./cupomRoutes');
const pedidoRoutes = require('./pedidoRoutes');
const itemPedidoRoutes = require('./itemPedidoRoutes');
const pagamentoRoutes = require('./pagamentoRoutes');

const router = Router();

router.get('/', (req, res) => {
  res.json({ api: 'MCCAR', status: 'online' });
});

router.use('/usuarios/:idUsuario/favoritos', favoritoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/enderecos', enderecoRoutes);
router.use('/cartoes', cartaoRoutes);
router.use('/modelos-veiculo', modeloVeiculoRoutes);
router.use('/veiculos', veiculoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/produtos/:idProduto/especificacoes', especificacaoProdutoRoutes);
router.use('/produtos/:idProduto/veiculos', produtoVeiculoRoutes);
router.use('/produtos', produtoRoutes);
router.use('/carrinhos/:idCarrinho/itens', itemCarrinhoRoutes);
router.use('/carrinhos', carrinhoRoutes);
router.use('/cupons', cupomRoutes);
router.use('/pedidos/:idPedido/itens', itemPedidoRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/pagamentos', pagamentoRoutes);

module.exports = router;
