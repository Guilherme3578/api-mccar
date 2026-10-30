const { Router } = require('express');
const itemPedidoController = require('../controllers/itemPedidoController');
const authGuard = require('../guards/authGuard');

const router = Router({ mergeParams: true });

router.use(authGuard);

router.get('/', itemPedidoController.listar);
router.post('/', itemPedidoController.adicionar);
router.put('/:idProduto', itemPedidoController.atualizar);
router.delete('/:idProduto', itemPedidoController.remover);

module.exports = router;
