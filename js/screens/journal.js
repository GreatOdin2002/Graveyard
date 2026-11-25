import { S, have } from '../core/state.js';
import { ACH } from '../data/achievements.js';
import { ITEMS, SELLABLE } from '../data/items.js';
import { sellPrice } from '../data/market.js';
import { needCheck } from '../data/needs.js';

function ubtn(k, label, cls, action) {
  const c = needCheck([[k, 1]]);
  const dis = c.ok ? '' : 'disabled';
  return '<button class="btn ' + (cls || '') + '" ' + dis + ' data-action="' + action + '" data-arg="' + k + '">' + label + '</button>' + (c.ok ? '' : '<div class="why">' + c.w + '</div>');
}
export function initAch() {
  let h = '<h2>Достижения</h2><p class="sub">Мелкие радости большой смотрительской карьеры.</p><div class="grid">';
  h += ACH.map((a) => {
    const ok = S.ach[a.id];
    return '<div class="card' + (ok ? ' tech-done' : '') + '"><h4>' + (ok ? '🏆 ' : '🔒 ') + a.n + '</h4><p class="meta">' + a.d + '</p></div>';
  }).join('');
  return h + '</div>';
}

export function initLog() {
  let h = '<h2>Журнал смотрителя</h2><p class="sub">Дядюшкина тетрадь в кляксах. Ты продолжаешь писать поверх — как и положено наследнику.</p>';
  h += S.log.map((l) => '<div class="card" style="margin-bottom:8px"><h4 style="font-size:13px;color:var(--dim)">День ' + l.day + '</h4><p class="meta" style="font-size:13px">' + l.text + '</p></div>').join('');
  return h;
}

export function initInv() {
  let h = '<h2>🎒 Сумка</h2><p class="sub">Всё, что нажито непосильным трудом смотрителя. Сундуки под домом не тянут, но помнить надо.</p>';
  const keys = Object.keys(ITEMS).filter((k) => ['coins', 'energy', 'rep', 'science'].indexOf(k) < 0 && have(k) > 0);
  if (!keys.length) {
    h += '<p class="flavor">Пусто. Даже паутина ушла куда-то. Копни землю на кладбище — сумка наполнится быстро.</p>';
    return h;
  }
  h += '<div class="grid">' + keys.map((k) => {
    const it = ITEMS[k];
    let act = '';
    if (k === 'coffee' || k === 'elixir') act = ubtn(k, 'Выпить', 'gold', 'use-item');
    else if (k === 'brain') act = ubtn(k, 'Изучить (4⚡ → 3📜)', '', 'craft');
    if (SELLABLE.indexOf(k) >= 0) act += (act ? ' ' : '') + '<button class="btn" data-action="sell" data-item="' + k + '">Продать на рынке (' + sellPrice(S, k).toFixed(1) + '💰)</button>';
    else if (!act) act = '<p class="meta">На рынке не котируется — пригодится в ремесле или у Густава.</p>';
    return '<div class="card"><h4>' + it.i + ' ' + it.n + ' ×' + have(k) + '</h4><p class="meta">' + it.d + '</p><div class="row">' + act + '</div></div>';
  }).join('') + '</div>';
  return h;
}
