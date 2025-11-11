// PhotoPicker.jsx
import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ImageIcon from '@mui/icons-material/Image';

export default function PhotoPicker({ value = [], onChange, t }) {
  const [items, setItems] = React.useState(value);

  React.useEffect(() => setItems(value), [value]);

  const addPhoto = (photo) => {
    const next = [photo, ...items];
    setItems(next);
    onChange?.(next);
  };

  const handleTakePhoto = async () => {
    try {
      const cap = window?.Capacitor;
      if (cap?.isNativePlatform?.()) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const { Filesystem } = await import('@capacitor/filesystem');

        const img = await Camera.getPhoto({
          quality: 70,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          saveToGallery: false
        });

        // Збережемо в Documents/lainsa/incidents/
        const fileName = `inc_${Date.now()}.jpeg`;
        const data = await fetch(img.webPath).then(r => r.blob());
        const base64 = await blobToBase64(data);

        const path = `lainsa/incidents/${fileName}`;
        await Filesystem.writeFile({
          path,
          data: base64,
          directory: Filesystem.Directory.Documents,
          recursive: true
        });

        addPhoto({ id: fileName, path, name: fileName, platform: 'capacitor', mime: 'image/jpeg' });
        return;
      }
    } catch (e) {
      console.warn('Capacitor camera failed', e);
    }
    // Веб fallback
    fileInputRef.current?.click();
  };

  const fileInputRef = React.useRef(null);
  const handleFilePicked = async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    addPhoto({ id: `web_${Date.now()}`, dataUrl, name: f.name, platform: 'web', mime: f.type || 'image/*' });
    ev.target.value = '';
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" startIcon={<CameraAltIcon />} onClick={handleTakePhoto}>
          {t?.('incidents.take_photo') || 'Take photo'}
        </Button>
        <Button variant="outlined" startIcon={<ImageIcon />} onClick={() => fileInputRef.current?.click()}>
          {t?.('incidents.add_from_gallery') || 'Add from gallery'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFilePicked}
        />
      </Stack>

      {items?.length ? (
        <Stack spacing={0.5}>
          {items.map(p => (
            <Typography key={p.id} variant="body2">• {p.name || p.path || p.id}</Typography>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t?.('incidents.no_photos') || 'No photos added yet.'}
        </Typography>
      )}
    </Stack>
  );
}

// helpers
async function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
