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
