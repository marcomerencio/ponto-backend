const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');

async function createCsv(registros) {
  const filePath = path.join(os.tmpdir(), `registros_${Date.now()}.csv`);
  const writer = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'funcionario_id', title: 'Funcionario ID' },
      { id: 'funcionario_nome', title: 'Funcionario' },
      { id: 'tipo', title: 'Tipo' },
      { id: 'data_hora', title: 'Data Hora' },
      { id: 'latitude', title: 'Latitude' },
      { id: 'longitude', title: 'Longitude' }
    ]
  });
  await writer.writeRecords(registros);
  return filePath;
}

function createPdf(registros) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(os.tmpdir(), `registros_${Date.now()}.pdf`);
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text('Relatório de Registos de Ponto', { underline: true });
    doc.moveDown();

    registros.forEach((r, i) => {
      doc.fontSize(11).text(
        `${i + 1}. ${r.funcionario_nome} (${r.funcionario_id}) | ${r.tipo} | ${r.data_hora} | Lat: ${r.latitude ?? '-'} | Lng: ${r.longitude ?? '-'}`
      );
      doc.moveDown(0.4);
    });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { createCsv, createPdf };
