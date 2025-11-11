// src/core/pdf/exporters.js
import { buildDoc, para, table, pdfMake } from './pdfTemplate';

export function buildIncidentPDF({ incident, t }) {
  const title = t?.('incidents.title_pdf') || 'Incident';
  const subtitle = `${t?.('common.date') || 'Date'}: ${incident.date || ''}`;
  const info = [
    para(`${t?.('incidents.responsible') || 'Responsible'}: ${incident.responsible || ''}`),
    para(`${t?.('incidents.client') || 'Client'}: ${incident.client || ''}`),
    para(`${t?.('incidents.type') || 'Type'}: ${incident.type || ''}`),
    para(`${t?.('incidents.description') || 'Description'}: ${incident.description || ''}`),
  ];
  const photos = (incident.photos || []).map((p, idx) =>
    para(`${t?.('incidents.photo') || 'Photo'} #${idx + 1}: ${p.name || p.path || ''}`)
  );

  return buildDoc({ title, subtitle, sections: [info, photos.length ? [para(''), para(t?.('incidents.photos') || 'Photos:'), ...photos] : []] });
}

export function buildSimpleTablePDF({ title, subtitle, headers, rows }) {
  return buildDoc({ title, subtitle, sections: [table(rows, headers)] });
}

export function downloadDoc(docDefinition, fileName = 'export.pdf') {
  pdfMake.createPdf(docDefinition).download(fileName);
}
