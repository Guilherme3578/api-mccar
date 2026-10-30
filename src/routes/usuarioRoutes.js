const { Router } = require('express');
const usuarioController = require('../controllers/usuarioController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');
const limiteLoginGuard = require('../guards/limiteLoginGuard');

const router = Router();

router.post('/', usuarioController.criar);
router.post('/login', limiteLoginGuard, usuarioController.login);

router.get('/me', authGuard, usuarioController.perfil);
router.get('/', authGuard, adminGuard, usuarioController.listar);
router.get('/:id', authGuard, usuarioController.buscarPorId);
router.put('/:id', authGuard, usuarioController.atualizar);
router.put('/:id/perfil', authGuard, adminGuard, usuarioController.alterarPerfil);
router.delete('/:id', authGuard, usuarioController.remover);

module.exports = router;
