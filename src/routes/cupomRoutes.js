const { Router } = require('express');
const cupomController = require('../controllers/cupomController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router();

router.use(authGuard);

router.get('/codigo/:codigo', cupomController.buscarPorCodigo);

router.get('/', adminGuard, cupomController.listar);
router.get('/:id', adminGuard, cupomController.buscarPorId);
router.post('/', adminGuard, cupomController.criar);
router.put('/:id', adminGuard, cupomController.atualizar);
router.delete('/:id', adminGuard, cupomController.remover);

module.exports = router;
