const { Router } = require('express');
const mercadoPagoController = require('../controllers/mercadoPagoController');
const authGuard = require('../guards/authGuard');

const router = Router();

router.post('/webhook', mercadoPagoController.receberNotificacao);
router.post('/', authGuard, mercadoPagoController.iniciarCheckout);
router.post('/sincronizar', authGuard, mercadoPagoController.sincronizar);

module.exports = router;
