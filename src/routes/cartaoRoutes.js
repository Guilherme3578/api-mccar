const { Router } = require('express');
const cartaoController = require('../controllers/cartaoController');
const authGuard = require('../guards/authGuard');

const router = Router();

router.use(authGuard);

router.get('/', cartaoController.listar);
router.get('/:id', cartaoController.buscarPorId);
router.post('/', cartaoController.criar);
router.put('/:id', cartaoController.atualizar);
router.delete('/:id', cartaoController.remover);

module.exports = router;
