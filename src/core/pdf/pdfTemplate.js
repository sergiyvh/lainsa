// pdfTemplate.js
import pdfMake from 'pdfmake/build/pdfmake';
import * as vfsModule from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = vfsModule.vfs || vfsModule?.default?.vfs || vfsModule?.pdfMake?.vfs;


// Бренд беремо ледачо (жодних const у TDZ):
function brand() {
  const cfg = (typeof window !== 'undefined' && window.__PDF_BRAND__) || {};
  return {
    NAME: cfg.NAME || 'LAINSA',
    ADDRESS: cfg.ADDRESS || 'C/ Dirección, 123, Valencia',
    PHONE: cfg.PHONE || '+34 000 000 000',
    EMAIL: cfg.EMAIL || 'info@lainsa.es',
  };
}

export function headerBlock(title, subtitle = '') {
  const B = brand();
  return {
    margin: [0, 0, 0, 10],
    columns: [
      [
        { text: B.NAME, style: 'h1' },
        { text: B.ADDRESS, style: 'meta' },
        { text: `${B.PHONE} · ${B.EMAIL}`, style: 'meta' },
      ],
      [
        { text: title, style: 'h2', alignment: 'right' },
        subtitle ? { text: subtitle, style: 'meta', alignment: 'right' } : {}
      ]
    ]
  };
}

export function footerBlock(currentPage, pageCount) {
  const B = brand();
  return {
    margin: [40, 0, 40, 0],
    columns: [
      { text: B.NAME, style: 'meta' },
      { text: `${currentPage} / ${pageCount}`, alignment: 'right', style: 'meta' }
    ]
  };
}

export function table(data, headers) {
  const body = [
    headers.map(h => ({ text: h.label, style: 'th' })),
    ...data.map(row => headers.map(h => ({ text: safe(row[h.key]), style: 'td' })))
  ];
  return {
    table: { headerRows: 1, widths: headers.map(() => '*'), body },
    layout: {
      fillColor: (rowIndex) => (rowIndex === 0 ? '#f3f3f3' : null),
      hLineColor: () => '#ddd',
      vLineColor: () => '#ddd'
    }
  };
}

function safe(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export function buildDoc({ title, subtitle, sections = [] }) {
  return {
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 60],
    header: () => headerBlock(title, subtitle),
    footer: (currentPage, pageCount) => footerBlock(currentPage, pageCount),
    content: sections.flat(),
    styles: {
      h1: { fontSize: 16, bold: true },
      h2: { fontSize: 14, bold: true },
      meta: { fontSize: 9, color: '#666' },
      th: { bold: true, fontSize: 10 },
      td: { fontSize: 10 }
    },
    defaultStyle: { fontSize: 10 }
  };
}

export function para(text) {
  return { text, margin: [0, 0, 0, 6] };
}

export { pdfMake };
