const { Router } = require('express');
const pagamentoController = require('../controllers/pagamentoController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router();

router.use(authGuard);

router.get('/', pagamentoController.listar);
router.get('/:id', pagamentoController.buscarPorId);
router.post('/', pagamentoController.criar);
router.put('/:id', adminGuard, pagamentoController.atualizar);
router.delete('/:id', adminGuard, pagamentoController.remover);

module.exports = router;
