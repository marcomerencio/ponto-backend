const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const pool = require('../config/db');

const JORNADA_NORMAL_HORAS = 8;

function formatarDataHora(timestamp) {
  return new Date(Number(timestamp)).toLocaleString('pt-PT');
}

function formatarData(timestamp) {
  return new Date(Number(timestamp)).toLocaleDateString('pt-PT');
}

function calcularResumo(rows) {
  const porFuncionarioDia = {};

  rows.forEach((r) => {
    const dia = new Date(Number(r.data_hora)).toISOString().split('T')[0];
    const chave = `${r.funcionario_id}_${dia}`;

    if (!porFuncionarioDia[chave]) {
      porFuncionarioDia[chave] = {
        funcionario: r.funcionario_nome || r.nome,
        dia,
        eventos: []
      };
    }

    porFuncionarioDia[chave].eventos.push({
      tipo: r.tipo,
      timestamp: Number(r.data_hora)
    });
  });

  return Object.values(porFuncionarioDia).map((item) => {
    const eventos = item.eventos.sort((a, b) => a.timestamp - b.timestamp);

    let entrada = null;
    let totalMs = 0;

    eventos.forEach((evento) => {
      if (evento.tipo === 'ENTRADA') {
        entrada = evento.timestamp;
      }

      if (evento.tipo === 'SAIDA' && entrada) {
        totalMs += evento.timestamp - entrada;
        entrada = null;
      }
    });

    const horas = totalMs / (1000 * 60 * 60);
    const horasExtra = Math.max(0, horas - JORNADA_NORMAL_HORAS);

    return {
      funcionario: item.funcionario,
      dia: item.dia,
      horas: horas.toFixed(2),
      horasExtra: horasExtra.toFixed(2)
    };
  });
}

