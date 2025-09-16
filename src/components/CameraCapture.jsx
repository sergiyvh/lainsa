// src/components/CameraCapture.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export default function CameraCapture({ onShot }) {
  const isNative = Capacitor?.isNativePlatform?.();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isNative) return; // На нативі робимо фото через Capacitor Camera
    let mounted = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        if (!mounted) return;
        streamRef.current = stream;
        const v = videoRef.current;
        v.srcObject = stream;
        await v.play();
        setReady(true);
      } catch (e) {
        console.error('CameraCapture getUserMedia error:', e);
      }
    })();
    return () => {
      streamRef.current?.getTracks?.().forEach(t => t.stop());
    };
  }, [isNative]);

  const handleShot = async () => {
    try {
      if (isNative) {
        const photo = await Camera.getPhoto({
          source: CameraSource.Camera,
          resultType: CameraResultType.DataUrl,
          quality: 85,
          saveToGallery: false
        });
        onShot?.(photo.dataUrl);
        return;
      }
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onShot?.(dataUrl);
    } catch (e) {
      console.error('CameraCapture handleShot error:', e);
    }
  };

  return (
    <Stack spacing={1}>
      {!isNative && (
        <Box sx={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 2 }}>
          <video ref={videoRef} style={{ width: '100%' }} muted playsInline />
        </Box>
      )}
      <Button variant="contained" onClick={handleShot} disabled={!isNative && !ready}>
        {isNative ? 'Зробити фото' : (ready ? 'Зробити фото' : 'Камера ініціалізується…')}
      </Button>
    </Stack>
  );
}
