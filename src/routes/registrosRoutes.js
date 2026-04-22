const express = require('express');
const {
  criarRegistro,
  listarRegistros,
  listarRegistrosPorFuncionario
} = require('../controllers/registrosController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, criarRegistro);
router.get('/', authMiddleware, listarRegistros);
router.get('/funcionario/:funcionarioId', authMiddleware, listarRegistrosPorFuncionario);

module.exports = router;