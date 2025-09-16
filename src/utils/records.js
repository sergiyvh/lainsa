// src/utils/records.js
// УНІВЕРСАЛЬНІ УТИЛІТИ ДЛЯ ЗАПИСІВ І KPI
// --------------------------------------
// Мета: мати одну точку правди для будь-яких сторінок (Archive, ViewRecord, Reports, Analytics)
// щодо обчислення кг/год, фільтрації, агрегацій та нормалізації різних “сирих” форматів записів.
//
// Нічого не зберігає в БД — працює тільки з масивами в пам’яті.
//
// Використання:
//   import {
//     normalizeRecord, normalizeRecords,
//     computeHours, computeKPI,
//     filterRecords, aggregateSummary,
//     aggregateByDay, aggregateByShiftByDay,
//     ymd, operatorsFromRecord
//   } from '../utils/records';
//
// Приклад:
//   const normalized = normalizeRecords(await getData('lainsa_records') || []);
//   const forPeriod = filterRecords(normalized, { from, to, shift:'mañana', operator:'Dani' });
//   const summary = aggregateSummary(forPeriod);
//   const byDay = aggregateByDay(forPeriod);
//   const byShift = aggregateByShiftByDay(forPeriod);

/////////////////////////////
// Загальні допоміжні
/////////////////////////////

function isNil(v) { return v === undefined || v === null; }

function parseNumber(any, def = 0) {
  if (typeof any === 'number' && Number.isFinite(any)) return any;
  if (typeof any === 'string') {
    const s = any.replace(',', '.').trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : def;
  }
  return def;
}

