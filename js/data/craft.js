// КРАФТ — дословно из монолита «Вечный покой 5.4» (data-restore)
// Стандарт 6.0: UI-вызовы — в возвращаемых объектах; причуда 5.4 сохранена:
// энергия тратится ПЕРВОЙ, до проверки ресурсов (отказ по ресурсам — молчаливый).
import { S, spendE, spend, addRes } from '../core/state.js';

export function makeWax() {
  if (!spendE(3)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('fat', 2)) return { ok: false };
  addRes('wax', 1); S.stats.waxMade++;
  return { ok: true, toast: 'Воск готов. Печь доволен.' };
}

export function makeWaxGustav() {
  if (!spendE(3)) return { ok: false, toast: 'Слишком мало энергии' };
  // стандарт 6.0: монеты живут в S.coins — spend('coins') не работает
  if (S.coins < 4) return { ok: false, toast: 'Не хватает монет' };
  if (!spend('fat', 2)) return { ok: false };
  S.coins -= 4;
  addRes('wax', 1);
  return { ok: true, toast: 'Густав: «Воск как слеза». Справились.' };
}

export function makeCandle() {
  if (!spendE(3)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('wax', 1)) return { ok: false };
  if (!spend('thread', 1)) return { ok: false };
  addRes('candle', 1); S.stats.candlesMade++;
  return { ok: true, toast: 'Свеча ровная и честная. Таких в деревне уважают.', sfx: 'coin' };
}

export function makeFlour() {
  if (!spendE(2)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('bones', 2)) return { ok: false };
  addRes('flour', 1);
  return { ok: true, toast: 'Костная мука готова.' };
}

export function makeFert() {
  if (!spendE(2)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('flour', 2)) return { ok: false };
  if (!spend('water', 1)) return { ok: false };
  addRes('fertilizer', 1);
  return { ok: true, toast: 'Удобрение готово. Клумба будет в восторге.' };
}

export function studyBrain() {
  if (!spendE(4)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('brain', 1)) return { ok: false };
  S.science += 3; S.stats.scienceTotal += 3;
  return { ok: true, toast: 'Мозг изучен: +3📜. Чужие мысли стали твоими.', sfx: 'ach' };
}

export function makeInk() {
  if (!spendE(2)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('blood', 1)) return { ok: false };
  if (!spend('water', 1)) return { ok: false };
  addRes('ink', 1);
  return { ok: true, toast: 'Чернила густые, как совесть при жизни.' };
}

export function makeElixir() {
  if (!spendE(3)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('flowers', 2)) return { ok: false };
  if (!spend('water', 2)) return { ok: false };
  addRes('elixir', 1);
  return { ok: true, toast: 'Эликсир готов. Цветы, вода и терпение — вот и вся магия.' };
}

export function makeBalsam() {
  if (!spendE(3)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('water', 2)) return { ok: false };
  if (!spend('flowers', 2)) return { ok: false };
  addRes('balsam', 1);
  return { ok: true, toast: 'Бальзам готов. Аромат — достойный последнего пути.' };
}

// useItem — дословно (кофе +10⚡, эликсир +25⚡ с кэпом от maxEnergy)
export function useItem(it) {
  if (it === 'coffee') {
    if (!spend('coffee', 1)) return { ok: false };
    S.energy = Math.min(S.maxEnergy, S.energy + 10);
    return { ok: true, fx: '+10⚡', toast: 'Приятно. Голова ясная, руки лёгкие.' };
  }
  if (it === 'elixir') {
    if (!spend('elixir', 1)) return { ok: false };
    S.energy = Math.min(S.maxEnergy, S.energy + 25);
    return { ok: true, fx: '+25⚡', toast: 'Приятно. Голова ясная, руки лёгкие.' };
  }
  return { ok: false };
}

// диспетчер крафта (стандарт 6.0): id кнопки -> функция
export function craftAction(id) {
  switch (id) {
    case 'wax': return makeWax();
    case 'wax-gustav': return makeWaxGustav();
    case 'candle': return makeCandle();
    case 'flour': return makeFlour();
    case 'fert': return makeFert();
    case 'brain': return studyBrain();
    case 'ink': return makeInk();
    case 'elixir': return makeElixir();
    case 'balsam': return makeBalsam();
  }
  return { ok: false };
}
