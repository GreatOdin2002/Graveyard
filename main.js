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
