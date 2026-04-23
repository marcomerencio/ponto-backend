const ExcelJS = require('exceljs');
const pool = require('../config/db');

async function exportarRelatorioExcel(req, res) {
  const { funcionarioId, dataInicio, dataFim } = req.query;

  let sql = `
    SELECT
      r.id,
      r.funcionario_id,
      f.nome AS funcionario_nome,
      f.email AS funcionario_email,
      r.tipo,
      r.data_hora,
      r.latitude,
      r.longitude
    FROM registros r
    INNER JOIN funcionarios f ON f.id = r.funcionario_id
    WHERE 1 = 1
  `;

  const params = [];

  if (funcionarioId) {
    sql += ` AND r.funcionario_id = ?`;
    params.push(Number(funcionarioId));
  }

  if (dataInicio) {
    sql += ` AND r.data_hora >= ?`;
    params.push(Number(dataInicio));
  }

  if (dataFim) {
    sql += ` AND r.data_hora <= ?`;
    params.push(Number(dataFim));
  }

  sql += ` ORDER BY r.data_hora DESC`;

  const [rows] = await pool.query(sql, params);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatorio Ponto');

  worksheet.columns = [
    { header: 'ID Registo', key: 'id', width: 24 },
    { header: 'Funcionário ID', key: 'funcionario_id', width: 14 },
    { header: 'Funcionário', key: 'funcionario_nome', width: 24 },
    { header: 'Email', key: 'funcionario_email', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Data/Hora', key: 'data_hora_formatada', width: 22 },
    { header: 'Latitude', key: 'latitude', width: 14 },
    { header: 'Longitude', key: 'longitude', width: 14 }
  ];

  worksheet.getRow(1).font = { bold: true };

  rows.forEach((row) => {
    worksheet.addRow({
      id: row.id,
      funcionario_id: row.funcionario_id,
      funcionario_nome: row.funcionario_nome,
      funcionario_email: row.funcionario_email,
      tipo: row.tipo,
      data_hora_formatada: new Date(Number(row.data_hora)).toLocaleString('pt-PT'),
      latitude: row.latitude,
      longitude: row.longitude
    });
  });

  const nomeFicheiro = `relatorio_ponto_${Date.now()}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${nomeFicheiro}"`
  );

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = {
  exportarRelatorioExcel
};