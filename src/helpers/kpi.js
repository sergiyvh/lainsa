// src/helpers/kpi.js

export function normalizeShift(raw) {
  if (!raw) return 'unknown';
  const s = String(raw).toLowerCase();
  if (s.includes('mañ') || s.includes('man') || s.includes('am')) return 'maniana';
  if (s.includes('tar') || s.includes('pm') || s.includes('eve')) return 'tarde';
  return s;
}

export function getISOWeekLabel(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function toNum(x, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

export function getRecordHours(rec, fallbackShiftHours = 8) {
  try {
    if (rec?.startTime && rec?.endTime) {
      const st = new Date(rec.startTime);
      const en = new Date(rec.endTime);
      const ms = en - st;
      if (Number.isFinite(ms) && ms > 0) return ms / 36e5;
    }
    if (rec?.durationHours) {
      const d = toNum(rec.durationHours, 0);
      if (d > 0) return d;
    }
  } catch (_) {}
  return toNum(fallbackShiftHours, 8);
}

export function getRecordWeight(rec) {
  if (rec && typeof rec === 'object') {
    if (rec.weight != null) return toNum(rec.weight, 0);
    if (rec.kg != null) return toNum(rec.kg, 0);
  }
  return 0;
}

export function getRecordDate(rec) {
  const raw = rec?.date || rec?.createdAt || rec?.day;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function buildKpiSeries(records, { period = 'day', startDate, endDate, fallbackShiftHours = 8 } = {}) {
  if (!Array.isArray(records)) return { rows: [], byLabelShift: new Map() };

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const agg = new Map(); // key = label__shift
  const labels = new Set();

  for (const rec of records) {
    const d = getRecordDate(rec);
    if (!d) continue;

    if (start && d < new Date(start)) continue;
    if (end && d > new Date(end)) continue;

    const label = period === 'week' ? getISOWeekLabel(d) : ymd(d);
    labels.add(label);

    const shift = normalizeShift(rec?.shift);
    const key = `${label}__${shift}`;
    const kg = getRecordWeight(rec);
    const hours = getRecordHours(rec, fallbackShiftHours);

    const prev = agg.get(key) || { kg: 0, hours: 0 };
    prev.kg += kg;
    prev.hours += Math.max(0, toNum(hours, 0));
    agg.set(key, prev);

    const totalKey = `${label}__total`;
    const prevT = agg.get(totalKey) || { kg: 0, hours: 0 };
    prevT.kg += kg;
    prevT.hours += Math.max(0, toNum(hours, 0));
    agg.set(totalKey, prevT);
  }

  const rows = [...labels].sort().map(label => {
    const man = agg.get(`${label}__maniana`) || { kg: 0, hours: 0 };
    const tar = agg.get(`${label}__tarde`)   || { kg: 0, hours: 0 };
    const tot = agg.get(`${label}__total`)   || { kg: 0, hours: 0 };

    const kgh_m = man.hours ? man.kg / man.hours : 0;
    const kgh_t = tar.hours ? tar.kg / tar.hours : 0;
    const kgh_x = tot.hours ? tot.kg / tot.hours : 0;

    return {
      label,
      kgh_maniana: Number(kgh_m.toFixed(2)),
      kgh_tarde: Number(kgh_t.toFixed(2)),
      kgh_total: Number(kgh_x.toFixed(2)),
      kg_total: Number(tot.kg.toFixed(1)),
      hours_total: Number(tot.hours.toFixed(2)),
    };
  });

  return { rows, byLabelShift: agg };
}