async function obterRegistrosComFiltros(query) {
  const { funcionarioId, dataInicio, dataFim } = query;

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
    JOIN funcionarios f ON f.id = r.funcionario_id
    WHERE 1 = 1
  `;

  const params = [];

  if (funcionarioId) {
    sql += ' AND r.funcionario_id = ?';
    params.push(Number(funcionarioId));
  }

  if (dataInicio) {
    sql += ' AND r.data_hora >= ?';
    params.push(Number(dataInicio));
  }

  if (dataFim) {
    sql += ' AND r.data_hora <= ?';
    params.push(Number(dataFim));
  }

  sql += ' ORDER BY r.data_hora ASC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function exportarRelatorioExcel(req, res) {
  try {
    const rows = await obterRegistrosComFiltros(req.query);
    const resumo = calcularResumo(rows);

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('Registos');
    sheet.columns = [
      { header: 'ID Registo', key: 'id', width: 36 },
      { header: 'Funcionário ID', key: 'funcionarioId', width: 16 },
      { header: 'Funcionário', key: 'funcionario', width: 28 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Tipo', key: 'tipo', width: 14 },
      { header: 'Data/Hora', key: 'dataHora', width: 24 },
      { header: 'Latitude', key: 'latitude', width: 16 },
      { header: 'Longitude', key: 'longitude', width: 16 }
    ];
    sheet.getRow(1).font = { bold: true };

    rows.forEach((r) => {
      sheet.addRow({
        id: r.id,
        funcionarioId: r.funcionario_id,
        funcionario: r.funcionario_nome,
        email: r.funcionario_email,
        tipo: r.tipo,
        dataHora: formatarDataHora(r.data_hora),
        latitude: r.latitude,
        longitude: r.longitude
      });
    });

    const resumoSheet = workbook.addWorksheet('Resumo');
    resumoSheet.columns = [
      { header: 'Funcionário', key: 'funcionario', width: 28 },
      { header: 'Dia', key: 'dia', width: 16 },
      { header: 'Horas Trabalhadas', key: 'horas', width: 20 },
      { header: 'Horas Extra', key: 'horasExtra', width: 16 }
    ];
    resumoSheet.getRow(1).font = { bold: true };
    resumo.forEach((r) => resumoSheet.addRow(r));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio_ponto_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
}

async function exportarRelatorioPDF(req, res) {
  try {
    const rows = await obterRegistrosComFiltros(req.query);
    const resumo = calcularResumo(rows);

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio_ponto_${Date.now()}.pdf`
    );

    doc.pipe(res);

    const logoPath = path.join(__dirname, '../assets/logo_bolhao.png');

    try {
      doc.image(logoPath, 40, 30, { width: 90 });
    } catch (e) {
      // Se o logo falhar, o PDF continua a ser gerado.
    }

    doc
      .fontSize(18)
      .text('GRUPO BOLHÃO', 150, 35, { align: 'left' });

    doc
      .fontSize(11)
      .text('TALHO & CONGELADOS', 150, 58, { align: 'left' });

    doc.moveDown(4);

    doc
      .fontSize(16)
      .text('Relatório de Entradas e Saídas', { align: 'center' });

    doc.moveDown();

    const periodoTexto =
      req.query.dataInicio || req.query.dataFim
        ? `Período: ${req.query.dataInicio ? formatarData(req.query.dataInicio) : 'início'} até ${req.query.dataFim ? formatarData(req.query.dataFim) : 'fim'}`
        : 'Período: Todos os registos';

    doc.fontSize(10).text(periodoTexto);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`);
    doc.moveDown();

    doc.fontSize(13).text('Registos', { underline: true });
    doc.moveDown(0.5);

    const startX = 40;
    let y = doc.y;

    function desenharHeaderTabela() {
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Funcionário', startX, y, { width: 130 });
      doc.text('Tipo', startX + 135, y, { width: 70 });
      doc.text('Data/Hora', startX + 210, y, { width: 120 });
      doc.text('Localização', startX + 335, y, { width: 190 });
      y += 18;
      doc.moveTo(startX, y - 5).lineTo(555, y - 5).stroke();
      doc.font('Helvetica');
    }

    desenharHeaderTabela();

    rows.forEach((r) => {
      if (y > 740) {
        doc.addPage();
        y = 50;
        desenharHeaderTabela();
      }

      const localizacao =
        r.latitude && r.longitude
          ? `${r.latitude}, ${r.longitude}`
          : '-';

      doc.fontSize(8);
      doc.text(r.funcionario_nome || '-', startX, y, { width: 130 });
      doc.text(r.tipo || '-', startX + 135, y, { width: 70 });
      doc.text(formatarDataHora(r.data_hora), startX + 210, y, { width: 120 });
      doc.text(localizacao, startX + 335, y, { width: 190 });

      y += 22;
    });

    doc.addPage();

    doc.fontSize(15).text('Resumo de Horas', { align: 'center' });
    doc.moveDown();

    y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Funcionário', startX, y, { width: 170 });
    doc.text('Dia', startX + 180, y, { width: 100 });
    doc.text('Horas', startX + 290, y, { width: 80 });
    doc.text('Horas Extra', startX + 380, y, { width: 100 });
    y += 18;
    doc.moveTo(startX, y - 5).lineTo(555, y - 5).stroke();
    doc.font('Helvetica');

    resumo.forEach((r) => {
      if (y > 740) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(9);
      doc.text(r.funcionario, startX, y, { width: 170 });
      doc.text(r.dia, startX + 180, y, { width: 100 });
      doc.text(`${r.horas}h`, startX + 290, y, { width: 80 });
      doc.text(`${r.horasExtra}h`, startX + 380, y, { width: 100 });

      y += 20;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
}

async function obterResumo(req, res) {
  try {
    const rows = await obterRegistrosComFiltros(req.query);
    const resumo = calcularResumo(rows);

    res.json(resumo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar resumo' });
  }
}

module.exports = {
  exportarRelatorioExcel,
  exportarRelatorioPDF,
  obterResumo
};