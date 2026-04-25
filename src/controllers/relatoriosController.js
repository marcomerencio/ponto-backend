const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/db');

// ==========================
// 📊 FUNÇÃO AUXILIAR
// ==========================
function calcularResumo(rows) {
  const dias = {};

  rows.forEach(r => {
    const data = new Date(Number(r.data_hora));
    const dia = data.toISOString().split('T')[0];

    if (!dias[dia]) dias[dia] = [];

    dias[dia].push({
      tipo: r.tipo,
      timestamp: Number(r.data_hora)
    });
  });

  const resultado = [];

  Object.keys(dias).forEach(dia => {
    const eventos = dias[dia].sort((a, b) => a.timestamp - b.timestamp);

    let totalMs = 0;
    let entrada = null;

    eventos.forEach(ev => {
      if (ev.tipo === 'ENTRADA') entrada = ev.timestamp;
      if (ev.tipo === 'SAIDA' && entrada) {
        totalMs += ev.timestamp - entrada;
        entrada = null;
      }
    });

    const horas = totalMs / (1000 * 60 * 60);
    const horasExtra = Math.max(0, horas - 8);

    resultado.push({
      dia,
      horas: horas.toFixed(2),
      horasExtra: horasExtra.toFixed(2)
    });
  });

  return resultado;
}

// ==========================
// 📄 PDF
// ==========================
async function exportarRelatorioPDF(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, f.nome
      FROM registros r
      JOIN funcionarios f ON f.id = r.funcionario_id
      ORDER BY r.data_hora DESC
    `);

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio.pdf');

    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(18).text('GRUPO BOLHÃO TALHO & CONGELADOS', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Relatório de Ponto', { align: 'center' });
    doc.moveDown();

    rows.forEach(r => {
      doc
        .fontSize(10)
        .text(`${r.nome} | ${r.tipo} | ${new Date(Number(r.data_hora)).toLocaleString('pt-PT')}`);
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro PDF' });
  }
}

// ==========================
// 📊 RESUMO (JSON)
// ==========================
async function obterResumo(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, f.nome
      FROM registros r
      JOIN funcionarios f ON f.id = r.funcionario_id
    `);

    const resumo = calcularResumo(rows);

    res.json(resumo);

  } catch (err) {
    res.status(500).json({ error: 'Erro resumo' });
  }
}

// ==========================
// 📊 EXCEL (já tinhas)
// ==========================
async function exportarRelatorioExcel(req, res) {
  const [rows] = await pool.query(`
    SELECT r.*, f.nome
    FROM registros r
    JOIN funcionarios f ON f.id = r.funcionario_id
  `);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Relatório');

  sheet.columns = [
    { header: 'Funcionário', key: 'nome', width: 25 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Data/Hora', key: 'data', width: 20 }
  ];

  rows.forEach(r => {
    sheet.addRow({
      nome: r.nome,
      tipo: r.tipo,
      data: new Date(Number(r.data_hora)).toLocaleString('pt-PT')
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio.xlsx');

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = {
  exportarRelatorioExcel,
  exportarRelatorioPDF,
  obterResumo
};