const { Router } = require('express');
const favoritoController = require('../controllers/favoritoController');
const authGuard = require('../guards/authGuard');

const router = Router({ mergeParams: true });

router.use(authGuard);

router.get('/', favoritoController.listar);
router.post('/', favoritoController.adicionar);
router.delete('/:idProduto', favoritoController.remover);

module.exports = router;
