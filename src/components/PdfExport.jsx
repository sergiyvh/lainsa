import React from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || {};

export default function PdfExport({ data, fileName = 'report.pdf', buttonProps }) {
  const handleExport = () => {
    // ... ваша логіка для pdfMake ...
    if (!data || data.length === 0) {
        alert('Немає даних для експорту');
        return;
    }
    const docDefinition = { /* ... ваша структура документу ... */ };
    pdfMake.createPdf(docDefinition).download(fileName);
  };

  return (
    <Button
      variant="contained"
      color="error" // Червоний колір
      onClick={handleExport}
      startIcon={<PictureAsPdfIcon />}
      {...buttonProps}
    >
      Експорт y PDF
    </Button>
  );
}