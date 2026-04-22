const bcrypt = require('bcryptjs');
const pool = require('../config/db');

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cargoValido(cargo) {
  return ['admin', 'funcionario'].includes(String(cargo).toLowerCase());
}

async function listarFuncionarios(req, res) {
  const [rows] = await pool.query(
    'SELECT id, nome, email, cargo FROM funcionarios ORDER BY nome ASC'
  );
  res.json(rows);
}

async function criarFuncionario(req, res) {
  const { nome, email, password, cargo } = req.body;

  if (!nome || !email || !password || !cargo) {
    return res.status(400).json({
      error: 'nome, email, password e cargo são obrigatórios'
    });
  }

  const nomeLimpo = String(nome).trim();
  const emailLimpo = String(email).trim().toLowerCase();
  const cargoLimpo = String(cargo).trim().toLowerCase();

  if (nomeLimpo.length < 3) {
    return res.status(400).json({ error: 'Nome inválido' });
  }

  if (!emailValido(emailLimpo)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password deve ter pelo menos 6 caracteres' });
  }

  if (!cargoValido(cargoLimpo)) {
    return res.status(400).json({ error: 'Cargo inválido' });
  }

  const [existentes] = await pool.query(
    'SELECT id FROM funcionarios WHERE email = ?',
    [emailLimpo]
  );

  if (existentes.length > 0) {
    return res.status(409).json({ error: 'Já existe um funcionário com esse email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    `INSERT INTO funcionarios (nome, email, password_hash, cargo)
     VALUES (?, ?, ?, ?)`,
    [nomeLimpo, emailLimpo, passwordHash, cargoLimpo]
  );

  res.status(201).json({
    id: result.insertId,
    nome: nomeLimpo,
    email: emailLimpo,
    cargo: cargoLimpo
  });
}

module.exports = {
  listarFuncionarios,
  criarFuncionario
};