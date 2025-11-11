// saveShare.js
// Кросплатформені утиліти: зберегти файл локально, поділитися (Capacitor), перетворення у Blob/Base64.

export async function saveBlobToDevice(blob, fileName = 'file.bin') {
  try {
    const cap = window?.Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Filesystem } = await import('@capacitor/filesystem');
      const base64 = await blobToBase64(blob);
      const path = `lainsa/${fileName}`;
      await Filesystem.writeFile({
        path,
        data: base64,
        directory: Filesystem.Directory.Documents,
        recursive: true
      });
      return { ok: true, path };
    }
  } catch (e) {
    console.warn('Capacitor save failed, fallback to browser download', e);
  }

  // Web/Electron fallback
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
  return { ok: true, path: null };
}

export async function shareBlob(blob, fileName = 'file.bin', mimeType = 'application/octet-stream') {
  try {
    const cap = window?.Capacitor;
    if (cap?.isNativePlatform?.()) {
      const { Share } = await import('@capacitor/share');
      const { Filesystem } = await import('@capacitor/filesystem');
      const base64 = await blobToBase64(blob);
      const path = `lainsa/share/${fileName}`;
      await Filesystem.writeFile({
        path,
        data: base64,
        directory: Filesystem.Directory.Cache,
        recursive: true
      });
      const uri = await Filesystem.getUri({ path, directory: Filesystem.Directory.Cache });
      await Share.share({ title: fileName, url: uri?.uri || '', dialogTitle: 'Compartir' });
      return { ok: true };
    }
  } catch (e) {
    console.warn('Capacitor share failed', e);
  }

  if (navigator?.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: mimeType });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return { ok: true };
    }
  }
  alert('Sharing is not available on this device.');
  return { ok: false };
}

export function jsonToBlob(obj) {
  return new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
}

export function textToBlob(text, mime = 'text/plain') {
  return new Blob([text], { type: mime });
}

export async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
