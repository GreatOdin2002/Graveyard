# BUILD.md — «Вечный покой» 6.0 (технологии оживлены + бальзамирование)

Договорённость: этот файл — зеркальная копия кода проекта.
На старте сеанса прикладываются монолит «Вечный покой» и этот BUILD.md — этого достаточно для восстановления всего проекта.

> Состояние: всё как в предыдущей порции + изучение технологий восстановлено + бальзамирование (вариант А).
> Новое в этой порции:
> data/market.js — learn(id) из монолита дословно, по стандарту 6.0: UI-вызовы в возвращаемом объекте
> (конвенция donate/preach), checkAch в data-слое (как sellItem). Списание науки по S.science;
> rituals -> maxEnergy += 10; запись в журнал («Изучена технология: «…». <flavor>»). КРИТИЧЕСКИЙ ПРОБЕЛ
> 6.0 закрыт: раньше технологии негде было изучать (S.science копился, но не тратился ни разу,
> S.techs не присваивался нигде, learn() и кнопки экрана технологий потерялись при переносе).
> Причуда-баг 5.4 зафиксирована и исправлена: монолитная кнопка «Изучить (N📜)» была вечно задизейблена —
> needCheck([['science',cost]]) звал have('science'), а наука живёт в S.science (тот же класс бага,
> что донат-кнопка). Исправлено в needs.js (честная ветка science: проверка S.science, отображение
> «📜 N/M») и в initTechs: кнопки живые, отказ — честный «why».
> data/techs.js — запись embalm «Стол бальзамирования» (4📜) — 6.0-надстройка (вариант А).
> data/morgue.js — embalm(i): 2⚡ + вода 1 + жир 1 (жир — трейд-офф со свечной петлёй) -> +1★ телу,
> один раз на тело (флаг c.emb), кэп 5★ проверяется ПЕРВЫМ (тело на 5★ информативнее, чем молчаливый
> отказ по флагу). Проверки ДО списания — причуда 5.4 (энергия до проверки) не копируется, это новый код.
> S.stats.embalmed — защитно ((S.stats.embalmed||0)+1), миграция старых сейвов не нужна.
> screens/morgue.js — кнопка «🧴 Бальзамировать (+1★)» на карточке тела (needCheck + «why»),
> бейдж «✓ Бальзамировано»; кнопки не видно без технологии embalm.
> screens/market.js — initTechs перевёрстан в вёрстку tTechs монолита: карточки grid, flavor,
> живая кнопка «Изучить (N📜)» с needCheck и «why».
> main.js — кейсы learn (конвенция donate: toast/sfx из объекта, log в data-слое) и embalm
> (конвенция extract: silent-отказ без тоста).
> Проверки: синтакс 30/30; дымовой порции 19 — 27/27 OK (embalm в реестре за 4📜; learn: отказ без
> науки с честным тостом, списание ровно, одноразовость silent, rituals -> maxEnergy+10, дословный
> log; needCheck science честно; бальзамирование: без технологии нет, +1★ ровно один раз, кэп 5★
> проверяется первым (не silent), отказ по ресурсам ДО списания, ★ входит в формулу похорон
> (q=14 проверено дословно), старый сейв жив с защитным счётчиком; экраны: кнопка рендерится,
> дизейбл с why, бейдж «✓ Бальзамировано», живые кнопки «Изучить (N📜)» и «✓ Изучено»).
> Дальше по плану: склад (вариант B) — дизайн на утверждение.

## Graveyard/js/screens/journal.js
```
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
```

## Graveyard/css/style.css
```
:root {
  --bg: #1e1e1e;
  --panel: #2b2b2b;
  --text: #e0e0e0;
  --accent: #4caf50;
  --danger: #f44336;
}
body {
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  margin: 0;
  padding: 0;
}
#app { max-width: 960px; margin: 0 auto; padding: 1rem; }
.top-bar {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #444; padding-bottom: .5rem; margin-bottom: 1rem;
}
.stats span { margin-left: 1.2rem; font-size: .95rem; }
.tab-nav a { color: #aaa; text-decoration: none; margin-right: 1rem; cursor: pointer; }
.tab-nav a.active { color: var(--accent); font-weight: bold; }
.screen { background: var(--panel); padding: 1.5rem; border-radius: 4px; }
button {
  background: #3a3a3a; color: white; border: 1px solid #555;
  padding: .6rem 1rem; cursor: pointer; border-radius: 3px;
}
button:hover { background: #4a4a4a; }
.modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center; z-index: 50;
}
.modal {
  background: var(--panel); border: 1px solid #555; border-radius: 6px;
  padding: 1.2rem 1.4rem; max-width: 480px; width: 90%;
}
.modal h3 { margin: 0 0 .5rem; color: var(--accent); }
.modal .row { display: flex; gap: .6rem; margin-top: .8rem; }
.btn.gold { background: #6a5a1e; }

/* классы монолита — перенесены дословно */
:root{--bg:#141317;--panel:#201e26;--panel2:#2a2731;--gold:#c9a84c;--gold-dim:#8a7a4f;--text:#e8e2d5;--dim:#9a917f;--green:#7fae7a;--red:#c96a5a;--blue:#7a9ec9}
.card{background:var(--panel);border:1px solid #3d3946;border-radius:12px;padding:12px}
.card h4{font-size:15px;margin-bottom:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px}
.sub{color:var(--dim);font-size:13px;margin-bottom:14px;line-height:1.55;max-width:760px}
.card .meta{color:var(--dim);font-size:12px;line-height:1.5;margin-bottom:8px}
.why{color:var(--red);font-size:12px;margin-top:4px}
.tech-done{opacity:.55;border-color:var(--green)}
.trend{font-size:12px}
.flavor{color:var(--dim);font-style:italic;font-size:13px;line-height:1.55;margin:8px 0;max-width:760px}
.float{position:fixed;color:var(--gold);font-weight:bold;pointer-events:none;animation:fl 1.1s forwards;z-index:99;font-size:15px}
@keyframes fl{to{transform:translateY(-44px);opacity:0}}
.btn.green{background:#2a4a2a;border-color:#3a6a3a;color:var(--green)}


/* бейджи монолита — перенесены дословно */
.badge{background:var(--gold);color:#1a1a1f;border-radius:10px;font-size:11px;padding:0 6px;min-width:18px;text-align:center}
.badge.ok{background:var(--green)}

```

## Graveyard/index.html
```
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Graveyard Keeper 6.0 — основа</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#2b2b2b" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="app">
    <header id="top"></header>
    <nav id="tabs"></nav>
    <main id="content"></main>
  </div>
  <div id="modalRoot"></div>
  <script type="module" src="js/main.js"></script>
</body>
</html>

```

## Graveyard/js/core/bus.js
```
export const bus = {
  _l: {},
  on(event, cb) {
    (this._l[event] = this._l[event] || []).push(cb);
    return () => this.off(event, cb);
  },
  off(event, cb) {
    if (this._l[event]) {
      this._l[event] = this._l[event].filter((f) => f !== cb);
    }
  },
  emit(event, payload) {
    if (!this._l[event]) return;
    for (const cb of this._l[event]) {
      try { cb(payload); } catch (e) { console.error('[bus]', event, e); }
    }
  },
};

```

## Graveyard/js/core/rng.js
```
export const rng = {
  seed: 1,
  _next: null,
  mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  init(seed) {
    this.seed = seed >>> 0;
    this._next = this.mulberry32(this.seed);
  },
  next() {
    if (!this._next) this.init(this.seed);
    return this._next();
  },
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  },
  pick(arr) {
    if (!arr.length) return undefined;
    return arr[this.int(0, arr.length - 1)];
  },
  // выбор по весам: [{ v: значение, w: вес }]
  one(arr) {
    const r = this.next();
    const sum = arr.reduce((s, x) => s + x.w, 0);
    let acc = 0;
    for (const x of arr) {
      acc += x.w / sum;
      if (r <= acc) return x.v;
    }
    return arr[arr.length - 1].v;
  },
};

```

## Graveyard/js/core/save.js
```
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

```

## Graveyard/js/core/state.js
```
// СОСТОЯНИЕ — defaultState дословно из монолита «Вечный покой 5.4» (data-restore)
export function defaultState() {
  {return{v:5,sound:true,day:1,coins:40,energy:40,maxEnergy:40,rep:0,science:0,res:{fat:2,thread:2,seeds:2},gravesOpened:6,graves:Array.from({length:20},()=>({level:1,occ:null,deco:{}})),corpses:[],market:{candle:12,wax:7,fertilizer:10,ink:14,skull:30,flesh:4,marble:35,brain:20},techs:{},ach:{},crow:{active:false,order:null,done:0},plant:{owned:false,planted:false,readyDay:0,fert:false},donatedToday:0,tut:{on:true},rain:false,log:[],stats:{buried:0,candlesSold:0,scienceTotal:0,flowers:0,vagrantFed:false,digs:0,extracted:0,waxMade:0,candlesMade:0,sales:0},endless:false}}
}

export let S = defaultState();

export function adopt(newState) {
  if (!newState) return S;
  // сохраняем ссылку на общий объект: мутации видны всем импортёрам
  Object.keys(S).forEach((k) => delete S[k]);
  Object.assign(S, newState);
  return S;
}
export function get() { return S; }

// хелперы — семантика монолита дословно (spend не удаляет нулевые остатки, как в 5.4)
// семантика монолита 5.4: have(res) возвращает КОЛИЧЕСТВО; с числом n — булево (>= n)
// (0 — falsy, так что старые проверки if (have(...)) работают как раньше)
export function have(item, n) { const c = S.res[item] || 0; return n === undefined ? c : c >= n; }
export function addRes(item, n = 1) { S.res[item] = (S.res[item] || 0) + n; }
export function spend(item, n) { if (have(item, n)) { S.res[item] -= n; return true; } return false; }
export function spendE(n) { if (S.energy < n) return false; S.energy -= n; return true; }

export function fmt(n) { return Number(n).toLocaleString('ru-RU'); }
export function log(msg) { S.log.unshift({ day: S.day, text: msg }); if (S.log.length > 120) S.log.pop(); console.log('[LOG]', msg); }
```

