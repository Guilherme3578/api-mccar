const { Router } = require('express');
const itemCarrinhoController = require('../controllers/itemCarrinhoController');
const authGuard = require('../guards/authGuard');

const router = Router({ mergeParams: true });

router.use(authGuard);

router.get('/', itemCarrinhoController.listar);
router.post('/', itemCarrinhoController.adicionar);
router.put('/:idProduto', itemCarrinhoController.atualizar);
router.delete('/:idProduto', itemCarrinhoController.remover);

module.exports = router;
