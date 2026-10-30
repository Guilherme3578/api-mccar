const { Router } = require('express');
const especificacaoProdutoController = require('../controllers/especificacaoProdutoController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router({ mergeParams: true });

router.get('/', especificacaoProdutoController.listar);
router.post('/', authGuard, adminGuard, especificacaoProdutoController.criar);
router.put('/:nome', authGuard, adminGuard, especificacaoProdutoController.atualizar);
router.delete('/:nome', authGuard, adminGuard, especificacaoProdutoController.remover);

module.exports = router;
