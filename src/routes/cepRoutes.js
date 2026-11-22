const { Router } = require('express');
const cepController = require('../controllers/cepController');

const router = Router();

router.get('/:cep', cepController.buscar);

module.exports = router;