## Graveyard/js/data/achievements.js
```
// ДОСТИЖЕНИЯ — тексты дословно из монолита «Вечный покой 5.4» (data-restore).
// Предикаты — дословные условия checkAch монолита, машинно-читаемые (никаких if-ов в логике).
import { TECHS } from './techs.js';

export const ACH = [
{id:'a1',n:'Первая страничка',d:'Провести первые похороны'},
{id:'a2',n:'Десятый постоялец',d:'10 похорон'},
{id:'a3',n:'Свечной магнат',d:'Продать 20 свечей'},
{id:'a4',n:'Учёный',d:'Накопить 50 науки за всё время'},
{id:'a5',n:'Образцовые могилы',d:'5 могил мрамора'},
{id:'a6',n:'Друг ворона',d:'5 выполненных заказов ворона'},
{id:'a7',n:'Зелёные пальцы',d:'Собрать 20 цветов'},
{id:'a8',n:'Старожил',d:'Прожить 30 дней'},
{id:'a9',n:'Милосердие',d:'Накормить бродягу'},
{id:'a10',n:'Эрудит',d:'Изучить все технологии'},
{id:'a11',n:'Тайник',d:'Иметь 500 монет разом'},
{id:'a12',n:'Образцовое кладбище',d:'Достичь 100 репутации'}]

export const TESTS = {
  a1: (s) => s.stats.buried >= 1,
  a2: (s) => s.stats.buried >= 10,
  a3: (s) => s.stats.candlesSold >= 20,
  a4: (s) => s.stats.scienceTotal >= 50,
  a5: (s) => s.graves.filter((g) => g.level === 3).length >= 5,
  a6: (s) => s.crow.done >= 5,
  a7: (s) => s.stats.flowers >= 20,
  a8: (s) => s.day >= 30,
  a9: (s) => s.stats.vagrantFed,
  a10: (s) => Object.keys(s.techs).length >= TECHS.length,
  a11: (s) => s.coins >= 500,
  a12: (s) => s.rep >= 100,
};

// логика монолита дословно; UI-вызовы вынесены в колбэки
export function checkAch(s, hooks = {}) {
  const grant = (id) => {
    if (!s.ach[id]) {
      s.ach[id] = true;
      const a = ACH.find((x) => x.id === id);
      if (hooks.onAch) hooks.onAch(id, a);
    }
  };
  for (const id of Object.keys(TESTS)) if (TESTS[id](s)) grant(id);
  if (s.rep >= 100 && !s.endless) { s.endless = true; if (hooks.onVictory) hooks.onVictory(); }
}

```

## Graveyard/js/data/church.js
```
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

```

## Graveyard/js/data/craft.js
```
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

```

## Graveyard/js/data/crow.js
```
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

```

## Graveyard/js/data/day.js
```
import { S, adopt, get, log, spend, spendE, have, addRes } from '../core/state.js';
import { rng } from '../core/rng.js';
import { GRAVE_NAMES } from './texts.js';
import { CROW_ORDERS } from './crow.js';
import { checkAch } from './achievements.js';
import { sellPrice } from './market.js';
import { ITEMS } from './items.js';

// newDay — дословно из монолита 5.4 (Math.random -> rng, showVictory -> флаг victory).
// morningEvent — дословно из монолита 5.4 (Math.random -> rng, window._thief -> thief).
export function newDay() {
  const toasts = [];
  S.day++;
  S.rain = false;
  S.corpses.forEach(c => c.days++);
  const bad = S.corpses.filter(c => c.days > 2);
  if (bad.length) {
    const pen = bad.length;
    S.rep = Math.max(0, S.rep - pen);
    log('Тела в морге просрочены: репутация −' + pen + '. Ворон посмотрел строго.');
  }
  if (rng.next() < 0.6) {
    const stars = 1 + Math.floor(rng.next() * 3 + rng.next() * 2.5);
    const st = Math.min(5, Math.max(1, Math.round(stars)));
    const cap = S.techs.logistics ? 2 : 1;
    if (S.corpses.length < cap) {
      S.corpses.push({ stars: st, days: 0, extracted: 0, parts: { skull: true, brain: true, blood: true, fat: true, bones: true, flesh: true } });
      log('Ночью привезли постояльца: ' + GRAVE_NAMES[Math.floor(rng.next() * GRAVE_NAMES.length)] + ' (' + '★'.repeat(st) + '). Повозка скрылась в тумане.');
    }
  }
  S.marketPrev = { ...S.market };
  S.market = {
    candle: 12 + (rng.next() * 4 - 2),
    wax: 7 + (rng.next() * 2 - 1),
    fertilizer: 10 + (rng.next() * 3 - 1.5),
    ink: 14 + (rng.next() * 4 - 2),
    skull: 30 + (rng.next() * 8 - 4),
    brain: 20 + (rng.next() * 6 - 3),
    flesh: 4 + (rng.next() - 0.5),
  };
  if (S.techs.accountant) S.coins += 2 * S.graves.filter(g => g.occ).length;
  S.donatedToday = 0;
  if (S.rep >= 10 && !S.crow.active) {
    S.crow.active = true;
    log('Ворон признал тебя за равного: у ограды теперь есть дела.');
  }
  if (S.crow.active && !S.crow.order && rng.next() < 0.4) {
    S.crow.order = CROW_ORDERS[Math.floor(rng.next() * CROW_ORDERS.length)];
    log('Ворон принёс заказ: «' + S.crow.order.n + '». Птица деловая.');
  }
  S.energy = S.maxEnergy;
  checkAch(S);
  const victory = victoryCheck();
  return { ok: true, toasts, victory };
}
// ---------- утренние события ----------
let thief = null;
let pendingEvent = null;

export function morningEvent() {
  const rolls = [];
  if (S.corpses.some(c => c.days > 2)) rolls.push({ w: 3, id: 'evInspector' });
  rolls.push({ w: 2, id: 'evQuiet' }, { w: 1, id: 'evRain' }, { w: 1, id: 'evPilgrims' },
    { w: 1, id: 'evVagrant' }, { w: 1, id: 'evThief' }, { w: 1, id: 'evComet' },
    { w: 1, id: 'evFind' }, { w: 1, id: 'evGustavDeal' }, { w: 1, id: 'evVolunteers' });
  const total = rolls.reduce((a, b) => a + b.w, 0);
  let r = rng.next() * total;
  let ev = rolls[0];
  for (const it of rolls) { if (r < it.w) { ev = it; break; } r -= it.w; }
  pendingEvent = EV[ev.id]();
  return pendingEvent;
}

const EV = {
  evQuiet() {
    return { id: 'quiet', title: 'Тихое утро', text: 'Утро выдалось тихим. Ворон дремлет на ограде, трава в росе, и только где-то вдалеке лает собака. Деревня живёт своей жизнью, не подозревая, сколько дел у её кладбища.', btn: 'Доброе утро' };
  },
  evRain() {
    S.rain = true;
    return { id: 'rain', title: 'Дождь', text: 'Небо затянуло тучами. Глина размокла, лопата идёт тяжело: копка сегодня дороже по энергии. Зато клумба рада — и земля дышит.', btn: 'Не тужи' };
  },
  evPilgrims() {
    const n = Math.min(have('candle'), 5);
    if (n > 0) {
      const p = Math.round(sellPrice(S, 'candle') * 1.5 * n);
      spend('candle', n); S.coins += p; S.stats.candlesSold += n;
      return { id: 'pilgrims', title: 'Паломники', text: 'Со стороны тракта донеслась песня — паломники идут мимо на ярмарку. Они купили у тебя ' + n + ' свечей по щедрой цене: +' + p + '💰. Паломники верят, что свет в пути начинается с тебя.', btn: 'Славно' };
    }
    return { id: 'pilgrims', title: 'Паломники', text: 'Со стороны тракта донеслась песня — паломники идут мимо на ярмарку. Они заглянули за свечами, но у тебя их нет. Вздохнули и пошли дальше: «Смотритель нынче, видать, запаслив, да не в ту сторону».', btn: 'Обидно' };
  },
  evVagrant() {
    return { id: 'vagrant', title: 'Бродяга у ворот', text: 'У ворот стоит бродяга — грязный, но с ясным взглядом. «Хлеба бы, господин смотритель. А я тебе и помолюсь, и расскажу, что слышал в дороге».', choices: [{ id: 'feed', label: 'Накормить (5💰)' }, { id: 'shoo', label: 'Прогнать' }] };
  },
  evThief() {
    thief = null; let stolen = '';
    const pool = ['candle', 'wax', 'bones', 'flowers', 'ink', 'fat', 'flour'];
    const avail = pool.filter(k => have(k) >= 2);
    if (S.coins >= 10) avail.push('_coins');
    if (avail.length) {
      const k = avail[Math.floor(rng.next() * avail.length)];
      if (k === '_coins') { S.coins -= 10; thief = { k: 'coins', n: 10 }; stolen = 'горстку монет (10💰)'; }
      else { S.res[k] -= 1; thief = { k, n: 1 }; stolen = ITEMS[k].i + ' ' + ITEMS[k].n.toLowerCase() + ' ×1'; }
    }
    return { id: 'thief', title: 'Ночной вор', text: 'Ночью кто-то рылся в сарае. Следы грязи ведут в сторону леса.' + (stolen ? ' Сверившись с полками, ты понял: пропало ' + stolen + '.' : ' Воровать, впрочем, было нечего: сундук почти пуст. Хоть вор честный.'), choices: [{ id: 'find', label: 'Искать (10⚡)' }, { id: 'forgive', label: 'Простить' }] };
  },
  evInspector() {
    const bad = S.corpses.filter(c => c.days > 2).length;
    if (bad > 0) {
      const pen = S.techs.diplomat ? 2 : 5;
      S.rep = Math.max(0, S.rep - pen);
      return { id: 'inspector', title: 'Инспектор', text: 'Инспектор епархии прошёл по кладбищу с блокнотом и тонкой улыбкой. Записал: «' + bad + ' тел в состоянии, несовместимом с понятием „покой“». Репутация −' + pen + '. «Разберитесь, — сказал он, — епархия не любит запахов».', btn: 'Оплеуха' };
    }
    S.rep += 1;
    return { id: 'inspector', title: 'Инспектор', text: 'Инспектор епархии прошёл по кладбищу с блокнотом. Морг чист, могилы ухожены, свечи ровные. Он поставил галочку и впервые улыбнулся: «Порядок, смотритель. Так держать». Репутация +1.', btn: 'Комплимент' };
  },
  evComet() {
    S.science = (S.science || 0) + 3; S.stats.scienceTotal = (S.stats.scienceTotal || 0) + 3;
    return { id: 'comet', title: 'Комета', text: 'Ночью над кладбищем прошла комета. Старожилы говорят: это к знаниям. Ворон смотрел на небо так, будто знал расписание. +3📜.', btn: 'Знаки' };
  },
  evFind() {
    addRes('stone', 2);
    return { id: 'find', title: 'Старый киот', text: 'В дальнем углу кладбища провалился старый киот. Под ним — аккуратно сложенные камни. Дядюшка любил порядок даже в руинах. +2🪨.', btn: 'Находка' };
  },
  evGustavDeal() {
    return { id: 'gustavDeal', title: 'Густав с тележкой', text: 'Густав привёз тележку жира: «Распродажа, смотритель. Всего 4💰 за штуку, пока не кончилось». Жир — товар деликатный, долго не лежит.', choices: [{ id: 'gustav-fat', label: 'Взять' }] };
  },
  evVolunteers() {
    return { id: 'volunteers', title: 'Волонтёры', text: 'Пришли волонтёры с метлами: «Говорят, у вас тут образцовое кладбище будет. Дайте маршрут — и мы нажмём». Убраться силами добрых людей стоит 5 монет на чай.', choices: [{ id: 'volunteer', label: 'Угостить (5💰)' }, { id: 'volunteer-no', label: 'Вежливо отказать' }] };
  },
};

// действия выбора — дословно из монолита (spend('coins') -> честная проверка S.coins, стандарт 6.0)
export function eventAction(id) {
  switch (id) {
    case 'feed':
      if (S.coins < 5) return { ok: false, toast: 'Не хватает монет' };
      S.coins -= 5; S.rep += 2; S.stats.vagrantFed = true;
      log('Накормил бродягу у ворот. Он помолился — и, кажется, искренне.');
      checkAch(S);
      return { ok: true, toast: 'Репутация +2. Милосердие в цене.' };
    case 'shoo':
      if (S.techs.diplomat) log('Прогнал бродягу так вежливо, что он извинился. Дипломатия — наука.');
      else { S.rep = Math.max(0, S.rep - 1); log('Прогнал бродягу. Деревня видела — и запомнила.'); }
      return { ok: true };
    case 'find': {
      if (!spendE(10)) return { ok: false, toast: 'Слишком мало энергии' };
      if (rng.next() < 0.5) {
        let got = '25💰 как утешительный приз';
        if (thief) {
          got = (thief.k === 'coins' ? 'монеты обратно' : ITEMS[thief.k].i + ' ' + ITEMS[thief.k].n + ' обратно');
          if (thief.k === 'coins') S.coins += thief.n; else addRes(thief.k, thief.n);
          thief = null;
        } else { S.coins += 25; }
        log('Догнал вора в лесу. Вернул добычу и добавил наставлений. Лес запомнил.');
        return { ok: true, toast: 'Вор пойман: ' + got };
      }
      log('Обшарил весь лес, но следы потерялись в папоротниках. Утро потрачено не зря — почти.');
      return { ok: true, toast: 'Удача отвернулась' };
    }
    case 'forgive':
      S.rep += 1;
      log('Простил вора. Кто-то из деревни видел это и оценил.');
      return { ok: true, toast: 'Репутация +1' };
    case 'gustav-fat':
      if (S.coins < 12) return { ok: false, toast: 'Не хватает монет' };
      S.coins -= 12; addRes('fat', 3);
      return { ok: true, toast: 'Жир ×3 за 12💰. Выгодно.' };
    case 'volunteer':
      if (S.coins < 5) return { ok: false, toast: 'Не хватает монет' };
      S.coins -= 5; S.rep += 1;
      log('Волонтёры прибрались на кладбище. Чай был горячим, метлы — весёлыми.');
      return { ok: true, toast: 'Репутация +1' };
    default:
      return { ok: true };
  }
}


// victoryCheck — дословная логика монолита (showVictory уходит в main.js: data-слой без DOM).
export function victoryCheck(){if(S.rep>=100&&!S.endless){S.endless=true;return true}return false}
```

