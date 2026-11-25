import { SCREENS, findScreen } from './router.js';
import { S } from '../core/state.js';
import { orderReady } from '../data/crow.js';
import { tutBanner } from '../data/tutorial.js';

export function renderTop() {
  const h = document.getElementById('top');
  if (!h) return;
  h.innerHTML = `
    <div class="top-bar">
      <span class="logo">Graveyard Keeper 6.0</span>
      <div class="stats">
        <span>День: ${S.day}</span>
        <span>Энергия: ${S.energy}/${S.maxEnergy}</span>
        <span>Монеты: ${S.coins}💰</span>
        <span>Репутация: ${S.rep}</span>
        ${S.rain ? '<span>🌧️ Дождь</span>' : ''}
      </div>
      <button data-action="toggle-sound">🔔</button>
        <button data-action="help">❔</button>
        <button data-action="reset">↺</button>
        <button data-action="new-day">🌙 Новый день</button>
    </div>`;
}

export function renderTabs() {
  const t = document.getElementById('tabs');
  if (!t) return;
  t.innerHTML = `<nav class="tab-nav">` +
    SCREENS.map(
      (s) =>
        `<a href="#" data-screen="${s.id}" class="${S.screen === s.id ? 'active' : ''}">${s.title}${s.id === 'crow' && S.crow.active && S.crow.order && orderReady() ? '<span class="badge ok">✓</span>' : ''}</a>`
    ).join('') +
    `</nav>`;
}

export function renderScreen(html) {
  const c = document.getElementById('content');
  if (!c) return;
  const meta = findScreen(S.screen);
  c.innerHTML = `<div class="screen"><h2>${meta.title}</h2>${tutBanner()}${html}</div>`;
}
