const { Router } = require('express');
const veiculoController = require('../controllers/veiculoController');
const authGuard = require('../guards/authGuard');

const router = Router();

router.use(authGuard);

router.get('/', veiculoController.listar);
router.get('/:id', veiculoController.buscarPorId);
router.post('/', veiculoController.criar);
router.put('/:id', veiculoController.atualizar);
router.delete('/:id', veiculoController.remover);

module.exports = router;