## Graveyard/js/data/garden.js
```
import { S, spend, spendE, addRes } from '../core/state.js';
import { checkAch } from './achievements.js';

// Дословно из монолита 5.4 (UI-вызовы вынесены в возвращаемые объекты — стандарт 6.0).
// plantSeed: 3 энергии + 1 семя -> planted=true, readyDay=S.day+1
export function plantSeed() {
  if (!spendE(3)) return { ok: false, toast: 'Слишком мало энергии' };
  if (!spend('seeds', 1)) return { ok: false, toast: 'Нужны семена' };
  S.plant.planted = true;
  S.plant.readyDay = S.day + 1;
  return { ok: true, toast: 'Семена в земле. До завтра.' };
}

// fertBed: 1 удобрение -> fert=true
export function fertBed() {
  if (!spend('fertilizer', 1)) return { ok: false, toast: 'Нужно удобрение' };
  S.plant.fert = true;
  return { ok: true, toast: 'Клумба удобрена. Урожай будет щедрым.' };
}

// harvest: 2 базово, +1 грядник; при удобрении +4 агроном / +2 иначе; fert сбрасывается
export function harvest() {
  if (!S.plant.planted) return { ok: false, toast: 'Грядка пуста' };
  if (S.plant.readyDay > S.day) return { ok: false, toast: 'Ещё не созрели' };
  S.plant.planted = false;
  let n = 2 + (S.techs.gardener ? 1 : 0);
  if (S.plant.fert) { n += S.techs.agro ? 4 : 2; S.plant.fert = false; }
  S.stats.flowers += n;
  addRes('flowers', n);
  checkAch(S);
  return { ok: true, toast: 'Собрано цветов: ' + n + ' 🌸', sfx: 'ach' };
}

```

## Graveyard/js/data/items.js
```
// ПОЛНЫЙ РЕЕСТР ПРЕДМЕТОВ — дословно из монолита «Вечный покой 5.4» (data-restore)
export const ITEMS = {
coins:{n:'Монеты',i:'💰',d:'Звенящая валюта деревни. Густав любит повторять: «Монеты мертвы, но всегда в хорошей форме».'},
energy:{n:'Энергия',i:'⚡',d:'Твои силы. Восстанавливаются за сном, кофе и правильным настроением.'},
rep:{n:'Репутация',i:'⭐',d:'Что о тебе думает деревня и епархия. До 100 — образцовое кладбище.'},
science:{n:'Наука',i:'📜',d:'Знания, добытые за столом и в лаборатории. Топливо технологий.'},
fat:{n:'Жир',i:'🫗',d:'Ресурс сомнительного происхождения. Превращается в воск на печи.'},
wax:{n:'Воск',i:'🕯️',d:'Основной товар деревни. Пахнет мёдом и немного — виной.'},
candle:{n:'Свеча',i:'🕯',d:'Свет для живых и мёртвых. Продай на рынке или укрась могилу.'},
thread:{n:'Нить',i:'🧵',d:'Покупается у Густава. Без неё фитиль не свить.'},
bones:{n:'Кости',i:'🦴',d:'Из земли и из морга. Мелются в костную муку.'},
flour:{n:'Костная мука',i:'🥣',d:'Молотые кости. Пахнет старыми обещаниями.'},
fertilizer:{n:'Удобрение',i:'🌱',d:'Питательный грунт для клумб: кости честно отрабатывают своё.'},
blood:{n:'Кровь',i:'🩸',d:'Тёмная и густая. Основа чернил и пары несвязанных загадок.'},
ink:{n:'Чернила',i:'🖋️',d:'Идеальны для писем и расписок. Не спрашивай, из чего.'},
brain:{n:'Мозг',i:'🧠',d:'Хранилище чужих мыслей. Изучается ради науки или продаётся коллекционерам с непритязательными запросами.'},
skull:{n:'Череп',i:'💀',d:'Голова бывшего соседа. Добывается только вскрытием в морге. Дорогая редкость: коллекционеры, ворон и наука.'},
flesh:{n:'Плоть',i:'🥩',d:'Густав покупает её не глядя. Мы тоже не будем.'},
flowers:{n:'Цветы',i:'🌸',d:'С клумбы. Свежие — на могилу и в бальзам.'},
seeds:{n:'Семена',i:'🌾',d:'Посадишь сегодня — соберёшь завтра.'},
stone:{n:'Камень',i:'🪨',d:'Для добротных каменных могил (ур. 2).'},
marble:{n:'Мрамор',i:'🪦',d:'Дорогая роскошь. Могилы ур. 3 для особых постояльцев.'},
water:{n:'Вода',i:'💧',d:'Для растворов, чернил и бальзама.'},
coffee:{n:'Кофе',i:'☕',d:'+10 энергии. Густав варит на славу.'},
balsam:{n:'Бальзам',i:'🧴',d:'Ароматная мазь для бальзамирования: +3 к качеству похорон.'},
elixir:{n:'Эликсир',i:'⚗️',d:'+25 энергии при употреблении. Настой на цветах и родниковой воде — совесть чиста.'}}

// инвентарные предметы — дословно из монолита
export const INV = ['fat','wax','candle','thread','bones','flour','fertilizer','blood','ink','brain','skull','flesh','flowers','seeds','stone','marble','water','coffee','balsam','elixir']

// совместимость со схемой §4.1 ARCHITECTURE: поверх монолитных n/i/d
export function meta(id) {
  const it = ITEMS[id] || {};
  return { id, name: it.n || id, icon: it.i || '', desc: it.d || '', price: it.price ?? 0, ...it };
}

// реестр продаваемых на рынке — дословно из монолита
export const SELLABLE = ['candle', 'wax', 'fertilizer', 'ink', 'skull', 'flesh', 'brain'];

```

