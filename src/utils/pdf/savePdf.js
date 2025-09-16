// src/utils/pdf/savePdf.js
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res((r.result || '').toString().split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

export async function saveBlobSmart(blob, fileName = 'report.pdf') {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    const path = `reports/${fileName}`;
    await Filesystem.writeFile({ path, directory: Directory.Data, data: base64 });
    return { ok: true, path };
  }
  // веб/десктоп
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
  return { ok: true };
}
