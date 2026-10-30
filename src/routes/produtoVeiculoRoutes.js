const { Router } = require('express');
const produtoVeiculoController = require('../controllers/produtoVeiculoController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router({ mergeParams: true });

router.get('/', produtoVeiculoController.listar);
router.post('/', authGuard, adminGuard, produtoVeiculoController.adicionar);
router.delete('/:idModeloVeiculo', authGuard, adminGuard, produtoVeiculoController.remover);

module.exports = router;