## Graveyard/js/data/market.js
```
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

```

## Graveyard/js/data/morgue.js
```
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

```

## Graveyard/js/data/needs.js
```
// needCheck/whyNeed — дословно из монолита «Вечный покой 5.4» (data-restore)
import { S, have } from '../core/state.js';
import { ITEMS } from './items.js';

export function whyNeed(list) {
  const miss = list.filter((x) => {
    const r = x[0];
    if (r === 'e') return S.energy < x[1];
    if (r === 'science') return S.science < x[1]; // исправление причуды 5.4: наука живёт в S.science
    return have(r) < x[1];
  });
  if (!miss.length) return null;
  return 'Не хватает: ' + miss.map((m) => m[0] === 'e' ? ITEMS.energy.i + ' ' + m[1] + '/' + S.energy : m[0] === 'science' ? '\u{1F4DC} ' + m[1] + '/' + S.science : ITEMS[m[0]].i + ' ' + m[1] + '/' + have(m[0])).join(', ');
}

export function needCheck(list) {
  const w = whyNeed(list);
  if (w) return { ok: false, w };
  return { ok: true };
}

```

## Graveyard/js/data/places.js
```
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

```

## Graveyard/js/data/techs.js
```
// ПОЛНЫЙ РЕЕСТР ТЕХНОЛОГИЙ — дословно из монолита «Вечный покой 5.4» (data-restore)
// Формат монолита: массив {id, n, cost, d, f}. Изученные — ключи в S.techs (id -> true).
export const TECHS = [
{id:'trade',n:'Торговый нюх',cost:4,d:'Продажа на рынке дороже на 15%.',f:'Густав: «У тебя глаз намётан, смотритель».'},
{id:'ergo',n:'Эргономика',cost:4,d:'Копка земли: 6⚡ вместо 8⚡.',f:'Лопата с удобной рукоятью — половина успеха.'},
{id:'rituals',n:'Утренние ритуалы',cost:5,d:'Максимум энергии +10.',f:'Растяжка, холодная вода и мысль о вечном.'},
{id:'oven',n:'Печной мастер',cost:6,d:'Своя печь: воск без услуг Густава.',f:'Печь дядюшки ещё дышит — надо лишь раздуть.'},
{id:'orator',n:'Оратор',cost:6,d:'Пожертвования дают двойную репутацию.',f:'Ты научился говорить так, что слушают даже ворон.'},
{id:'stone',n:'Каменное дело',cost:8,d:'Открывает каменные могилы (ур. 2).',f:'Каменщик из соседней деревни поделился секретом.'},
{id:'marble',n:'Мраморный резец',cost:14,d:'Мраморные могилы (ур. 3), мрамор дешевле.',f:'Резец поёт, стружка летит, вдова плачет от красоты.'},
{id:'accountant',n:'Бухгалтерия',cost:8,d:'+2 монеты в день за каждую занятую могилу.',f:'Покойники платят исправно — главное, не опаздывать с бумагами.'},
{id:'alchemy1',n:'Алхимия I',cost:8,d:'Лаборатория: изучение мозгов и чернила.',f:'Реторты, колбы и запах серы. Наука требует жертв.'},
{id:'alchemy2',n:'Алхимия II',cost:12,d:'Эликсир энергии и бальзам в лаборатории.',f:'Дядюшка оставил недописанный трактат. Ты его закончишь.'},
{id:'logistics',n:'Логистика',cost:10,d:'Второе место в морге.',f:'Стеллаж, накидка и уважение к очереди.'},
{id:'gentle',n:'Тихие руки',cost:6,d:'Вскрытие: 1⚡ вместо 2⚡.',f:'Ты двигаешься так, что будильник не завидует.'},
{id:'gardener',n:'Садовник',cost:5,d:'+1 цветок с каждого сбора.',f:'Клумба зашептала, что хочет жить.'},
{id:'agro',n:'Агрономия',cost:9,d:'Удобрение даёт вдвое больше цветов.',f:'Кости в землю — цветы в руки. Круговорот.'},
{id:'diplomat',n:'Дипломатия',cost:7,d:'Прогнать бродягу без потери репутации.',f:'Иногда вместо каши нужен лишь твёрдый взгляд.'},
{id:'candlemaster',n:'Мастер свечей',cost:11,d:'+3 монеты к цене каждой свечи.',f:'Фитиль ровный, воск чистый — витринное качество.'},
{id:'embalm',n:'Стол бальзамирования',cost:4,d:'Бальзамирование: +1\u2605 телу в морге (один раз).',f:'Холодный стол, игла и нить. Тело обретает достоинство, а не только запах.'}]

// машинные эффекты — источник: места использования в монолите (никаких if(tech==='ergo') в логике):
//   ergo         -> digCost 6 вместо 8            (data/places.js)
//   trade        -> sellPrice x1.15               (data/market.js)
//   candlemaster -> свеча +3 к цене продажи       (data/market.js)
//   marble       -> мрамор у Густава 22 вместо 25 (data/market.js)
export function has(s, id) { return !!(s.techs && s.techs[id]); }
export function learnedCount(s) { return Object.keys(s.techs || {}).length; }

```

## Graveyard/js/data/tutorial.js
```
// Туториал — из монолита 5.4: TUT_STEPS/curTut/tutBanner/tutOff дословно.
// Адаптация 6.0: inline onclick -> data-action (конвенция модулей), done-предикаты
// работают с импортированным S (в монолите S был глобальным объектом).
import { S } from '../core/state.js';

export const TUT_STEPS=[
{t:'Добро пожаловать на кладбище!',d:'Ты — смотритель. Начни простое: копай землю на вкладке Кладбище — из грунта достаются кости, камень и жир. Копка тратит энергию.',tab:'graveyard',lbl:'К кладбищу',done:()=>S.stats.digs>=1},
{t:'Ночью приедут постояльцы',d:'Тела привозят сами — после кнопки «Новый день» внизу экрана. Утром загляни в Морг.',tab:'morgue',lbl:'К моргу',done:()=>S.corpses.length>0||S.stats.buried>0},
{t:'Проведи вскрытие',d:'Во Морг: процедуры дают ресурсы и плюс к качеству будущих похорон. Череп добывается только при вскрытии — голова постояльца, не из земли.',tab:'morgue',lbl:'К моргу',done:()=>S.stats.extracted>=1},
{t:'Свари воск',d:'В Ремесле: жир ×2 и немного энергии дают воск. Воск — основа свечей, товара деревни.',tab:'craft',lbl:'К ремеслу',done:()=>S.stats.waxMade>=1},
{t:'Скрути свечу',d:'В Ремесле: воск и нить дают свечу. Нити нет — купи у Густава в лавке.',tab:'craft',lbl:'К ремеслу',done:()=>S.stats.candlesMade>=1},
{t:'Проведи первые похороны',d:'Выбери свободную могилу на Кладбище, добавь декор (свеча даёт больше всего звёзд) и подтверди. Качество похорон превращается в репутацию и монеты.',tab:'graveyard',lbl:'К кладбищу',done:()=>S.stats.buried>=1},
{t:'Продай свечу на рынке',d:'Рынок живой: цены дышат, стрелки показывают вчерашний ход. Продавай на пике — торговля тоже ремесло.',tab:'market',lbl:'К рынку',done:()=>S.stats.sales>=1},
{t:'Изучи технологию',d:'Технологии открывают перки за науку. Первую уже можно взять.',tab:'techs',lbl:'К технологиям',done:()=>Object.keys(S.techs).length>=1},
{t:'Заказ ворона',d:'Ворон изредка приносит заказы. Сдавай вовремя — премии приятны и репутации полезны.',tab:'crow',lbl:'К ворону',done:()=>S.crow.done>=1},
{t:'Дальше — сам, смотритель',d:'Доведи репутацию до 100. Гниющие тела, каменные могилы, дожди и строгий инспектор — всё уже в пути. Удачи!',tab:'graveyard',lbl:'К кладбищу',done:()=>false}
];

export function curTut(){if(!S.tut||!S.tut.on)return -1;for(let i=0;i<TUT_STEPS.length;i++){if(!TUT_STEPS[i].done())return i}return -1}

export function tutBanner(){const i=curTut();if(i<0)return '';const t=TUT_STEPS[i];
const last=i===TUT_STEPS.length-1;return '<div class="card" style="border-color:#c9a227"><b>📖 Обучение, шаг '+(i+1)+' из '+TUT_STEPS.length+': '+t.t+'</b><p class="sub">'+t.d+'</p><div class="row">'+(last?'<button class="btn gold" data-action="tut-off">Понял, спасибо</button>':'<button class="btn gold" data-action="tut-goto" data-arg="'+t.tab+'">Идти: '+t.lbl+'</button><button class="btn" data-action="tut-off">Не мешай, я сам</button>')+'</div></div>'}

export function tutOff(){S.tut.on=false;return{ok:true,toast:'Обучение скрыто. Вернуть: справка ❔ → «Показать обучение».'}}

```

