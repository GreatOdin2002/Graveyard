// ЦЕРКОВЬ — дословно из монолита «Вечный покой 5.4» (data-restore)
// Стандарт 6.0: UI-вызовы — в возвращаемых объектах; монеты живут в S.coins,
// монолитовский spend('coins',20) молча проваливался — честная проверка с тостом.
import { S, spendE } from '../core/state.js';

export function donate() {
  if (S.donatedToday >= 5) return { ok: false, toast: 'Отец Серапион мягко намекает, что и кладбище требует внимания.' };
  // стандарт 6.0: честная проверка монет (в 5.4 spend('coins') молча проваливался)
  if (S.coins < 20) return { ok: false, toast: 'Не хватает монет' };
  S.coins -= 20;
  S.donatedToday++;
  const r = S.techs.orator ? 2 : 1;
  S.rep += r;
  return { ok: true, toast: 'Пожертвование принято: +' + r + '⭐', sfx: 'coin' };
}

export function preach() {
  if (!spendE(5)) return { ok: false, toast: 'Слишком мало энергии' };
  S.science += 2;
  S.stats.scienceTotal += 2;
  return { ok: true, toast: 'Проповедь удалась: +2📜' };
}
