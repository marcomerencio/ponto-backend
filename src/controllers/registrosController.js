const pool = require('../config/db');

async function criarRegistro(req, res) {
  const {
    id,
    funcionarioId,
    funcionarioNome,
    tipo,
    dataHora,
    latitude,
    longitude
  } = req.body;

  if (!id || !funcionarioId || !funcionarioNome || !tipo || !dataHora) {
    return res.status(400).json({
      error: 'id, funcionarioId, funcionarioNome, tipo e dataHora são obrigatórios'
    });
  }

  if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [ultimoRows] = await conn.query(
      `
      SELECT tipo
      FROM registros
      WHERE funcionario_id = ?
      ORDER BY data_hora DESC
      LIMIT 1
      `,
      [funcionarioId]
    );

    const ultimo = ultimoRows[0];

    if (ultimo && ultimo.tipo === tipo) {
      await conn.rollback();
      return res.status(400).json({
        error: `Não é permitido registar ${tipo} duas vezes seguidas`
      });
    }

    await conn.query(
      `
      INSERT INTO registros
      (id, funcionario_id, funcionario_nome, tipo, data_hora, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        funcionarioId,
        funcionarioNome,
        tipo,
        dataHora,
        latitude ?? null,
        longitude ?? null
      ]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Registo criado com sucesso'
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listarRegistros(req, res) {
  const { funcionarioId, dataInicio, dataFim } = req.query;

  let sql = `
    SELECT
      id,
      funcionario_id AS funcionarioId,
      funcionario_nome AS funcionarioNome,
      tipo,
      data_hora AS dataHora,
      latitude,
      longitude,
      criado_em AS criadoEm
    FROM registros
    WHERE 1=1
  `;

  const params = [];

  if (funcionarioId) {
    sql += ` AND funcionario_id = ?`;
    params.push(funcionarioId);
  }

  if (dataInicio) {
    const inicioMs = new Date(`${dataInicio}T00:00:00`).getTime();
    sql += ` AND data_hora >= ?`;
    params.push(inicioMs);
  }

  if (dataFim) {
    const fimMs = new Date(`${dataFim}T23:59:59`).getTime();
    sql += ` AND data_hora <= ?`;
    params.push(fimMs);
  }

  sql += ` ORDER BY data_hora DESC`;

  const [rows] = await pool.query(sql, params);
  res.json(rows);
}

async function listarRegistrosPorFuncionario(req, res) {
  const { funcionarioId } = req.params;

  const [rows] = await pool.query(
    `
    SELECT
      id,
      funcionario_id AS funcionarioId,
      funcionario_nome AS funcionarioNome,
      tipo,
      data_hora AS dataHora,
      latitude,
      longitude,
      criado_em AS criadoEm
    FROM registros
    WHERE funcionario_id = ?
    ORDER BY data_hora DESC
    `,
    [funcionarioId]
  );

  res.json(rows);
}

module.exports = {
  criarRegistro,
  listarRegistros,
  listarRegistrosPorFuncionario
};