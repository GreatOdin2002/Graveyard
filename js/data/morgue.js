// МОРГ, ВСКРЫТИЕ, ПОХОРОНЫ — дословно из монолита «Вечный покой 5.4»
// window._bs/_bdraw/_bi/_bn заменены модульными переменными, Math.random -> rng,
// UI-вызовы вынесены в возвращаемые объекты (стандарт 6.0).
import { S, have, spend, spendE, addRes } from '../core/state.js';
import { checkAch } from './achievements.js';
import { GRAVE_NAMES, BURIAL_LINES } from './texts.js';
import { rng } from '../core/rng.js';

let bs = null;   // состояние декора похорон (монолит: window._bs)
let bi = -1;     // индекс участка (монолит: window._bi)
let bname = '';  // имя покойного (монолит: window._bn)

// extract() из монолита дословно. Причуда 5.4 сохранена: энергия тратится
// ДО проверки части, так что повторная процедура по той же части «сжигает» энергию.
export function extract(i, res) {
  const c = S.corpses[i];
  if (!c) return { ok: false, toast: 'Нет такого тела.' };
  if (!spendE(S.techs.gentle ? 1 : 2)) return { ok: false, toast: 'Слишком мало энергии' };
  if (res === 'skull') { if (!c.parts.skull) return { ok: true, silent: true }; addRes('skull', 1); c.parts.skull = false; }
  else if (res === 'brain') { if (!c.parts.brain) return { ok: true, silent: true }; addRes('brain', 1); c.parts.brain = false; }
  else if (res === 'blood') { if (!c.parts.blood) return { ok: true, silent: true }; addRes('blood', 1); c.parts.blood = false; }
  else if (res === 'fat') { if (!c.parts.fat) return { ok: true, silent: true }; addRes('fat', 1); c.parts.fat = false; }
  else if (res === 'bones') { if (!c.parts.bones) return { ok: true, silent: true }; addRes('bones', 2); c.parts.bones = false; }
  else if (res === 'flesh') { if (!c.parts.flesh) return { ok: true, silent: true }; addRes('flesh', 1); c.parts.flesh = false; }
  c.extracted = (c.extracted || 0) + 1;
  S.stats.extracted++;
  return { ok: true, toast: 'Процедура завершена: +1 к качеству похорон.' };
}

// openBurial() из монолита дословно (модалку рисует main.js).
// Как в 5.4: занятый участок — молчаливый отказ.
export function openBurial(i) {
  const g = S.graves[i];
  if (g.occ) return { ok: false };
  const c = S.corpses[0];
  if (!c) return { ok: false, toast: 'В морге нет тел — похоронить нечего. Ждём ночную повозку.' };
  bname = GRAVE_NAMES[(S.day * 7 + i * 3) % GRAVE_NAMES.length];
  bs = { candle: 0, flowers: 0, balsam: 0 };
  bi = i;
  return { ok: true };
}

export function burialState() { return { bs, bi, bname }; }

// bInc/bDec/bTog из монолита дословно (window._bs -> bs, window._bdraw рисует main.js)
export function bInc(k) {
  if (k === 'candle') { if (have('candle') > bs.candle) bs.candle++; }
}
export function bDec(k) {
  if (k === 'candle' && bs.candle > 0) bs.candle--;
}
export function bTog(k) {
  bs[k] = bs[k] ? 0 : 1;
}

// doBurial() из монолита дословно. Отличие от 5.4: монеты проверяет сама кнопка
// spend('coins',...) в 5.4 — молча проваливался; здесь декор списывается честно.
export function doBurial(i) {
  const c = S.corpses[0];
  if (bs.candle > have('candle') || bs.flowers > have('flowers') / 2 || bs.balsam > have('balsam')) {
    return { ok: false, error: 'Не хватает декора. Проверь счётчики.' };
  }
  spend('candle', bs.candle);
  if (bs.flowers) spend('flowers', 2);
  if (bs.balsam) spend('balsam', 1);
  const q = c.stars + (c.extracted || 0) + S.graves[i].level + bs.candle * 2 + (bs.flowers ? 2 : 0) + bs.balsam * 3;
  S.graves[i].occ = bname;
  S.graves[i].deco = { candle: bs.candle, flowers: bs.flowers ? 1 : 0, balsam: bs.balsam };
  S.corpses.shift();
  S.coins += 15 + q * 2;
  S.rep += q;
  S.stats.buried++;
  const line = BURIAL_LINES[Math.floor(rng.next() * BURIAL_LINES.length)];
  const res = { ok: true, toast: '\u2709 ' + bname + ' упокоен. Репутация +' + q + ', монет +' + (15 + q * 2), log: 'Похороны ' + bname + ': качество ' + q + '. ' + line };
  bs = null; bi = -1; bname = '';
  checkAch(S);
  return res;
}

// embalm(i) — 6.0-надстройка (вариант А: переработка тел, стол бальзамирования).
// Цена: 2⚡ + вода 1 + жир 1 (жир — трейд-офф со свечной петлёй). +1★ телу,
// один раз на тело (флаг c.emb), кэп 5★ — проверяется ПЕРВЫМ (информативнее).
// Проверки до списания — причуда 5.4 (энергия до проверки) не копируется.
export function embalm(i) {
  const c = S.corpses[i];
  if (!c) return { ok: false, toast: 'Нет такого тела.' };
  if (!c.emb && c.stars >= 5) return { ok: false, toast: 'Безупречно — выше не бывает.' };
  if (c.emb) return { ok: false, silent: true };
  if (S.energy < 2) return { ok: false, toast: 'Слишком мало энергии' };
  if (have('water', 1) !== true) return { ok: false, toast: 'Не хватает: \u{1F4A7} 1/0' };
  if (have('fat', 1) !== true) return { ok: false, toast: 'Не хватает: \u{1F9D7} 1/0' };
  S.energy -= 2;
  spend('water', 1);
  spend('fat', 1);
  c.stars = Math.min(5, c.stars + 1);
  c.emb = true;
  S.stats.embalmed = (S.stats.embalmed || 0) + 1;
  checkAch(S);
  return { ok: true, toast: '\u{1F9F4} Бальзамирование завершено: тело теперь ' + '\u2605'.repeat(c.stars) + ' — качество похорон выше.' };
}
