const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
require('express-async-errors');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const funcionariosRoutes = require('./routes/funcionariosRoutes');
const registrosRoutes = require('./routes/registrosRoutes');

const app = express();

app.use(cors({
  origin: '*'
}));

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/registros', registrosRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Caminho não encontrado',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});