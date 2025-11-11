import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Stack } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs as pdfVfs } from 'pdfmake/build/vfs_fonts';
import { t } from '../i18n/i18n';

pdfMake.vfs = pdfVfs;

/**
 * Reusable quick actions bar for dashboards:
 * - New Incident
 * - Incidents list
 * - Export current dashboard to PDF (lightweight)
 */
export default function DashboardQuickActions({
  pdfTitle = 'Informe del panel',
  getPdfData,
  toNewIncident = '/incidents/new',
  toIncidentsList = '/incidents',
  size = 'medium',
}) {
  const navigate = useNavigate();

  const handleExport = async () => {
    try {
      const data = (typeof getPdfData === 'function') ? await getPdfData() : {};
      const title = t('dashboard.reportTitle') || pdfTitle || 'Informe del panel';
      const now = new Date().toLocaleString();
      const tableBody = data?.tableBody && data.tableBody.length
        ? data.tableBody
        : [[t('col.date')||'Fecha', t('col.client')||'Cliente', t('col.type')||'Tipo', t('col.status')||'Estado']];

      const doc = {
        info: { title },
        content: [
          { text: title, style: 'title' },
          { text: now, style: 'meta', margin: [0, 0, 0, 12] },
          data?.headerText ? { text: data.headerText, margin: [0, 0, 0, 8] } : null,
          {
            table: {
              headerRows: 1,
              widths: Array(tableBody[0].length).fill('*'),
              body: tableBody,
            },
            layout: 'lightHorizontalLines',
          },
        ].filter(Boolean),
        styles: {
          title: { fontSize: 16, bold: true },
          meta: { fontSize: 9, color: '#666' }
        },
        defaultStyle: { fontSize: 10 },
        pageMargins: [24,24,24,28],
      };
      pdfMake.createPdf(doc).download(`${title.replace(/\s+/g,'_')}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
      <Button size={size} variant="contained" startIcon={<ReportProblemIcon />} onClick={() => navigate(toNewIncident)}>
        {t('incidents.newButton') || 'Nuevo incidente'}
      </Button>
      <Button size={size} variant="outlined" onClick={() => navigate(toIncidentsList)}>
        {t('incidents.listButton') || 'Incidentes'}
      </Button>
      <Button size={size} variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExport}>
        {t('export.pdf') || 'Exportar PDF'}
      </Button>
    </Stack>
  );
}
