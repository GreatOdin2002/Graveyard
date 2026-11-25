// КОПКА И УЧАСТКИ — дословно из монолита «Вечный покой 5.4» (data-restore)
import { rng } from '../core/rng.js';
import { S, addRes } from '../core/state.js';

// монолит: Math.ceil((S.techs.ergo?6:8)*(S.rain?1.5:1))
export function digCost(s = S) {
  return Math.ceil((s.techs.ergo ? 6 : 8) * (s.rain ? 1.5 : 1));
}

// dig() из монолита дословно: ходы рандома — через наш rng, UI-вызовы вынесены наружу.
// Возвращает {msg, cost, sfx} или null, если не хватило энергии.
export function dig() {
  const cost = digCost();
  if (S.energy < cost) return null;
  S.energy -= cost;
  const roll = rng.next();
  let msg = '';
  let sfxKind = 'dig';
  if (roll < .45) { const n = 1 + Math.floor(rng.next() * 2); addRes('bones', n); msg = 'Лопата звякнула: кости, аккуратно уложенные кем-то давно. ×' + n; }
  else if (roll < .70) { addRes('stone', 1); msg = 'В пласте глины — камень. Тяжёлый, честный, надёжный.'; }
  else if (roll < .88) { addRes('fat', 1); msg = 'Грунт отдаёт тёмный жир. Не будем уточнять чей — осень, что взять.'; }
  else if (roll < .92) { S.coins += 3; msg = 'Оловянная ложка с погнутой пуговицей. Густав берёт такой лом по три монеты — не спрашивай, зачем ему столько ложек.'; sfxKind = 'coin'; }
  else { S.coins += 2; msg = 'Найдена горстка старых монет. Дядюшка прятал по карманам всей округи.'; sfxKind = 'coin'; }
  return { msg, cost, sfx: sfxKind };
}

// buyGrave() из монолита дословно: расчистка участка за 30 монет.
// Отличие от 5.4: там spend('coins',30) молча проваливался (монеты не в S.res) —
// здесь честная проверка S.coins (стандарт 6.0). Формулировки — дословно.
export function buyGrave() {
  if (S.gravesOpened >= 20) {
    return { ok: false, toast: 'Простор достигнут: все 20 участков уже расчистены.' };
  }
  if (S.coins < 30) return { ok: false, toast: 'Не хватает монет' };
  S.coins -= 30;
  S.gravesOpened++;
  return {
    ok: true,
    log: 'Расчищен новый участок №' + S.gravesOpened + '. Земля впервые за годы встрепенулась.',
    toast: 'Новый участок расчищен!',
    sfx: 'dig',
  };
}

// buyBed() из монолита дословно: клумба за 30 монет.
export function buyBed() {
  if (S.coins < 30) return { ok: false, toast: 'Не хватает монет' };
  S.coins -= 30;
  S.plant.owned = true;
  return {
    ok: true,
    log: 'Обустроена клумба за оградой. Земля там мягкая, тёплая.',
    toast: 'Клумба готова к посеву!',
    sfx: 'dig',
  };
}
