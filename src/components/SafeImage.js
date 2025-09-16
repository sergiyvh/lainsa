// src/components/SafeImage.js
import React, { useEffect, useState } from 'react';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
  <rect width="100%" height="100%" fill="#f1f3f4"/>
  <g fill="#9aa0a6" font-family="Arial,Helvetica,sans-serif" font-size="18" text-anchor="middle">
    <text x="50%" y="50%">no image</text>
  </g></svg>`);

function isDataUrl(s){ return /^data:image\//i.test(s||''); }
function isHttpUrl(s){ return /^https?:\/\//i.test(s||''); }
function isPublicPath(s){ return typeof s==='string' && s.startsWith('/'); }
function looksLikeFsPath(s){
  return /^[a-zA-Z]:\\/.test(s||'') || /^\\\\/.test(s||'') || /^file:/.test(s||'') || (/^\//.test(s||'') && !isPublicPath(s));
}

export default function SafeImage({ src, alt, style, ...rest }) {
  const [imgSrc, setImgSrc] = useState(PLACEHOLDER);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const s = (src||'').toString().trim();
      if (!s) { setImgSrc(PLACEHOLDER); return; }

      if (isDataUrl(s) || isHttpUrl(s) || isPublicPath(s)) { setImgSrc(s); return; }

      if (looksLikeFsPath(s) && window.electronAPI?.readFileAsDataUrl) {
        try {
          const dataUrl = await window.electronAPI.readFileAsDataUrl(s);
          if (!canceled) setImgSrc(dataUrl || PLACEHOLDER);
          return;
        } catch { /* fallthrough */ }
      }
      setImgSrc(s || PLACEHOLDER);
    })();
    return () => { canceled = true; };
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      onError={() => setImgSrc(PLACEHOLDER)}
      style={{ display:'block', width:'100%', height:140, objectFit:'cover', borderRadius:12, ...style }}
      {...rest}
    />
  );
}
