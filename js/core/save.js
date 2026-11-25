// СОХРАНЕНИЕ — ключ монолита, сырой формат (как в 5.4), миграция обоих форматов
import { S, defaultState } from './state.js';

const KEY = 'vp5_save';

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    return true;
  } catch (e) {
    return false;
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function wipe() {
  try { localStorage.removeItem(KEY); } catch (e) {}
}

// миграция: принимает и сырой сейв монолита (v:5), и старую обёртку {version, state}.
// Дозаливает задатки новых полей из defaultState, не трогая существующее.
export function migrate(data) {
  if (!data) return null;
  let s = data;
  if (data.state && typeof data.state === 'object' && data.state.day !== undefined) s = data.state;
  if (s.day === undefined) return null;
  const d = defaultState();
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  if (!s.graves || !s.graves.length) s.graves = d.graves;
  // глубокая дозаливка market/stats — старые сейвы не ломаются
  for (const k of ['market', 'stats']) {
    if (!s[k]) s[k] = d[k];
    else for (const kk of Object.keys(d[k])) if (s[k][kk] === undefined) s[k][kk] = d[k][kk];
  }
  return s;
}
