
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardHeader, CardContent, CardActions,
  Typography, Stack, Divider, Button, Chip, Avatar, IconButton, Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';

import { t, /* опційно: */ getLibLicenses } from '../i18n/i18n';

// м'який фолбек до іспанської фрази, якщо ключа поки немає в i18n.js
const tr = (key, esFallback) => {
  const s = t(key);
  return s === key ? esFallback : s;
};

// --------- версія застосунку (без import.meta) ------------------------------
async function detectAppVersion() {
  // 1) Electron preload API (підтримка і window.api, і window.electronAPI)
  try {
    const api = (window.api && window.api.app?.getVersion)
      ? window.api
      : (window.electronAPI && window.electronAPI.app?.getVersion ? window.electronAPI : null);
    if (api?.app?.getVersion) return await api.app.getVersion();
  } catch {}

  // 2) ENV (CRA/Webpack)
  try {
    const envVer = (typeof process !== 'undefined' && process?.env?.REACT_APP_VERSION) || null;
    if (envVer) return String(envVer);
  } catch {}

  // 3) meta.json (генеруємо скриптом prestart/prebuild)
  try {
    const res = await fetch('/meta.json', { cache: 'no-store' });
    if (res.ok) {
      const meta = await res.json();
      if (meta?.version) return meta.version;
    }
  } catch {}

  // 4) Dev fallback: package.json
  try {
    const res = await fetch('/package.json', { cache: 'no-store' });
    if (res.ok) {
      const pkg = await res.json();
      if (pkg?.version) return pkg.version;
    }
  } catch {}

  // 5) LocalStorage запасний
  try { const v = localStorage.getItem('app_version'); if (v) return v; } catch {}

  return '0.0.0';
}

// читаємо короткий CHANGELOG.md (якщо є у /public)
async function loadChangelog() {
  try {
    const res = await fetch('/CHANGELOG.md', { cache: 'no-store' });
    if (!res.ok) return null;
    const txt = await res.text();
    return txt.slice(0, 2000);
  } catch { return null; }
}

// можливе джерело логотипа: /logo.png або /logo512.png
function guessLogoSrc() { return '/logo.png'; }

