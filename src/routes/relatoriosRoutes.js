const express = require('express');
const router = express.Router();

const { exportarRelatorioExcel } = require('../controllers/relatoriosController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.get('/excel', authMiddleware, adminMiddleware, exportarRelatorioExcel);

module.exports = router;