## Graveyard/js/data/texts.js
```
// ТЕКСТЫ — дословно из монолита «Вечный покой 5.4» (data-restore).
// Этап texts перепишет тон по DESIGN.md — исходники сохранены здесь целиком.

export const GUSTAV_LINES=['Густав вытирает прилавок. «Свечи нынче в цене, смотритель. Люди боятся темноты, а тьма — вечный бизнес».','«Слыхал? У епархии новые инспекторы. Ходят с бумажками и дурным настроением».','Густав щурится: «Кофе — священный напиток. Дороже только отпевание».','«Плоть беру по строгим правилам: не глядя и без вопросов». Он загадочно улыбается.','«Мрамор подорожал. Война где-то далеко, а камень, как всегда, рядом».','Густав наливает тебе кофе без спроса. «За счёт заведения. Ты единственный клиент, который не спорит»','«Слышал, на ярмарке в соседнем городе свечи разбирают как пряники? Жаль, телега у меня одна, а дорога та ещё»','Густав принюхивается: «Пахнешь мышами и наукой. Это комплимент, между прочим»','«Инспектор вчера брал у меня свечу. Одну. Для кого — не сказал. Но руки у него дрожали»','«Дядюшка твой когда-то выменял у меня ящик свечей на партию гвоздей. Странные времена были, смотритель»','Густав ставит на прилавок вторую чашку. «Кофе подорожал. Но тебе — по старой памяти, без наценки»','«Кузнец спрашивал про мрамор. Говорит, кто-то заказал большую партию. Не твой ли кладбищенский размах?»']

export const RAVEN_LINES=['Ворон важно расхаживает по ограде, будто он тут смотритель, а ты — ассистент.','Ворон склоняет голову набок. В его взгляде читается: «Дела, у тебя дела».','Где-то ухнула сова. Ворон сделал вид, что не испугался.','Ворон принёс в клюве блестящую пуговицу и оставил на подоконнике. Комплимент? Плата? Знак?','Ворон принёс крышку от карманных часов. Чья — лучше не спрашивать.','Ворон смотрит на тебя с ветки ивы — взгляд практика, оценивающего подмастерье.','Ворон каркнул трижды. По поверьям — к деньгам. По вороновым — к делу.','Ворон прощупывает клювом ограду. Инспекция или скука — не разобрать.','Ворон вернулся с луга и сел на надгробие, как на трибуну.','Ворон положил перед моргом живого крота и выжидательно наклонил голову. Подарок или счёт за услуги?']

export const BURIAL_LINES=['Кучер бросил «Держи, смотритель» и исчез, не дожидаясь квитанции.','Свеча на могиле горит ровно — хороший знак.','Старушка из деревни утерла слезу и назвала тебя хорошим человеком.','Пономарь записал церемонию в приходскую книгу аккуратным почерком.','Ворон провожал процессию до самой ограды — по-деловому, как сторож.','Дождь вдруг кончился, когда опустили крышку. Деревня запомнит.','Густав уже пересчитал выручку и довольно кивнул сам себе.']

export const LOGOS=[
'Первый день на новом месте. Дядюшкино кладбище досталось тебе вместе с долгами, лопатой и кое-какой репутацией.',
'Деревня смотрит косо: новый смотритель — это всегда вопрос. Докажи делом.',
'Густав из лавки шепнул: «Главное, не поднимай цены резко. Деревня всё помнит».',
'Свежая могила пахнет землёй и смирением. Работа сделана — совесть чиста.',
'Ворон сегодня наблюдал за тобой с ветки ивы. Как будто оценивал.',
'Ночь прошла спокойно. Никто не стучался в ворота — и слава богу.',
'Мимо кладбища прошли циркачи. Один помахал тебе рукой с крыши кареты — вы, кажется, знакомы.',
'Пономарь попросил свечей к воскресной службе. Официально это называется «спрос».',
'Кузнец починил твою лопату и отказался брать плату. «За покойников — не считаю».',
'Кто-то оставил на ограде венок с запиской: «Спасибо за порядок». Подписи нет.',
'Ворон вороновича вида: он всю ночь раскладывал на ограде пуговицы. Что-то он знает.',
'Густав намекнул, что коллекционер черепов спрашивал о тебе. Дважды.',
'На рассвете над кладбищем кружил аист. Деревня гадает: к чему бы это.',
'Дядюшкино завещание снова перечитано. Каждое слово, кажется, понимается иначе, чем в первый день']

export const GRAVE_NAMES=['Агапит','Феодора','Марфа','Прохор','Устинья','Савелий','Клеопатра','Захар','Пелагея','Тихон','Агафья','Ерофей','Василиса','Гордей','Софрон','Лукерья','Пантелей','Дарья','Серафим','Евдокия']
```

