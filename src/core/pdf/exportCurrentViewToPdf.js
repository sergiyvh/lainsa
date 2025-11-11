import pdfMake from 'pdfmake/build/pdfmake';
import { vfs as pdfVfs } from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfVfs;

/**
 * Simple programmatic export service (optional).
 * When you already assembled your data in the page, prefer calling pdfmake directly.
 */
export async function exportCurrentViewToPdf({ title, headerText = '', tableBody = [], meta = {} }) {
  const today = new Date().toLocaleString();
  const docDefinition = {
    info: { title: title || 'Informe' },
    content: [
      { text: title || 'Informe', style: 'title' },
      headerText ? { text: headerText, margin: [0, 8, 0, 12] } : null,
      {
        table: {
          headerRows: 1,
          widths: Array((tableBody?.[0]?.length || 1)).fill('*'),
          body: (tableBody && tableBody.length) ? tableBody : [['(sin datos)']],
        },
        layout: 'lightHorizontalLines',
      },
      { text: meta?.right || today, alignment: 'right', style: 'meta', margin: [0, 12, 0, 0] },
    ].filter(Boolean),
    styles: {
      title: { fontSize: 16, bold: true },
      meta: { fontSize: 9, color: '#555' },
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [24,24,24,28],
  };
  pdfMake.createPdf(docDefinition).download(`${(title || 'informe').replace(/\s+/g,'_')}.pdf`);
}
