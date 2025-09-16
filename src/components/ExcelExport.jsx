import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';

export default function ExcelExport({ data, fileName = 'report.xlsx', buttonProps }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('Немає даних для експорту');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Звіт');
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleExport}
      startIcon={<GridOnIcon />}
      {...buttonProps} // Дозволяє передавати додаткові стилі
    >
      Експорт y Excel
    </Button>
  );
}