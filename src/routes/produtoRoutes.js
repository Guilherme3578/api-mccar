const { Router } = require('express');
const produtoController = require('../controllers/produtoController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router();

router.get('/', produtoController.listar);
router.get('/:id', produtoController.buscarPorId);
router.post('/', authGuard, adminGuard, produtoController.criar);
router.put('/:id', authGuard, adminGuard, produtoController.atualizar);
router.delete('/:id', authGuard, adminGuard, produtoController.remover);

module.exports = router;