export default function About() {
  const [version, setVersion] = useState('—');
  const [env, setEnv] = useState('web'); // 'electron' | 'web'
  const [changelog, setChangelog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [libs, setLibs] = useState({ deps: [], devDeps: [] });

  const logoSrc = useMemo(() => guessLogoSrc(), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setBusy(true);
      const [v, log] = await Promise.all([detectAppVersion(), loadChangelog()]);
      if (!alive) return;
      setVersion(v || '—');
      try { localStorage.setItem('app_version', v || ''); } catch {}
      setChangelog(log);
      try { setEnv(window?.process?.versions?.electron ? 'electron' : 'web'); } catch { setEnv('web'); }
      // ліцензії (не критично; якщо немає утиліти — просто замовкне)
      try {
        if (typeof getLibLicenses === 'function') {
          const l = await getLibLicenses();
          setLibs(l || { deps: [], devDeps: [] });
        }
      } catch {}
      setBusy(false);
    })();
    return () => { alive = false; };
  }, []);

  const diagnostics = useMemo(() => {
    const lines = [];
    lines.push(`App: ${tr('app_title', 'LainsaApp')}`);
    lines.push(`Version: ${version}`);
    lines.push(`Environment: ${env}`);
    try {
      const v = window.process?.versions || {};
      if (v) {
        lines.push(`Electron: ${v.electron || 'n/a'}`);
        lines.push(`Chrome: ${v.chrome || 'n/a'}`);
        lines.push(`Node: ${v.node || 'n/a'}`);
      }
    } catch {}
    try {
      lines.push(`Language: ${localStorage.getItem('lang') || 'es'}`);
    } catch {}
    return lines.join('\n');
  }, [version, env]);

  const copyDiagnostics = async () => {
    try { await navigator.clipboard.writeText(diagnostics); alert(tr('about_copied', 'Copiado al portapapeles')); }
    catch { alert(tr('about_copy_fail', 'No se pudo copiar')); }
  };

  const saveDiagnosticsFile = () => {
    const blob = new Blob([diagnostics], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lainsa_diagnostics.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box p={2}>
      <Card>
        <CardHeader
          title={tr('about_title', 'Acerca de la aplicación')}
          subheader={tr('about_subtitle', 'Información de la versión y créditos')}
          action={
            <Tooltip title={tr('common_refresh', 'Actualizar')}>
              <span>
                <IconButton onClick={() => window.location.reload()} disabled={busy}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          }
        />
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Avatar
              src={logoSrc}
              alt="Logo"
              sx={{ width: 84, height: 84, borderRadius: 2, bgcolor: 'primary.main', fontSize: 28 }}
            >
              {tr('brand', 'LAINSA').slice(0, 2)}
            </Avatar>

            <Box flex={1} minWidth={260}>
              <Typography variant="h5" gutterBottom>{tr('app_title', 'LainsaApp')}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`${tr('about_version', 'Versión')}: ${version}`} />
                <Chip label={`${tr('about_environment', 'Entorno')}: ${env}`} />
                <Chip label={tr('about_company_type', 'Software para lavanderías')} />
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {tr('app_subtitle', 'Lainsa Production Manager')}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Автор / контакт */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{tr('about_author', 'Autor')}</Typography>
            <Typography>{tr('about_author_name', 'Serhii Solodukha')}</Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>{tr('about_company', 'Compañía')}</Typography>
            <Typography>{tr('about_company_name', 'SVH Group UA — LAVANDERIA INSULAR SL (LAINSA)')}</Typography>

            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
              <Button
                variant="outlined"
                href="mailto:sergiisolodukha@gmail.com"
              >
                {tr('about_contact', 'Contacto')}
              </Button>
              {/* Приховуємо кнопку сайту, якщо URL порожній */}
              {Boolean('') && (
                <Button
                  variant="outlined"
                  href=""
                  target="_blank" rel="noreferrer"
                >
                  {tr('about_website', 'Sitio web')}
                </Button>
              )}
            </Stack>
          </Box>

          {/* Changelog (необов’язковий) */}
          {changelog && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">{tr('about_changelog', 'Novedades')}</Typography>
              <Box
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  bgcolor: 'background.default',
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  maxHeight: 320,
                  overflow: 'auto',
                }}
              >
                {changelog}
              </Box>
            </>
          )}

          {/* Licenses (якщо доступна утиліта) */}
          {(libs.deps?.length || libs.devDeps?.length) ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">{tr('about_licenses_title', 'Licencias de bibliotecas')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {tr('about_licenses_desc', 'Lista generada a partir de package.json')}
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 1 }}>{tr('about_dep_runtime', 'Dependencias')}</Typography>
              <Box component="ul" sx={{ pl: 3, mt: 0.5 }}>
                {libs.deps.map(d => (
                  <li key={d.name}><Typography variant="body2">{d.name} <strong>{d.version}</strong></Typography></li>
                ))}
                {libs.deps.length === 0 && <Typography variant="body2" color="text.secondary">—</Typography>}
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 1 }}>{tr('about_dep_dev', 'Dependencias de desarrollo')}</Typography>
              <Box component="ul" sx={{ pl: 3, mt: 0.5 }}>
                {libs.devDeps.map(d => (
                  <li key={d.name}><Typography variant="body2">{d.name} <strong>{d.version}</strong></Typography></li>
                ))}
                {libs.devDeps.length === 0 && <Typography variant="body2" color="text.secondary">—</Typography>}
              </Box>
            </>
          ) : null}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            {tr('about_hint', 'La información técnica puede ayudar a diagnosticar problemas.')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ContentCopyIcon />} onClick={copyDiagnostics}>
              {tr('about_copy', 'Copiar diagnóstico')}
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={saveDiagnosticsFile}>
              {tr('about_save', 'Guardar diagnóstico')}
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </Box>
  );
}
