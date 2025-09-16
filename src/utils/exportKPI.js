// src/utils/exportKPI.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function safeDate(s) {
  return String(s || "").replace(/[^0-9\-W]/g, "");
}

function toCsvCell(v) {
  const s = v == null ? "" : String(v);
  if (s.includes(";") || s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportKpiToCsv(chartData, { strings, startDate, endDate, filenamePrefix = "KPI" } = {}) {
  const S = strings;
  const header = [
    S.col_label,
    S.col_kgh_maniana,
    S.col_kgh_tarde,
    S.col_kgh_total,
    S.col_kg_total,
    S.col_hours_total,
  ];

  const rows = chartData.map(r => [
    r.label,
    r.kgh_maniana,
    r.kgh_tarde,
    r.kgh_total,
    r.kg_total,
    r.hours_total,
  ]);

  const lines = [
    `${S.export_title};`,
    `${S.export_period};${startDate || ""}..${endDate || ""}`,
    `${S.export_generated};${new Date().toISOString()}`,
    "",
    header.join(";"),
    ...rows.map(r => r.map(toCsvCell).join(";")),
  ];

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const sd = safeDate(startDate);
  const ed = safeDate(endDate);
  a.href = URL.createObjectURL(blob);
  a.download = `${filenamePrefix}_${sd}_${ed}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function exportKpiToPdf(chartData, { strings, startDate, endDate, filenamePrefix = "KPI" } = {}) {
  const S = strings;

  const head = `
    <tr>
      <th>${S.col_label}</th>
      <th>${S.col_kgh_maniana}</th>
      <th>${S.col_kgh_tarde}</th>
      <th>${S.col_kgh_total}</th>
      <th>${S.col_kg_total}</th>
      <th>${S.col_hours_total}</th>
    </tr>`;

  const body = chartData.map(r => `
    <tr>
      <td>${r.label ?? ""}</td>
      <td>${r.kgh_maniana ?? ""}</td>
      <td>${r.kgh_tarde ?? ""}</td>
      <td>${r.kgh_total ?? ""}</td>
      <td>${r.kg_total ?? ""}</td>
      <td>${r.hours_total ?? ""}</td>
    </tr>`).join("");

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${S.export_title}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    .meta { color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: right; }
    th:first-child, td:first-child { text-align: left; }
    thead th { background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>${S.export_title}</h1>
  <div class="meta">
    <div><strong>${S.export_period}:</strong> ${startDate || ""} .. ${endDate || ""}</div>
    <div><strong>${S.export_generated}:</strong> ${new Date().toLocaleString()}</div>
  </div>
  <table>
    <thead>${head}</thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`.trim();

  const sd = safeDate(startDate);
  const ed = safeDate(endDate);

  // --- 1) Якщо є Electron API — друкуємо через printToPDF (якість краща)
  if (window?.electronAPI?.savePdf) {
    const res = await window.electronAPI.savePdf({
      html,
      defaultPath: `${filenamePrefix}_${sd}_${ed}.pdf`,
      landscape: true,
      marginsType: 1
    });
    if (!res?.success) {
      console.error("PDF export error:", res?.error || res);
      alert("Помилка експорту PDF.");
    }
    return;
  }

  // --- 2) Fallback: jsPDF + html2canvas (працює навіть у звичайному браузері)
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '1123px';   // приблизно A4 landscape у px @96dpi
  container.style.padding = '24px';
  container.style.background = '#fff';
  container.style.zIndex = '-9999';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;

    pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH);
    pdf.save(`${filenamePrefix}_${sd}_${ed}.pdf`);
  } catch (err) {
    console.error('jsPDF fallback error:', err);
    alert('Помилка експорту PDF (fallback).');
  } finally {
    document.body.removeChild(container);
  }
}
