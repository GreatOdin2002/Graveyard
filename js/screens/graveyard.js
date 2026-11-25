import { S } from '../core/state.js';
import { digCost } from '../data/places.js';

// экраны группы graveyard: graveyard, forest, garden
export function initGraveyard() {
  const cleared = S.gravesOpened || 0;
  const clearBtn = cleared >= 20
    ? '<p>Простор достигнут: все 20 участков уже расчистены.</p>'
    : '<button data-action="buy-grave">Расчистить участок (30💰)</button>';
  return `<p>День ${S.day}. Участков расчищено: ${cleared}/20.</p>
    <button data-action="dig">Копать (${digCost()}\u26A1)</button>
    ${clearBtn}`;
}
export function initForest() {
  return `<p>Лес — источник дерева. Заглушка.</p>`;
}
export function initGarden() {
  if (!S.plant.owned) {
    return `<p>За оградой — пустырь. Земля там мягкая, тёплая.</p>
      <button data-action="buy-bed">Обустроить клумбу (30💰)</button>`;
  }
  if (!S.plant.planted) {
    return `<p>Грядка пуста. Созреют к дню ${S.day + 1}.</p>
      <button data-action="plant-seed">Посеять (1🌾, 3⚡)</button>
      <button data-action="fert-bed">Удобрить (1🌱)</button>`;
  }
  if (S.plant.readyDay > S.day) {
    return `<p>Созреют к дню ${S.plant.readyDay}.${S.plant.fert ? ' Клумба удобрена.' : ''}</p>
      <button data-action="fert-bed" ${S.plant.fert ? 'disabled' : ''}>Удобрить (1🌱)</button>`;
  }
  return `<p>Цветы созрели!${S.plant.fert ? ' Клумба удобрена — урожай щедрый.' : ''}</p>
    <button data-action="harvest">Собрать цветы</button>`;
}
