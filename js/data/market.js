// РЫНОК И ГУСТАВ — дословно из монолита «Вечный покой 5.4» (data-restore)

// цены рынка — из defaultState монолита (дрейфуют в newDay монолита, перенос на этапе day-cycle)
export const MARKET = { candle: 12, wax: 7, fertilizer: 10, ink: 14, skull: 30, flesh: 4, marble: 35, brain: 20 };

// sellPrice() из монолита дословно (S передаётся явно)
export function sellPrice(s, it) {
  let p = s.market[it] || 0;
  if (s.techs.trade) p *= 1.15;
  if (it === 'candle' && s.techs.candlemaster) p += 3;
  return p;
}

// ассортимент Густава — дословно (buys); мрамор зависит от технологии
export function buys(s) {
  return [['thread', 3, 'Рулон нити'], ['stone', 8, 'Камень'], ['marble', s.techs.marble ? 22 : 25, 'Мрамор'],
          ['water', 2, 'Вода'], ['coffee', 10, 'Кофе'], ['seeds', 5, 'Семена'], ['fat', 6, 'Жир про запас']];
}

import { S, spend, addRes, fmt, log } from '../core/state.js';
import { ITEMS } from './items.js';
import { TECHS } from './techs.js';
import { toast, sfx } from '../ui/dialog.js';
import { checkAch } from './achievements.js';

// sellItem() из монолита дословно (render() и floatTxt() убраны — их делает оболочка)
export function sellItem(it, n) {
  n = n || 1;
  if (!spend(it, n)) return false;
  const p = sellPrice(S, it) * n;
  S.coins += p;
  if (it === 'candle') S.stats.candlesSold += n;
  sfx('coin');
  toast('Продано: ' + ITEMS[it].n + ' ×' + n + ' за ' + fmt(p) + '💰');
  checkAch(S);
  return true;
}

// sellGustav() из монолита дословно — скупка по 0.8 рыночной цены
export function sellGustav(it) {
  if (!spend(it, 1)) return false;
  const p = Math.round(sellPrice(S, it) * .8);
  S.coins += p;
  if (it === 'candle') S.stats.candlesSold++;
  sfx('coin');
  toast('+' + p + '💰');
  return true;
}

// buyRes() из монолита дословно, с фиксом бага монолита (см. шапку)
export function buyRes(it, p) {
  if (S.coins < p) { toast('Не хватает монет'); sfx('error'); return false; }
  S.coins -= p;
  addRes(it, 1);
  sfx('coin');
  toast('Куплено: ' + ITEMS[it].n);
  return true;
}

// learn(id) из монолита дословно — по стандарту 6.0: UI-вызовы в возвращаемом объекте
// (конвенция donate/preach), checkAch в data-слое (как в sellItem). Причуда-баг 5.4
// (needCheck([['science',cost]]) звал have('science') при науке в S.science — кнопки были
// вечно задизейблены) исправлена: честная проверка S.science здесь и в needs.js.
export function learn(id) {
  const t = TECHS.find((x) => x.id === id);
  if (!t) return { ok: false };
  if (S.techs[id]) return { ok: false, silent: true };
  if (S.science < t.cost) return { ok: false, toast: 'Не хватает науки: \u{1F4DC} ' + t.cost + '/' + S.science };
  S.science -= t.cost;
  S.techs[id] = true;
  if (id === 'rituals') S.maxEnergy += 10;
  checkAch(S);
  return {
    ok: true,
    toast: '\u{1F4DA} Технология: ' + t.n,
    sfx: 'ach',
    log: 'Изучена технология: \u00AB' + t.n + '\u00BB. ' + t.f,
  };
}
