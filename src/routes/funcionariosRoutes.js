const express = require('express');
const {
  listarFuncionarios,
  criarFuncionario
} = require('../controllers/funcionariosController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, listarFuncionarios);
router.post('/', authMiddleware, adminMiddleware, criarFuncionario);

module.exports = router;