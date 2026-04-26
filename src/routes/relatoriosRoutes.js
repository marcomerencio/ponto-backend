const express = require('express');
const router = express.Router();
const {
  exportarRelatorioExcel,
  exportarRelatorioPDF,
  obterResumo
} = require('../controllers/relatoriosController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { obterRelatorioMensal } = require('../controllers/relatoriosController');

router.get('/excel', authMiddleware, adminMiddleware, exportarRelatorioExcel);
router.get('/pdf', authMiddleware, adminMiddleware, exportarRelatorioPDF);
router.get('/resumo', authMiddleware, adminMiddleware, obterResumo);
router.get('/mensal', authMiddleware, adminMiddleware, obterRelatorioMensal);
module.exports = router;