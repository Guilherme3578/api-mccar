const { Router } = require('express');
const categoriaController = require('../controllers/categoriaController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router();

router.get('/', categoriaController.listar);
router.get('/:id', categoriaController.buscarPorId);
router.post('/', authGuard, adminGuard, categoriaController.criar);
router.put('/:id', authGuard, adminGuard, categoriaController.atualizar);
router.delete('/:id', authGuard, adminGuard, categoriaController.remover);

module.exports = router;
