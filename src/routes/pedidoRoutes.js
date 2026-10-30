const { Router } = require('express');
const pedidoController = require('../controllers/pedidoController');
const authGuard = require('../guards/authGuard');

const router = Router();

router.use(authGuard);

router.get('/', pedidoController.listar);
router.get('/:id', pedidoController.buscarPorId);
router.post('/', pedidoController.criar);
router.post('/checkout', pedidoController.checkout);
router.put('/:id', pedidoController.atualizar);
router.delete('/:id', pedidoController.remover);

module.exports = router;
