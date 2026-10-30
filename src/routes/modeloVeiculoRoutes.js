const { Router } = require('express');
const modeloVeiculoController = require('../controllers/modeloVeiculoController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router();

router.get('/', modeloVeiculoController.listar);
router.get('/:id', modeloVeiculoController.buscarPorId);
router.post('/', authGuard, adminGuard, modeloVeiculoController.criar);
router.put('/:id', authGuard, adminGuard, modeloVeiculoController.atualizar);
router.delete('/:id', authGuard, adminGuard, modeloVeiculoController.remover);

module.exports = router;
