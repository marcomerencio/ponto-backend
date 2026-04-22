const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password são obrigatórios' });
  }

  const emailLimpo = String(email).trim().toLowerCase();

  const [rows] = await pool.query(
    'SELECT id, nome, email, password_hash, cargo FROM funcionarios WHERE email = ?',
    [emailLimpo]
  );

  const user = rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    funcionario: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo
    }
  });
}

module.exports = { login };