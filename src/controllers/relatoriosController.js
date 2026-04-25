const ExcelJS = require('exceljs');
const pool = require('../config/db');

async function exportarRelatorioExcel(req, res) {
  try {
    const { dataInicio, dataFim, funcionarioId } = req.query;

    let sql = `
      SELECT
        r.id,
        f.nome AS funcionario_nome,
        f.email,
        r.tipo,
        r.data_hora,
        r.latitude,
        r.longitude
      FROM registros r
      JOIN funcionarios f ON f.id = r.funcionario_id
      WHERE 1=1
    `;

    const params = [];

    if (dataInicio) {
      sql += ` AND r.data_hora >= ?`;
      params.push(Number(dataInicio));
    }

    if (dataFim) {
      sql += ` AND r.data_hora <= ?`;
      params.push(Number(dataFim));
    }

    if (funcionarioId) {
      sql += ` AND r.funcionario_id = ?`;
      params.push(Number(funcionarioId));
    }

    sql += ` ORDER BY r.data_hora DESC`;

    const [rows] = await pool.query(sql, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Relatório Ponto');

    sheet.columns = [
      { header: 'Funcionário', key: 'nome', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Data/Hora', key: 'data', width: 22 },
      { header: 'Latitude', key: 'lat', width: 15 },
      { header: 'Longitude', key: 'lng', width: 15 }
    ];

    sheet.getRow(1).font = { bold: true };

    rows.forEach(r => {
      sheet.addRow({
        nome: r.funcionario_nome,
        email: r.email,
        tipo: r.tipo,
        data: new Date(Number(r.data_hora)).toLocaleString('pt-PT'),
        lat: r.latitude,
        lng: r.longitude
      });
    });

    const nomeFicheiro = `relatorio_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${nomeFicheiro}`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
}

module.exports = { exportarRelatorioExcel };