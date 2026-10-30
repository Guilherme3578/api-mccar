const { Router } = require('express');
const enderecoController = require('../controllers/enderecoController');
const authGuard = require('../guards/authGuard');

const router = Router();

router.use(authGuard);

router.get('/', enderecoController.listar);
router.get('/:id', enderecoController.buscarPorId);
router.post('/', enderecoController.criar);
router.put('/:id', enderecoController.atualizar);
router.delete('/:id', enderecoController.remover);

module.exports = router;
