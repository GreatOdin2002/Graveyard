// ВОРОН И ЗАКАЗЫ — дословно из монолита «Вечный покой 5.4» (data-restore).
// UI-вызовы вынесены в возвращаемые объекты (стандарт 6.0).
// Причуда 5.4 сохранена: doOrder при неполном заказе молча отказывает
// (в монолите кнопка зелёная без needCheck — отказ без тоста).
import { S, have, spend, log } from '../core/state.js';
import { checkAch } from './achievements.js';

export const CROW_ORDERS = [
{n:'Свечи для паломников',need:{candle:5},reward:{coins:40,science:3}},
{n:'Черепа для учёного',need:{skull:2},reward:{coins:60}},
{n:'Цветы для вдовы',need:{flowers:6},reward:{coins:20,rep:3}},
{n:'Чернила для нотариуса',need:{ink:3},reward:{coins:35,science:2}},
{n:'Удобрение для фермера',need:{fertilizer:4},reward:{coins:30}}];

export function orderReady() {
  const o = S.crow.order;
  if (!o) return false;
  return Object.keys(o.need).every(r => have(r) >= o.need[r]);
}

export function crowOrderText(o) { return o.n }

export function doOrder() {
  const o = S.crow.order;
  if (!o || !orderReady()) return { ok: false, silent: true };
  Object.keys(o.need).forEach(r => spend(r, o.need[r]));
  const rw = o.reward;
  if (rw.coins) S.coins += rw.coins;
  if (rw.science) { S.science += rw.science; S.stats.scienceTotal += rw.science; }
  if (rw.rep) S.rep += rw.rep;
  S.crow.order = null;
  S.crow.done++;
  log('Ворон получил своё: «' + o.n + '». Взгляд одобряющий.');
  checkAch(S);
  return { ok: true, toast: '🐦‍⬛ Заказ сдан: ' + o.n, sfx: 'ach' };
}