## Graveyard/js/main.js
```
import { rng } from './core/rng.js';
import { bus } from './core/bus.js';
import { S, adopt, get, log, have, fmt, defaultState } from './core/state.js';
import { load, save, migrate, wipe } from './core/save.js';
import { renderTop, renderTabs, renderScreen } from './ui/render.js';
import { bindActions } from './ui/input.js';
import { toast, sfx, floatTxt } from './ui/dialog.js';
import { dig, digCost, buyGrave, buyBed } from './data/places.js';
import { sellItem, sellGustav, buyRes, learn } from './data/market.js';
import { plantSeed, fertBed, harvest } from './data/garden.js';
import { newDay, morningEvent, eventAction, victoryCheck } from './data/day.js';
import { extract, openBurial, bInc, bDec, bTog, doBurial, burialState, embalm } from './data/morgue.js';
import { craftAction, useItem } from './data/craft.js';
import { donate, preach } from './data/church.js';
import { doOrder } from './data/crow.js';
import { tutOff } from './data/tutorial.js';

import * as graveyardScreen from './screens/graveyard.js';
import * as morgueScreen from './screens/morgue.js';
import * as marketScreen from './screens/market.js';
import * as churchScreen from './screens/church.js';
import * as craftScreen from './screens/craft.js';
import * as crowScreen from './screens/crow.js';
import * as journalScreen from './screens/journal.js';

// реестр рендеров: id -> функция, возвращающая HTML
const RENDERERS = {
  graveyard: graveyardScreen.initGraveyard,
  forest: graveyardScreen.initForest,
  garden: graveyardScreen.initGarden,
  morgue: morgueScreen.initMorgue,
  autopsy: morgueScreen.initAutopsy,
  burial: morgueScreen.initBurial,
  craft: craftScreen.initCraft,
  lab: craftScreen.initLab,
  market: marketScreen.initMarket,
  techs: marketScreen.initTechs,
  gustav: marketScreen.initGustav,
  church: churchScreen.initChurch,
  sermons: churchScreen.initSermons,
  stats: churchScreen.initStats,
  crow: crowScreen.initCrow,
  inv: journalScreen.initInv,
  ach: journalScreen.initAch,
  log: journalScreen.initLog,
};

function switchScreen(name) {
  adopt({ ...get(), screen: name });
  renderTabs();
  const fn = RENDERERS[name];
  renderScreen(fn ? fn() : '<p>Экран в разработке</p>');
}

// модалка утреннего события (вёрстка монолита showEvent)
function showEventModal(ev) {
  const root = document.getElementById('modalRoot');
  let h = '<h3>' + ev.title + '</h3><p>' + ev.text + '</p>';
  if (ev.choices && ev.choices.length) {
    h += '<div class="row">' + ev.choices.map((c, i) =>
      '<button class="btn ' + (i === 0 ? 'gold' : '') + '" data-action="event-choice" data-arg="' + c.id + '">' + c.label + '</button>').join('') + '</div>';
  } else {
    h += '<button class="btn gold" data-action="event-close">' + (ev.btn || 'Дальше') + '</button>';
  }
  root.innerHTML = '<div class="modal-bg"><div class="modal">' + h + '</div></div>';
}
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

// модалка победы — вёрстка монолита showVictory дословно (inline onclick -> data-action)
function showVictoryModal() {
  document.getElementById('modalRoot').innerHTML = '<div class="modal-bg"><div class="modal"><h2>\u2696 ОБРАЗЦОВОЕ КЛАДБИЩЕ \u2696</h2><p>Репутация достигла 100. Церковь в восторге, ворон смотрит с уважением, а Густав предложил партнёрство.</p><p>Ты пришёл сюда безвестным наследником с лопатой — а стал человеком, о котором говорят за столами всей епархии. Дядюшка, где бы он ни был, доволен.</p><p>День ' + S.day + '. Похоронено: ' + S.stats.buried + '. Монет в сундуке: ' + fmt(S.coins) + '.</p><button class="btn gold" data-action="victory-close">Продолжить бессмертие</button></div></div>';
}

// справка — вёрстка монолита showHelp дословно (inline onclick -> data-action; bg-закрытие
// по прецеденту модалки похорон: data-action на modal-bg)
function showHelpModal() {
  document.getElementById('modalRoot').innerHTML = '<div class="modal-bg" data-action="help-close"><div class="modal"><h3>Как играть</h3><p><b>Цель:</b> довести репутацию до 100 и стать образцовым кладбищем.</p><p><b>Цикл:</b> ночью привозят тела — утром вскрывай (ресурсы + качество), хорони с декором, днём копай землю, крафти свечи, торгуй на рынке. Вечером — «Новый день».</p><p><b>Помни:</b> тела гниют после двух дней — инспектор строг. Кости → мука → удобрение → цветы → могилы и бальзам. Мозг → наука или продажа. Череп — из головы постояльца, а не из мозга.</p><p><b>🎒 Сумка</b> — всё твоё добро в одном месте: выпить, изучить, продать.</p><p><b>Прогресс</b> сохраняется сам в браузере.</p><div class="row"><button class="btn gold" data-action="help-close">Понял</button><button class="btn" data-action="tut-restart">Показать обучение</button></div></div></div>';
}

// сброс — монолит resetGame дословно (localStorage.removeItem('vp5_save') -> wipe(), ключ совпадает;
// intro() в 6.0 нет — сразу рендер кладбища)
function resetGame() {
  if (!confirm('Начать заново? Прогресс сотрётся.')) return;
  wipe();
  adopt(defaultState());
  closeModal();
  refresh();
}

function refresh() {
  renderTop();
  switchScreen(S.screen);
  // как в монолитном render(): checkAch(); victoryCheck(); save()
  if (victoryCheck()) { showVictoryModal(); sfx('win'); }
  save();
}


// модалка похорон — вёрстка монолита openBurial (window._bdraw -> renderBurialModal)
function showBurialModal() {
  const { bs, bi, bname } = burialState();
  if (!bs) return;
  const c = S.corpses[0];
  const stars = '\u2605'.repeat(c.stars) + '\u2606'.repeat(5 - c.stars);
  const q = c.stars + (c.extracted || 0) + S.graves[bi].level + bs.candle * 2 + (bs.flowers ? 2 : 0) + bs.balsam * 3;
  const root = document.getElementById('modalRoot');
  root.innerHTML =
    '<div class="modal-bg" data-action="burial-close"><div class="modal">' +
    '<h3>Похороны: ' + bname + '</h3>' +
    '<p class="flavor">Тело: ' + stars + '. Извлечено процедур: ' + (c.extracted || 0) + '. Могила ур. ' + S.graves[bi].level + '.</p>' +
    '<div class="row">\u{1F56F} Свечи (+' + (bs.candle * 2) + '): <button data-action="b-dec" data-arg="candle">\u2212</button> ' + bs.candle +
      ' <button data-action="b-inc" data-arg="candle">+</button> (есть ' + have('candle') + ')</div>' +
    '<div class="row">\u{1F338} Цветы \u00D72 (+' + (bs.flowers ? 2 : 0) + '): <button data-action="b-tog" data-arg="flowers">' + (bs.flowers ? 'снять' : 'положить') + '</button> (есть ' + have('flowers') + ')</div>' +
    '<div class="row">\u{1F9F4} Бальзам (+' + (bs.balsam * 3) + '): <button data-action="b-tog" data-arg="balsam">' + (bs.balsam ? 'без' : 'нанести') + '</button> (есть ' + have('balsam') + ')</div>' +
    '<p class="flavor">Качество похорон: <b>' + q + '</b> \u2192 репутация +' + q + ', монет +' + (15 + q * 2) + '.</p>' +
    '<button class="gold" data-action="do-burial" data-n="' + bi + '">Провести похороны \u2709</button> ' +
    '<button data-action="burial-close">Отложить</button>' +
    '<p class="why" id="berr"></p></div></div>';
}

function handleAction(payload) {
  switch (payload.action) {
    case 'dig': {
      const cost = digCost();
      if (S.energy < cost) { toast('Слишком мало энергии'); sfx('error'); return; }
      const got = dig();
      if (!got) return;
      toast(got.msg);
      sfx(got.sfx);
      refresh();
      break;
    }
    case 'buy-grave': {
      const r = buyGrave();
      toast(r.toast);
      if (r.ok) { if (r.log) log(r.log); sfx(r.sfx); refresh(); }
      break;
    }
    case 'buy-bed': {
      const r = buyBed();
      toast(r.toast);
      if (r.ok) { if (r.log) log(r.log); sfx(r.sfx); refresh(); }
      break;
    }
    case 'plant-seed': {
      const r = plantSeed();
      toast(r.toast);
      if (r.ok) refresh();
      break;
    }
    case 'fert-bed': {
      const r = fertBed();
      toast(r.toast);
      if (r.ok) refresh();
      break;
    }
    case 'harvest': {
      const r = harvest();
      toast(r.toast);
      if (r.ok) { if (r.sfx) sfx(r.sfx); refresh(); }
      break;
    }
    case 'new-day': {
      const r = newDay();
      for (const t of r.toasts || []) toast(t);
      if (r.victory) sfx('win');
      renderTop();
      refresh();
      save();
      const ev = morningEvent(); // как в монолите: событие сразу после нового дня
      if (ev) showEventModal(ev);
      break;
    }
    case 'event-choice': {
      const r = eventAction(payload.arg);
      if (!r.ok) { toast(r.toast); sfx('error'); break; } // модалка остаётся, как в монолите
      closeModal();
      if (r.toast) toast(r.toast);
      if (r.log) log(r.log);
      refresh();
      break;
    }
    case 'event-close': {
      closeModal();
      refresh();
      break;
    }
    case 'inspect':
      toast('Тело осмотрено (заглушка)');
      break;
    case 'sell': {
      if (sellItem(payload.item, payload.n)) refresh();
      break;
    }
    case 'sell-gustav': {
      if (sellGustav(payload.item)) refresh();
      break;
    }
    case 'buy': {
      const n = payload.n || 1;
      if (buyRes(payload.item, payload.price * n)) refresh();
      break;
    }
    case 'extract': {
      const r = extract(Number(payload.n), payload.arg);
      if (!r.silent) toast(r.toast);
      if (r.ok) { sfx('dig'); refresh(); }
      break;
    }
    case 'open-burial': {
      const r = openBurial(Number(payload.n));
      if (!r.ok && r.toast) { toast(r.toast); sfx('error'); }
      if (r.ok) { showBurialModal(); sfx('open'); }
      break;
    }
    case 'b-inc': { bInc(payload.arg); showBurialModal(); break; }
    case 'b-dec': { bDec(payload.arg); showBurialModal(); break; }
    case 'b-tog': { bTog(payload.arg); showBurialModal(); break; }
    case 'do-burial': {
      const r = doBurial(Number(payload.n));
      if (!r.ok) {
        const err = document.getElementById('berr');
        if (err) err.textContent = r.error; // как в монолите: модалка остаётся
        break;
      }
      closeModal();
      toast(r.toast);
      if (r.log) log(r.log);
      sfx('bury');
      refresh();
      break;
    }
    case 'burial-close': { closeModal(); break; }
    case 'craft': {
      const r = craftAction(payload.arg);
      if (r.ok) {
        toast(r.toast);
        if (r.sfx) sfx(r.sfx);
        if (r.fx) floatTxt(r.fx);
        refresh();
      } else if (r.toast) { toast(r.toast); sfx('error'); } // отказ по ресурсам молчит — кнопка задизейблена
      break;
    }
    case 'use-item': {
      const r = useItem(payload.arg);
      if (r.ok) { toast(r.toast); if (r.fx) floatTxt(r.fx); refresh(); }
      break;
    }
    case 'learn': {
      const r = learn(payload.arg);
      if (!r.silent) toast(r.toast);
      if (r.ok) { if (r.sfx) sfx(r.sfx); if (r.log) log(r.log); refresh(); }
      break;
    }
    case 'embalm': {
      const r = embalm(Number(payload.n));
      if (!r.silent) toast(r.toast);
      if (r.ok) { if (r.sfx) sfx(r.sfx); refresh(); }
      break;
    }
    case 'donate': {
      const r = donate();
      toast(r.toast);
      if (r.ok) { if (r.sfx) sfx(r.sfx); refresh(); }
      break;
    }
    case 'preach': {
      const r = preach();
      toast(r.toast);
      if (r.ok) refresh();
      break;
    }
    case 'crow-order': {
      const r = doOrder();
      if (!r.silent) toast(r.toast);
      if (r.ok) { if (r.sfx) sfx(r.sfx); refresh(); }
      break;
    }
    case 'toggle-sound': {
      S.sound = !S.sound;
      if (S.sound) sfx('click');
      renderTop();
      break;
    }
    case 'help': { showHelpModal(); break; }
    case 'help-close': { closeModal(); break; }
    case 'reset': { resetGame(); break; }
    case 'victory-close': { closeModal(); break; }
    case 'tut-off': {
      const r = tutOff();
      if (r.toast) toast(r.toast);
      refresh();
      break;
    }
    case 'tut-goto': { switchScreen(payload.arg); break; }
    case 'tut-restart': {
      if (!S.tut) S.tut = { on: true }; // как в монолитном showHelp
      S.tut.on = true;
      closeModal();
      refresh();
      break;
    }
  }
}

async function boot() {
  rng.init(1); // seed от состояния — задаток под погоду
  const saved = load();
  if (saved) {
    const s = migrate(saved);
    if (s) adopt(s);
  }
  bindActions(document.getElementById('app'));
  bindActions(document.getElementById('modalRoot'));
  bus.on('screen', switchScreen);
  bus.on('action', handleAction);
  renderTop();
  switchScreen(S.screen || 'graveyard');
  log('boot ok');
}

boot();
```

## Graveyard/js/screens/church.js
```
// ЦЕРКОВЬ И ПРОПОВЕДИ — вёрстка tChurch монолита (адаптация только в рендере)
import { S, fmt } from '../core/state.js';

// монолитный btn без needCheck: в 5.4 донат-кнопка была глушена навсегда
// (have('coins') всегда 0, монеты не в S.res) — по стандарту 6.0 кнопка живая,
// отказ обрабатывает donate() честным тостом
function cbtn(arg, label, cls) {
  return '<button class="btn ' + (cls || '') + '" data-action="' + arg + '">' + label + '</button>';
}

export function initChurch() {
  let h = '<h2>Церковь</h2><p class="sub">Отец Серапион приветливо кивает, но взгляд у него бухгалтерский: репутация — валюта епархии.</p>';
  h += '<div class="card" style="margin-bottom:12px"><h4>🕯 Пожертвовать (20💰 → +' + (S.techs.orator ? 2 : 1) + '⭐)</h4><p class="meta">Сегодня уже пожертвовано: ' + S.donatedToday + '/5.</p>' + cbtn('donate', 'Пожертвовать', 'gold') + '</div>';
  return h;
}

export function initSermons() {
  return '<div class="card"><h4>📖 Проповедь (5⚡ → +2📜)</h4><p class="meta">Слушатели кивают, вороны на крыше вторят. Наука — это тоже вера, только с таблицами.</p>' + cbtn('preach', 'Читать проповедь', 'gold') + '</div>';
}

export function initStats() {
  // 6.0-надстройка: в монолите отдельного экрана статистики нет — заполняем счётчиками S.stats
  const st = S.stats || {};
  const rows = [
    ['⏳', 'Дней в смотрителях', S.day],
    ['💰', 'Монет в сундуке', fmt(S.coins)],
    ['⭐', 'Репутация', S.rep],
    ['📜', 'Наука всего', st.scienceTotal || 0],
    ['⚰️', 'Похоронено', st.buried || 0],
    ['🔬', 'Вскрытий', st.extracted || 0],
    ['⛏️', 'Копок земли', st.digs || 0],
    ['🕯️', 'Свечей сделано', st.candlesMade || 0],
    ['🛒', 'Продаж на рынке', st.sales || 0],
  ];
  return '<h2>Статистика</h2><p class="sub">Строки для могильной доски. Пока только цифры — таблички с именами добавит время.</p><div class="grid">' +
    rows.map((r) => '<div class="card"><h4>' + r[0] + ' ' + r[1] + '</h4><p class="meta" style="font-size:18px"><b>' + r[2] + '</b></p></div>').join('') + '</div>';
}
```

