const { Router } = require('express');
const relatorioController = require('../controllers/relatorioController');
const authGuard = require('../guards/authGuard');
const adminGuard = require('../guards/adminGuard');

const router = Router();

router.use(authGuard, adminGuard);

router.get('/dados', relatorioController.dados);

module.exports = router;
