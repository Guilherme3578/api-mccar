const { Router } = require('express');
const carrinhoController = require('../controllers/carrinhoController');
const authGuard = require('../guards/authGuard');

const router = Router();

router.use(authGuard);

router.get('/', carrinhoController.listar);
router.get('/meu', carrinhoController.meu);
router.get('/:id', carrinhoController.buscarPorId);
router.post('/', carrinhoController.criar);
router.delete('/:id', carrinhoController.remover);

module.exports = router;