## Graveyard/js/screens/craft.js
```
// РЕМЕСЛО И ЛАБОРАТОРИЯ — вёрстка tCraft/tLab монолита (адаптация только в рендере)
import { S, have } from '../core/state.js';
import { needCheck } from '../data/needs.js';

// монолитный btn, переписанный под data-action (стандарт 6.0)
function cbtn(arg, label, cls, need) {
  const c = needCheck(need);
  const dis = c.ok ? '' : 'disabled';
  return '<button class="btn ' + (cls || '') + '" ' + dis + ' data-action="craft" data-arg="' + arg + '">' + label + '</button>' + (c.ok ? '' : '<div class="why">' + c.w + '</div>');
}

export function initCraft() {
  let h = '<h2>Ремесло</h2><p class="sub">Верстак, ступка и — если повезёт с технологией — собственная печь. Руки помнят работу дядюшки, голова — уже твоя.</p>';
  if (S.techs.oven) h += '<div class="card" style="margin-bottom:12px"><h4>🔥 Печь (своя)</h4><p class="meta">Жир ×2 → Воск ×1. Дым пахнет мёдом и чуть-чуть тайной.</p>' + cbtn('wax', 'Перетопить жир', 'gold', [['fat', 2], ['e', 3]]) + '</div>';
  else h += '<div class="card" style="margin-bottom:12px"><h4>🔥 Печь (сломана)</h4><p class="meta">Дядюшкина печь стоит холодная. Изучи «Печной мастер», чтобы топить самому, — или плати Густаву.</p>' + cbtn('wax-gustav', 'Перетопить у Густава (4💰)', '', [['fat', 2], ['e', 3]]) + '</div>';
  h += '<div class="card" style="margin-bottom:12px"><h4>🕯 Верстак</h4><p class="meta">Воск ×1 + Нить ×1 → Свеча ×1.</p>' + cbtn('candle', 'Сделать свечу', 'gold', [['wax', 1], ['thread', 1], ['e', 3]]) + '</div>';
  h += '<div class="card" style="margin-bottom:12px"><h4>🥣 Ступка</h4><p class="meta">Кости ×2 → Костная мука ×1.</p>' + cbtn('flour', 'Молоть кости', 'gold', [['bones', 2], ['e', 2]]) + '</div>';
  h += '<div class="card" style="margin-bottom:12px"><h4>🌱 Садовый стол</h4><p class="meta">Костная мука ×2 + Вода ×1 → Удобрение ×1. Кости уходят в землю — и это честно.</p>' + cbtn('fert', 'Смешать удобрение', 'gold', [['flour', 2], ['water', 1], ['e', 2]]) + '</div>';
  h += '<h3>Употребить</h3><div class="row">';
  if (have('coffee')) h += '<button class="btn green" data-action="use-item" data-arg="coffee">☕ Кофе (+10⚡)</button>';
  if (have('elixir')) h += '<button class="btn green" data-action="use-item" data-arg="elixir">⚗️ Эликсир (+25⚡)</button>';
  if (!have('coffee') && !have('elixir')) h += '<span class="sub" style="margin:0">Ничего бодрящего под рукой. Загляни к Густаву.</span>';
  h += '</div>';
  return h;
}

export function initLab() {
  if (!S.techs.alchemy1) return '<h2>Лаборатория</h2><p class="sub">Дверь заперта. За ней — пыль, реторты и трактат дядюшки. Изучи технологию «Алхимия I».</p>';
  let h = '<h2>Лаборатория</h2><p class="sub">Колбы тихо булькают сами собой — дядюшка ставил их так, что не затихают и по сей день.</p>';
  h += '<div class="grid">';
  h += '<div class="card"><h4>📜 Изучить мозг</h4><p class="meta">Мозг ×1 → Наука ×3. Незваные мысли становятся знаниями.</p>' + cbtn('brain', 'Изучить', 'gold', [['brain', 1], ['e', 4]]) + '</div>';
  h += '<div class="card"><h4>🖋 Чернила</h4><p class="meta">Кровь ×1 + Вода ×1 → Чернила ×1.</p>' + cbtn('ink', 'Сварить чернила', 'gold', [['blood', 1], ['water', 1], ['e', 2]]) + '</div>';
  if (S.techs.alchemy2) {
    h += '<div class="card"><h4>⚗ Эликсир</h4><p class="meta">Цветы ×2 + Вода ×2 → Эликсир ×1 (+25⚡). Секрет — в настое, а не в составляющих.</p>' + cbtn('elixir', 'Сварить эликсир', 'gold', [['flowers', 2], ['water', 2], ['e', 3]]) + '</div>';
    h += '<div class="card"><h4>🧴 Бальзам</h4><p class="meta">Вода ×2 + Цветы ×2 → Бальзам ×1 (+3 к похоронам).</p>' + cbtn('balsam', 'Сварить бальзам', 'gold', [['water', 2], ['flowers', 2], ['e', 3]]) + '</div>';
  } else h += '<div class="card tech-done"><h4>⚗ Эликсир</h4><p class="meta">Нужна технология «Алхимия II». Трактат дядюшки обрывается на середине страницы.</p></div>';
  h += '</div>';
  return h;
}

```

## Graveyard/js/screens/crow.js
```
// ЭКРАН ВОРОНА — вёрстка tCrow монолита (адаптация: Math.random -> rng, btn -> cbtn).
import { S } from '../core/state.js';
import { RAVEN_LINES } from '../data/texts.js';
import { ITEMS } from '../data/items.js';
import { orderReady } from '../data/crow.js';
import { rng } from '../core/rng.js';

function cbtn(arg, label, cls) {
  return '<button class="btn ' + (cls || '') + '" data-action="' + arg + '">' + label + '</button>';
}

export function initCrow() {
  if (!S.crow.active) {
    return '<h2>Ворон</h2><p class="sub">На ограде сидит важная птица и смотрит сквозь тебя. Пока она считает, что ты мелкая сошка, заказов не будет. Набери 10 репутации — и она присмотрится.</p>';
  }
  let h = '<h2>Ворон</h2><p class="flavor">' + RAVEN_LINES[Math.floor(rng.next() * RAVEN_LINES.length)] + '</p>';
  if (!S.crow.order) h += '<p class="sub">Ворон приносит заказы время от времени. Пока — только карает взглядом.</p>';
  else {
    const o = S.crow.order;
    const need = Object.keys(o.need).map(r => ITEMS[r].i + ' ' + o.need[r] + '/' + (S.res[r] || 0)).join(', ');
    h += '<div class="card"><h4>📦 Заказ: «' + o.n + '»</h4><p class="meta">Нужно: ' + need + '</p>';
    h += '<p class="meta">Награда: ' + Object.keys(o.reward).map(r => (r === 'coins' ? '💰' : r === 'science' ? '📜' : r === 'rep' ? '⭐' : '') + ' ' + o.reward[r]).join(', ') + '</p>';
    h += cbtn('crow-order', 'Сдать заказ', 'green');
    h += '</div>';
  }
  return h;
}

```

## Graveyard/js/screens/graveyard.js
```
import { S } from '../core/state.js';
import { digCost } from '../data/places.js';

// экраны группы graveyard: graveyard, forest, garden
export function initGraveyard() {
  const cleared = S.gravesOpened || 0;
  const clearBtn = cleared >= 20
    ? '<p>Простор достигнут: все 20 участков уже расчистены.</p>'
    : '<button data-action="buy-grave">Расчистить участок (30\u0440)</button>'.replace('30\u0440','30\U0001F4B0');
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

```