function toISO(d) {
  // Повертає локальний час у вигляді ISO (без обрізання до UTC)
  if (!(d instanceof Date)) return null;
  if (Number.isNaN(d.getTime())) return null;
  // збережемо як YYYY-MM-DDTHH:mm:ss (без Z)
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function ymd(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function parseDateFlex(v) {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v !== 'string') return null;

  // спроба стандартного парсингу
  let d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d;

  // dd.MM.yyyy
  const mm = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (mm) {
    const dd = Number(mm[1]), MM = Number(mm[2]) - 1, yyyy = Number(mm[3]);
    const hh = Number(mm[4] || 0), mn = Number(mm[5] || 0), ss = Number(mm[6] || 0);
    d = new Date(yyyy, MM, dd, hh, mn, ss);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function normalizeShift(raw) {
  if (!raw && raw !== 0) return '';
  const s = String(raw).toLowerCase().trim();
  // іспанська/укр/варіанти
  if (s.includes('mañ') || s.includes('man') || s.includes('am') || s.includes('ран')) return 'mañana';
  if (s.includes('vesp') || s.includes('tard') || s.includes('pm') || s.includes('веч')) return 'tarde';
  if (s.includes('noc') || s.includes('night') || s.includes('ніч')) return 'noche';
  return s; // залишаємо як є, якщо інше
}

export function operatorsFromRecord(rec) {
  // Повертає масив імен/ID операторів
  if (Array.isArray(rec?.operators)) {
    return rec.operators.map(x => String(x).trim()).filter(Boolean);
  }
  if (!isNil(rec?.operator)) return [String(rec.operator).trim()].filter(Boolean);
  if (!isNil(rec?.user)) return [String(rec.user).trim()].filter(Boolean);
  if (typeof rec?.operatorsStr === 'string') {
    return rec.operatorsStr.split(',').map(s => s.trim()).filter(Boolean);
  }
  // іноді зберігається в "Operadores": "Leo, Elkin"
  if (typeof rec?.Operadores === 'string') {
    return rec.Operadores.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function parseProgramCode(raw) {
  if (isNil(raw)) return '';
  if (typeof raw === 'object') {
    if (!isNil(raw.code)) return String(raw.code);
    if (!isNil(raw.id)) return String(raw.id);
    if (!isNil(raw.name)) return String(raw.name);
  }
  const s = String(raw);
  // "21 - MANTELERÍA (CALIENTE)" -> "21"
  const mm = s.match(/^(\d+)\b/);
  return mm ? mm[1] : s;
}

function parseMachineId(rec) {
  const v = rec?.machineId ?? rec?.machine_id ?? rec?.machine ?? rec?.machineName ?? rec?.maquina;
  if (isNil(v)) return '';
  return String(v);
}

function computeHours(rec) {
  // години або з durationHours, або з start/end
  const dur = parseNumber(rec?.durationHours, NaN);
  if (Number.isFinite(dur) && dur > 0) return dur;

  const st = parseDateFlex(rec?.startTime);
  const en = parseDateFlex(rec?.endTime);
  if (st && en) {
    const ms = en - st;
    if (Number.isFinite(ms) && ms > 0) return ms / 36e5;
  }
  return 0;
}

function createId(rec) {
  // Стабільний id якщо відсутній: date|client|program|machine|random
  const base = [
    ymd(parseDateFlex(rec?.date || rec?.createdAt || rec?.day) || new Date()),
    String(rec?.client ?? rec?.clientName ?? ''),
    parseProgramCode(rec?.program ?? rec?.programCode ?? rec?.programName ?? ''),
    parseMachineId(rec)
  ].join('|');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}|${rand}`;
}

/////////////////////////////
// Нормалізація запису
/////////////////////////////

export function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const date =
    parseDateFlex(raw.date) ||
    parseDateFlex(raw.createdAt) ||
    parseDateFlex(raw.day) ||
    null;

  const isoDate = date ? toISO(date) : null;

  const producedKg = !isNil(raw.producedKg) ? parseNumber(raw.producedKg) :
                     !isNil(raw.weight)     ? parseNumber(raw.weight) :
                     !isNil(raw.kg)         ? parseNumber(raw.kg) : 0;

  const rejectKg   = !isNil(raw.rejectKg)   ? parseNumber(raw.rejectKg) :
                     !isNil(raw.rechazo)    ? parseNumber(raw.rechazo) : 0;

  const cycles     = !isNil(raw.cycles)     ? parseNumber(raw.cycles) :
                     !isNil(raw.ciclos)     ? parseNumber(raw.ciclos) : 0;

  const hours = computeHours(raw);

  const rec = {
    version: 2,
    id: String(raw.id ?? raw._id ?? raw.uid ?? raw.recordId ?? createId(raw)),
    date: isoDate || toISO(new Date()),
    shift: normalizeShift(raw.shift),
    operators: operatorsFromRecord(raw),
    client: String(raw.client ?? raw.clientName ?? raw.cliente ?? '').trim(),
    programCode: parseProgramCode(raw.programCode ?? raw.program ?? raw.programName),
    machineId: parseMachineId(raw),
    producedKg,
    rejectKg,
    cycles,
    durationHours: hours,
    notes: String(raw.notes ?? raw.observaciones ?? '').trim(),
    createdBy: String(raw.createdBy ?? raw.user ?? raw.operator ?? '').trim(),
    createdAt: toISO(parseDateFlex(raw.createdAt) || date || new Date()),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    // залишаємо сирі поля на випадок сумісності:
    _raw: raw,
  };

  return rec;
}

export function normalizeRecords(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(normalizeRecord)
    .filter(Boolean);
}

/////////////////////////////
// KPI для одного запису
/////////////////////////////

export function computeKPI(rec) {
  const kg = parseNumber(rec?.producedKg || 0);
  const hrs = parseNumber(rec?.durationHours || 0);
  const kgh = hrs > 0 ? kg / hrs : 0;
  return {
    kg: Number(kg.toFixed(2)),
    hours: Number(hrs.toFixed(2)),
    kgh: Number(kgh.toFixed(2)),
    cycles: parseNumber(rec?.cycles || 0),
    rejectKg: parseNumber(rec?.rejectKg || 0),
  };
}

/////////////////////////////
// Фільтрація / Сортування
/////////////////////////////

export function filterRecords(records, {
  from, to, // Date | string
  shift,    // 'mañana' | 'tarde' | 'noche'
  operator, // string (contains)
  client,   // string (contains)
  program,  // string (equals or contains)
  machine,  // string (equals or contains)
} = {}) {
  const f = parseDateFlex(from);
  const t = parseDateFlex(to);
  const shiftNorm = shift ? normalizeShift(shift) : '';

  return (records || []).filter(r => {
    if (!r) return false;

    // date range
    if (f || t) {
      const d = parseDateFlex(r.date);
      if (!d) return false;
      if (f && d < new Date(f.setHours(0,0,0,0))) return false;
      if (t && d > new Date(new Date(t).setHours(23,59,59,999))) return false;
    }

    if (shiftNorm && normalizeShift(r.shift) !== shiftNorm) return false;

    if (operator) {
      const op = String(operator).toLowerCase();
      const list = operatorsFromRecord(r).map(x => x.toLowerCase());
      if (!list.some(x => x.includes(op))) return false;
    }

    if (client) {
      const cl = String(client).toLowerCase();
      if (!String(r.client || '').toLowerCase().includes(cl)) return false;
    }

    if (program) {
      const p = String(program).toLowerCase();
      const code = String(r.programCode || '').toLowerCase();
      if (!(code === p || code.includes(p))) return false;
    }

    if (machine) {
      const m = String(machine).toLowerCase();
      const mid = String(r.machineId || '').toLowerCase();
      if (!(mid === m || mid.includes(m))) return false;
    }

    return true;
  });
}

export function sortRecords(records, key = 'date', dir = 'desc') {
  const arr = [...(records || [])];
  arr.sort((a, b) => {
    if (key === 'date') {
      const da = parseDateFlex(a?.date), db = parseDateFlex(b?.date);
      const va = da ? da.getTime() : 0;
      const vb = db ? db.getTime() : 0;
      return dir === 'asc' ? (va - vb) : (vb - va);
    }
    const va = (a?.[key] ?? '').toString();
    const vb = (b?.[key] ?? '').toString();
    if (dir === 'asc') return va.localeCompare(vb);
    return vb.localeCompare(va);
  });
  return arr;
}

/////////////////////////////
// Агрегації
/////////////////////////////

export function aggregateSummary(records) {
  // Підсумок по масиву нормалізованих записів
  let kg = 0, hrs = 0, cycles = 0, reject = 0;
  for (const r of records || []) {
    const k = computeKPI(r);
    kg += k.kg;
    hrs += k.hours;
    cycles += k.cycles;
    reject += k.rejectKg;
  }
  const kgh = hrs > 0 ? kg / hrs : 0;
  return {
    kg: Number(kg.toFixed(2)),
    hours: Number(hrs.toFixed(2)),
    kgh: Number(kgh.toFixed(2)),
    cycles: Number(cycles),
    rejectKg: Number(reject.toFixed(2)),
    count: (records || []).length,
  };
}

export function aggregateByDay(records) {
  // [{ day: 'YYYY-MM-DD', kg, hours, kgh, cycles, rejectKg }]
  const map = new Map();
  for (const r of records || []) {
    const d = ymd(parseDateFlex(r.date));
    if (!d) continue;
    const curr = map.get(d) || { kg: 0, hours: 0, cycles: 0, rejectKg: 0 };
    const k = computeKPI(r);
    curr.kg += k.kg;
    curr.hours += k.hours;
    curr.cycles += k.cycles;
    curr.rejectKg += k.rejectKg;
    map.set(d, curr);
  }
  const out = [...map.entries()].map(([day, v]) => ({
    day,
    kg: Number(v.kg.toFixed(2)),
    hours: Number(v.hours.toFixed(2)),
    kgh: Number((v.hours ? v.kg / v.hours : 0).toFixed(2)),
    cycles: v.cycles,
    rejectKg: Number(v.rejectKg.toFixed(2)),
  }));
  out.sort((a, b) => a.day.localeCompare(b.day));
  return out;
}

export function aggregateByShiftByDay(records) {
  // [{ day, kgh_mañana, kgh_tarde, kgh_total, kg_mañana, kg_tarde, hours_mañana, hours_tarde }]
  const map = new Map();
  for (const r of records || []) {
    const day = ymd(parseDateFlex(r.date));
    if (!day) continue;
    const sh = normalizeShift(r.shift) || 'desconocido';
    const k = computeKPI(r);
    const key = `${day}__${sh}`;

    const currDay = map.get(day) || {
      kg_mañana: 0, hours_mañana: 0,
      kg_tarde: 0, hours_tarde: 0,
      kg_noche: 0, hours_noche: 0,
      kg_total: 0, hours_total: 0,
    };

    if (sh === 'mañana') { currDay.kg_mañana += k.kg; currDay.hours_mañana += k.hours; }
    else if (sh === 'tarde') { currDay.kg_tarde += k.kg; currDay.hours_tarde += k.hours; }
    else if (sh === 'noche') { currDay.kg_noche += k.kg; currDay.hours_noche += k.hours; }
    currDay.kg_total += k.kg; currDay.hours_total += k.hours;

    map.set(day, currDay);
  }

  const out = [...map.entries()].map(([day, v]) => ({
    day,
    kgh_mañana: Number((v.hours_mañana ? v.kg_mañana / v.hours_mañana : 0).toFixed(2)),
    kgh_tarde: Number((v.hours_tarde ? v.kg_tarde / v.hours_tarde : 0).toFixed(2)),
    kgh_noche: Number((v.hours_noche ? v.kg_noche / v.hours_noche : 0).toFixed(2)),
    kgh_total: Number((v.hours_total ? v.kg_total / v.hours_total : 0).toFixed(2)),
    kg_mañana: Number(v.kg_mañana.toFixed(2)),
    kg_tarde: Number(v.kg_tarde.toFixed(2)),
    kg_noche: Number(v.kg_noche.toFixed(2)),
    hours_mañana: Number(v.hours_mañana.toFixed(2)),
    hours_tarde: Number(v.hours_tarde.toFixed(2)),
    hours_noche: Number(v.hours_noche.toFixed(2)),
  }));
  out.sort((a, b) => a.day.localeCompare(b.day));
  return out;
}

export function aggregateByField(records, field /* 'client' | 'machineId' | 'programCode' | 'createdBy' | ... */) {
  // Повертає масив { key, kg, hours, kgh, cycles, rejectKg, count }
  const map = new Map();
  for (const r of records || []) {
    const key = String(r?.[field] ?? '').trim();
    const val = map.get(key) || { kg: 0, hours: 0, cycles: 0, rejectKg: 0, count: 0 };
    const k = computeKPI(r);
    val.kg += k.kg; val.hours += k.hours; val.cycles += k.cycles; val.rejectKg += k.rejectKg; val.count += 1;
    map.set(key, val);
  }
  const out = [...map.entries()].map(([key, v]) => ({
    key,
    kg: Number(v.kg.toFixed(2)),
    hours: Number(v.hours.toFixed(2)),
    kgh: Number((v.hours ? v.kg / v.hours : 0).toFixed(2)),
    cycles: v.cycles,
    rejectKg: Number(v.rejectKg.toFixed(2)),
    count: v.count,
  }));
  out.sort((a, b) => b.kg - a.kg); // за замовчуванням — за кг
  return out;
}

/////////////////////////////
// Експорт корисних дрібниць
/////////////////////////////

export function sumReducer(list, pick = (x)=>x) {
  return (list || []).reduce((acc, it) => acc + (parseNumber(pick(it)) || 0), 0);
}

// Для зручності зовнішніх модулів
export default {
  normalizeRecord,
  normalizeRecords,
  computeHours,
  computeKPI,
  filterRecords,
  sortRecords,
  aggregateSummary,
  aggregateByDay,
  aggregateByShiftByDay,
  aggregateByField,
  operatorsFromRecord,
  ymd,
  sumReducer,
};
