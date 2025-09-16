// src/utils/pdf/reportPdf.js
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs } from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = vfs; // Цей рядок також обов'язковий

/**
 * Допоміжна: завантажити з public/ шлях (або будь-який URL) у dataURL (base64),
 * щоби pdfmake міг підставити image: dataURL.
 */
export async function loadImageAsDataUrl(src) {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/**
 * Побудова PDF-документа (document definition).
 * report: { id, title, type, clientName, date, items:[{label,value}], photos:[{dataUrl|path}] }
 * options: { t, logoDataUrl } — t: функція локалізації; logoDataUrl: dataURL логотипа.
 */
export function buildReportDoc(report, { t, logoDataUrl }) {
  const _t = (k, d) => (t ? t(k) : d);
  const dateStr = report?.date ? new Date(report.date).toLocaleString() : new Date().toLocaleString();

  const headerColumns = [
    logoDataUrl
      ? { image: logoDataUrl, width: 90 }
      : { text: 'LAINSA', style: 'brand' },
    {
      stack: [
        { text: _t('reports.report', 'Report') + ` #${report?.id ?? '-'}`, style: 'headerTitle' },
        { text: _t('common.generatedAt', 'Generated') + `: ${new Date().toLocaleString()}`, style: 'headerMeta' }
      ],
      alignment: 'right'
    }
  ];

  const metaColumns = [
    { text: `${_t('reports.type', 'Type')}: ${report?.type ?? '-'}`, style: 'small' },
    { text: `${_t('labels_client', 'Client')}: ${report?.clientName ?? '-'}`, style: 'small' },
    { text: `${_t('labels_date', 'Date')}: ${dateStr}`, style: 'small', alignment: 'right' },
  ];

  const itemsTable = {
    table: {
      widths: ['*', '*'],
      body: [
        [{ text: _t('reports.field', 'Field'), style: 'tableH' },
         { text: _t('reports.value', 'Value'), style: 'tableH' }],
        ...((report?.items || []).map(p => [
          { text: p.label ?? '', style: 'label' },
          `${p.value ?? ''}`
        ]))
      ]
    },
    layout: 'lightHorizontalLines',
    margin: [0, 6, 0, 10]
  };

  const photosBlock = (Array.isArray(report?.photos) && report.photos.length)
    ? [
        { text: _t('reports.attachments', 'Attachments'), style: 'label', margin: [0, 8, 0, 4] },
        {
          columns: report.photos.slice(0, 3).map(ph => ({
            image: ph.dataUrl || ph.path, // бажано підставляти dataUrl
            fit: [180, 120],
            margin: [0, 0, 6, 0]
          }))
        }
      ]
    : [];

  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    header: {
      margin: [40, 20, 40, 0],
      columns: headerColumns
    },
    footer: function(currentPage, pageCount) {
      return {
        margin: [40, 0, 40, 20],
        columns: [
          { text: 'LAINSA INSULAR S.L.', style: 'footer' },
          { text: `${currentPage} / ${pageCount}`, alignment: 'right', style: 'footer' }
        ]
      };
    },
    styles: {
      brand:        { fontSize: 18, bold: true },
      headerTitle:  { fontSize: 14, bold: true },
      headerMeta:   { fontSize: 9, color: '#666' },
      title:        { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
      meta:         { fontSize: 10, color: '#666' },
      label:        { bold: true },
      tableH:       { fillColor: '#f5f5f5', bold: true },
      small:        { fontSize: 9, color: '#666' },
      footer:       { fontSize: 9, color: '#777' },
    },
    content: [
      { text: report?.title || _t('reports.untitled', 'Untitled'), style: 'title' },
      { columns: metaColumns, margin: [0, 0, 0, 6] },
      itemsTable,
      ...photosBlock
    ],
    defaultStyle: {
      fontSize: 11
    }
  };
}

/**
 * Створити Blob PDF у браузері/вебв’ю.
 */
export async function exportReportPdf(report, { t, logoDataUrl }) {
  const dd = buildReportDoc(report, { t, logoDataUrl });
  return new Promise((resolve) => {
    pdfMake.createPdf(dd).getBlob((blob) => resolve(blob));
  });
}
