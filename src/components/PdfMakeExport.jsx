import React from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs } from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = vfs;

export default function PdfMakeExport({ data, fileName = 'export' }) {
  const generatePdf = () => {
    const body = [
      [
        { text: 'Fecha', style: 'tableHeader' },
        { text: 'Usuario', style: 'tableHeader' },
        { text: 'Total túnel (kg)', style: 'tableHeader' },
        { text: 'Rechazo túnel (kg)', style: 'tableHeader' },
        { text: 'Total ciclos', style: 'tableHeader' },
      ],
      ...data.map(item => [
        item.Fecha,
        item.Usuario,
        item['Total túnel (kg)'],
        item['Rechazo túnel (kg)'],
        item['Total ciclos'],
      ])
    ];

    const docDefinition = {
      content: [
        { text: 'Reporte de registros - Lainsa', style: 'header' },
        {
          style: 'tableExample',
          table: {
            widths: ['*', '*', '*', '*', '*'],
            body: body,
          },
          layout: {
            fillColor: (rowIndex) => rowIndex % 2 === 0 ? '#f0f0f0' : null,
          },
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true, marginBottom: 10, alignment: 'center' },
        tableExample: { margin: [0, 5, 0, 15] },
        tableHeader: { bold: true, fontSize: 13, color: 'black', fillColor: '#dce6f1' },
      },
      defaultStyle: { fontSize: 11 },
    };
    pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
  };

  return (
    <button onClick={generatePdf} style={{ padding: '8px 16px', cursor: 'pointer' }}>
      Exportar PDF Avanzado
    </button>
  );
}