## Graveyard/js/screens/market.js
```
import { S } from '../core/state.js';
import { ITEMS, INV } from '../data/items.js';
import { MARKET, sellPrice, buys } from '../data/market.js';
import { TECHS } from '../data/techs.js';
import { fmt } from '../core/state.js';
import { needCheck } from '../data/needs.js';

export function initMarket() {
  const shop = Object.entries(MARKET).map(([id, price]) => {
    const it = ITEMS[id] || { i: '', n: id };
    return `<div class="row"><span>${it.i} ${it.n} — ${fmt(price)}💰</span>
      <span><button data-action="buy" data-item="${id}" data-price="${price}">×1</button>
      <button data-action="buy" data-item="${id}" data-price="${price}" data-n="5">×5</button></span></div>`;
  }).join('');
  const rows = INV.filter((id) => (S.res[id] || 0) > 0)
    .map((id) => {
      const it = ITEMS[id] || { i: '', n: id };
      const p = Math.floor(sellPrice(S, id));
      return `<div class="row"><span>${it.i} ${it.n} ×${S.res[id]}</span>
        <span><button data-action="sell" data-item="${id}">Продать</button>
        <button data-action="sell" data-item="${id}" data-n="5">×5</button></span></div>`;
    }).join('') || '<p>Инвентарь пуст.</p>';
  return `<p>День ${S.day}. Рынок: цены дрейфуют каждый день.</p><h3>Купить у рынка</h3>${shop}<h3>Продать</h3>${rows}`;
}
// вёрстка tTechs монолита: карточки, flavor, живая кнопка «Изучить (N📜)».
// Причуда 5.4 (вечный дизейбл needCheck([['science',cost]])) исправлена — ветка
// science в needs.js теперь честная.
export function initTechs() {
  const rows = TECHS.map((t) => {
    const owned = !!S.techs[t.id];
    let act;
    if (owned) act = '<span class="trend up">\u2713 Изучено</span>';
    else {
      const c = needCheck([['science', t.cost]]);
      const dis = c.ok ? '' : ' disabled';
      act = '<button class="gold"' + dis + ' data-action="learn" data-arg="' + t.id + '">Изучить (' + t.cost + '\u{1F4DC})</button>'
        + (c.ok ? '' : '<div class="why">' + c.w + '</div>');
    }
    return '<div class="card' + (owned ? ' tech-done' : '') + '"><h4>' + t.n + '</h4><p class="meta">' + t.d + '</p><p class="flavor">' + t.f + '</p>' + act + '</div>';
  }).join('');
  return '<h2>Технологии</h2><p class="sub">Наука — ' + S.science + '\u{1F4DC}. Трактат дядюшки открывается страница за страницей.</p><p class="meta">Изучено: ' + Object.keys(S.techs || {}).length + '/' + TECHS.length + '</p><div class="grid">' + rows + '</div>';
}
// лавка Густава: покупка ресурсов дословно (buys) + скупка свечей/воска/плоти/костей/черепа по 0.8
const GUSTAV_BUYS = ['candle', 'wax', 'flesh', 'bones', 'skull'];
export function initGustav() {
  const shop = buys(S).map(([id, price, note]) => {
    const it = ITEMS[id] || { i: '', n: id };
    return `<div class="row"><span>${it.i || ''} ${note} — ${fmt(price)}💰</span>
      <span><button data-action="buy" data-item="${id}" data-price="${price}">Купить</button></span></div>`;
  }).join('');
  const sell = GUSTAV_BUYS.filter((id) => (S.res[id] || 0) > 0).map((id) => {
    const it = ITEMS[id] || { i: '', n: id };
    const p = Math.round(sellPrice(S, id) * .8);
    return `<div class="row"><span>${it.i} ${it.n} ×${S.res[id]} — скупка ${fmt(p)}💰</span>
      <span><button data-action="sell-gustav" data-item="${id}">Продать</button></span></div>`;
  }).join('') || '<p>Густаву пока нечего предложить.</p>';
  return `<p>Густав: «${['Рад видеть тебя, смотритель.'].join('')}»</p><h3>Товар Густава</h3>${shop}<h3>Скупка</h3>${sell}`;
}

```

## Graveyard/js/screens/morgue.js
```
// МОРГ/ВСКРЫТИЕ/ПОХОРОНЫ — вёрстка монолита tMorgue (адаптация только в рендере)
import { S } from '../core/state.js';
import { burialState } from '../data/morgue.js';
import { needCheck } from '../data/needs.js';

export function initMorgue() {
  const cap = S.techs.logistics ? 2 : 1;
  let h = '<h2>Морг</h2><p class="sub">Холодный подвал под церковью. Тела ждут своего часа, но недолго: через два дня они начнут портиться, а инспектор — делать записи в блокнот.</p>';
  h += '<p class="meta">Мест: ' + S.corpses.length + '/' + cap + '. Вскрытие приносит ресурсы и +1 к качеству будущих похорон за каждую процедуру.</p>';
  if (!S.corpses.length) h += '<div class="flavor">Морг пуст. Лавка скрипит от сквозняка, и даже паучок в углу выглядит скучающим.</div>';
  h += '<div class="grid">' + S.corpses.map((c, i) => {
    const star = '\u2605'.repeat(c.stars) + '\u2606'.repeat(5 - c.stars);
    const q = c.extracted ? 'Процедуры: +' + c.extracted + ' к качеству' : '';
    const warn = c.days > 2
      ? '<span class="trend down">\u26A0 Портится! Дней сверх срока: ' + (c.days - 2) + '</span>'
      : '<span class="trend">Свежесть: ещё ' + Math.max(0, 2 - c.days) + ' дн.</span>';
    const cost = S.techs.gentle ? 1 : 2;
    const ex = ['skull', 'brain', 'blood', 'fat', 'bones', 'flesh'].map((r) =>
      '<button data-action="extract" data-n="' + i + '" data-arg="' + r + '">' + ({skull:'Снять череп \u{1F480}',brain:'Извлечь мозг \u{1F9E0}',blood:'Слить кровь \u{1F978}',fat:'Собрать жир \u{1F9D7}',bones:'Вынуть кости \u{1F9B4}',flesh:'Срезать плоть \u{1F969}'}[r]) + ' (' + cost + '\u26A1)</button>').join('');
    let emb;
    if (c.emb) emb = '<p class="meta">\u2713 Бальзамировано</p>';
    else if (!S.techs.embalm) emb = '';
    else {
      const chk = needCheck([['e', 2], ['water', 1], ['fat', 1]]);
      const dis = chk.ok ? '' : ' disabled';
      emb = '<div class="row" style="margin-top:6px"><button class="gold"' + dis + ' data-action="embalm" data-n="' + i + '">\u{1F9F4} Бальзамировать (+1\u2605)</button>'
        + (chk.ok ? '' : '<div class="why">' + chk.w + '</div>') + '</div>';
    }
    return '<div class="card"><h4>Тело: <span style="color:var(--gold)">' + star + '</span></h4><p class="meta">' + q + '</p>' + warn + emb + '<div class="row" style="margin-top:6px">' + ex + '</div></div>';
  }).join('') + '</div>';
  return h;
}

// в монолите морг и вскрытие — один экран; вкладка «Вскрытие» показывает то же
export function initAutopsy() { return initMorgue(); }

export function initBurial() {
  const { bs } = burialState();
  if (bs) return '<p>Похороны уже готовятся — смотри окно обряда.</p>';
  const free = S.graves.map((g, i) => ({ g, i })).filter((x) => x.i < S.gravesOpened && !x.g.occ);
  let h = '<h2>Похороны</h2><p class="sub">Тело из морга, свеча, цветы и бальзам. Чем больше декора и процедур — тем выше качество и репутация.</p>';
  if (!S.corpses.length) h += '<div class="flavor">В морге нет тел — похоронить нечего. Ждём ночную повозку.</div>';
  if (!free.length) h += '<p>Нет свободных расчищенных участков.</p>';
  h += free.map((x) => '<div class="card"><p>Участок №' + (x.i + 1) + ' (ур. ' + x.g.level + ')</p><button class="gold" data-action="open-burial" data-n="' + x.i + '">Похороны \u2709</button></div>').join('');
  return h;
}

```

## Graveyard/js/ui/dialog.js
```
import { S } from '../core/state.js';
export function toast(msg) {
  let zone = document.getElementById('toasts');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'toasts';
    document.body.appendChild(zone);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export function modal(html) {
  // модалка — простой overlay, закрывается по клику на фон
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) wrap.remove();
  });
  document.body.appendChild(wrap);
  return wrap;
}

// sfx — короткий щелчок через WebAudio (заготовка под звук из монолита)
let audioCtx = null;
export function sfx(kind = 'click') {
  try {
    if (S.sound === false) return; // кнопка 🔔 в шапке — как в монолите
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = kind === 'error' ? 180 : 660;
    g.gain.value = 0.05;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.08);
  } catch (e) {}
}

// floatTxt — дословно из монолита (плюющая цифра; Math.random здесь — только позиция DOM)
export function floatTxt(txt) {
  const e = document.createElement('div');
  e.className = 'float';
  e.textContent = txt;
  e.style.right = (30 + Math.random() * 80) + 'px';
  e.style.bottom = '90px';
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1100);
}
```

## Graveyard/js/ui/input.js
```
import { bus } from '../core/bus.js';

// делегирование: один слушатель на весь #app, экшены через data-action
export function bindActions(root) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const d = btn.dataset;
    bus.emit('action', {
      action: d.action,
      arg: d.arg || null,
      item: d.item || null,
      n: d.n ? Number(d.n) : undefined,
      price: d.price ? Number(d.price) : undefined,
    });
  });
  root.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-screen]');
    if (!tab) return;
    e.preventDefault();
    bus.emit('screen', tab.dataset.screen);
  });
}

```

## Graveyard/js/ui/render.js
```
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
```

## Graveyard/js/ui/router.js
```
// единый реестр экранов: массив (одинаковый контракт и в router, и в render)
export const SCREENS = [
  { id: 'graveyard', title: 'Кладбище', group: 'graveyard' },
  { id: 'forest',    title: 'Лес',      group: 'graveyard' },
  { id: 'garden',    title: 'Сад',      group: 'graveyard' },
  { id: 'morgue',    title: 'Морг',     group: 'morgue' },
  { id: 'autopsy',   title: 'Вскрытие', group: 'morgue' },
  { id: 'burial',    title: 'Похороны', group: 'morgue' },
  { id: 'craft',     title: 'Ремесло',   group: 'craft' },
  { id: 'lab',       title: 'Лаборатория', group: 'craft' },
  { id: 'inv',       title: 'Сумка',       group: 'craft' },
  { id: 'market',    title: 'Рынок',    group: 'market' },
  { id: 'techs',     title: 'Технологии', group: 'market' },
  { id: 'gustav',    title: 'Густав',   group: 'market' },
  { id: 'church',    title: 'Церковь',  group: 'church' },
  { id: 'sermons',   title: 'Проповеди', group: 'church' },
  { id: 'stats',     title: 'Статистика', group: 'church' },
  { id: 'crow',      title: 'Ворон',    group: 'crow' },
  { id: 'ach',       title: 'Достижения', group: 'misc' },
  { id: 'log',       title: 'Журнал',   group: 'misc' },
];

export function findScreen(id) {
  return SCREENS.find((s) => s.id === id) || SCREENS[0];
}

```

## Graveyard/package.json
```
{"name": "graveyard-6", "version": "6.0.0", "type": "module"}

```

