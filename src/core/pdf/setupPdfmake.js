// src/core/pdf/setupPdfmake.js
import pdfMake from 'pdfmake/build/pdfmake';
import * as vfsModule from 'pdfmake/build/vfs_fonts';

// Дістаємо vfs з урахуванням різних варіантів експорту
const vfs =
  // ESM: { vfs }
  (vfsModule && vfsModule.vfs) ||
  // CJS default: { default: { vfs } }
  (vfsModule && vfsModule.default && vfsModule.default.vfs) ||
  // Іноді імпортують як pdfFonts.pdfMake.vfs
  (vfsModule && vfsModule.pdfMake && vfsModule.pdfMake.vfs);

if (!vfs) {
  // Фолбек — не впаде, але PDF не згенерується; зате буде зрозуміла помилка
  // eslint-disable-next-line no-console
  console.error('[pdfmake] vfs not found in vfs_fonts module');
} else {
  pdfMake.vfs = vfs;
}

export default pdfMake;
