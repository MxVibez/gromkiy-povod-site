const programs = {
  little: {
    title: 'Моя первая ёлка',
    age: '2–4 года',
    type: 'игровой спектакль',
    description: 'Зайчонок хочет нарядить свою первую ёлку и просит малышей помочь. Дети достают украшения, повторяют простые движения за героями и вместе зовут Деда Мороза.',
    activities: ['Игры с зайчонком и ёлочными игрушками', 'Хоровод с простыми движениями', 'Родители рядом с детьми'],
  },
  forest: {
    title: 'Чудо в зимнем лесу — неожиданная встреча с Дедом Морозом',
    age: '4–12 лет',
    detailTemplate: 'forest-details',
  },
  quest: {
    title: 'Тайна зимней звезды',
    age: '8–12 лет',
    type: 'командный квест',
    description: 'С ёлки пропала звезда. В мастерской остались карта, шифр и несколько улик. Чтобы собрать их в одну картину, ребятам придётся договориться и поделить задачи.',
    activities: ['Загадки, шифры и поиски по карте', 'Задания на работу в команде', 'Финал у ёлки'],
  },
  group: { title: 'Ёлка для класса или группы' },
  help: { title: 'Нужна помощь с выбором' },
};

const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('[data-program]')];
const filterStatus = document.querySelector('#filter-status');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const flight = document.querySelector('.hero-flight');
if (flight && !reduceMotion.matches && ['', '#top'].includes(location.hash)) {
  flight.src = flight.dataset.src;
  flight.preload = 'auto';
  const hideFlight = () => flight.classList.remove('is-playing');
  flight.addEventListener('playing', () => flight.classList.add('is-playing'));
  flight.addEventListener('ended', hideFlight);
  flight.addEventListener('error', hideFlight);
  flight.addEventListener('timeupdate', () => {
    if (flight.duration - flight.currentTime < .46) hideFlight();
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      flight.pause();
      hideFlight();
    }
  });
  window.setTimeout(() => {
    if (!reduceMotion.matches && flight.getBoundingClientRect().bottom > 0) {
      flight.play().catch(hideFlight);
    }
  }, 480);
}

const filterAnimations = new Map();
for (const button of filters) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const showAll = button.dataset.filter === 'all';
    const [minAge, maxAge] = button.dataset.filter.split('-').map(Number);
    for (const option of filters) option.setAttribute('aria-pressed', String(option === button));
    for (const [index, card] of cards.entries()) {
      filterAnimations.get(card)?.cancel();
      filterAnimations.delete(card);
      const [programMinAge, programMaxAge] = card.dataset.ages.split('-').map(Number);
      card.hidden = !showAll && (programMinAge > maxAge || programMaxAge < minAge);
      if (!card.hidden && !reduceMotion.matches) {
        const animation = card.animate(
          [{ opacity: .65, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 260, delay: showAll ? index * 35 : 0, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' },
        );
        filterAnimations.set(card, animation);
        animation.onfinish = () => filterAnimations.delete(card);
      }
    }
    const visibleTitles = cards.filter(card => !card.hidden).map(card => card.querySelector('h3').textContent);
    filterStatus.textContent = `Программы для выбранного возраста: ${visibleTitles.join(', ')}`;
  });
}

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#main-nav');
function toggleMenu(open) {
  nav.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
menuButton.addEventListener('click', () => toggleMenu(menuButton.getAttribute('aria-expanded') === 'false'));
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) toggleMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    toggleMenu(false);
    menuButton.focus();
  }
});

const dialog = document.querySelector('#holiday-dialog');
const content = document.querySelector('#dialog-content');
const backButton = dialog.querySelector('.dialog-close');
let opener = null;
let previousStep = null;

function renderDialog(template, onBack = null) {
  const source = document.querySelector(`#${template}-template`);
  previousStep = onBack;
  backButton.setAttribute('aria-label', onBack ? 'Назад' : 'Закрыть');
  content.replaceChildren(source.content.cloneNode(true));
  dialog.scrollTop = 0;
}

function focusDialog() {
  if (!dialog.open) dialog.showModal();
  content.querySelector('h2').focus();
}

function showDetails(id) {
  const program = programs[id];
  renderDialog(program.detailTemplate ?? 'details');
  content.querySelector('[data-slot="title"]').textContent = program.title;
  if (!program.detailTemplate) {
    content.querySelector('[data-slot="description"]').textContent = program.description;
    content.querySelector('[data-slot="type"]').textContent = `${program.age} · ${program.type}`;
    const activities = content.querySelector('[data-slot="activities"]');
    for (const activity of program.activities) {
      const item = document.createElement('li');
      item.textContent = activity;
      activities.append(item);
    }
  }
  content.querySelector('[data-open-request]').addEventListener('click', () => showPicker({ format: id }));
  focusDialog();
}

function showFormats(values = {}, onBack = null) {
  renderDialog('formats', onBack);
  const list = content.querySelector('.format-options');
  const template = document.querySelector('#format-choice-template');
  for (const [id, program] of Object.entries(programs)) {
    const row = template.content.cloneNode(true);
    const button = row.querySelector('button');
    row.querySelector('[data-slot="title"]').textContent = program.title;
    const age = row.querySelector('[data-slot="age"]');
    age.textContent = program.age ?? '';
    age.hidden = !program.age;
    if (id === values.format) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => showPicker({ ...values, format: id }));
    list.append(row);
  }
  focusDialog();
}

function showPicker(values) {
  renderDialog('picker', () => showFormats(readDraft()));
  const form = content.querySelector('form');
  const readDraft = () => Object.fromEntries(new FormData(form));
  for (const [key, value] of Object.entries(values)) form.elements.namedItem(key).value = value;
  content.querySelector('[data-selected-format]').textContent = programs[values.format].title;
  form.querySelector('[data-change-format]').addEventListener('click', () => {
    const draft = readDraft();
    showFormats(draft, () => showPicker(draft));
  });
  const age = form.elements.namedItem('age');
  age.addEventListener('input', () => age.setCustomValidity(''));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!age.value.trim()) {
      age.setCustomValidity('Укажите возраст детей.');
      age.reportValidity();
      return;
    }
    showResult(readDraft());
  });
  focusDialog();
}

function showResult(values) {
  renderDialog('result', () => showPicker(values));
  const date = values.date ? new Intl.DateTimeFormat('ru', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(values.date)) : 'готовы обсудить';
  const message = [
    'Здравствуйте! Хочу узнать о детском новогоднем празднике.',
    `Формат: ${programs[values.format].title}`,
    `Возраст детей: ${values.age.trim()}`,
    `Количество детей: ${values.count}`,
    `Желаемая дата: ${date}`,
    values.format === 'forest'
      ? 'Подскажите, пожалуйста, свободные даты и место встречи.'
      : 'Подскажите, пожалуйста, свободные даты, адрес и стоимость.',
  ].join('\n');
  const result = content.querySelector('textarea');
  const status = content.querySelector('.copy-status');
  result.value = message;
  content.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message);
      status.textContent = 'Текст скопирован.';
    } catch {
      result.focus();
      result.select();
      status.textContent = 'Текст выделен. Скопируйте его с помощью меню устройства.';
    }
  });
  content.querySelector('[data-edit]').addEventListener('click', () => showPicker(values));
  focusDialog();
}

for (const button of document.querySelectorAll('[data-details]')) {
  button.addEventListener('click', () => {
    opener = button;
    showDetails(button.dataset.details);
  });
}
for (const link of document.querySelectorAll('[data-picker]')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    opener = link;
    if (link.dataset.picker) showPicker({ format: link.dataset.picker });
    else showFormats();
  });
}
backButton.addEventListener('click', () => {
  if (previousStep) previousStep();
  else dialog.close();
});
dialog.addEventListener('close', () => {
  previousStep = null;
  content.replaceChildren();
  opener?.focus();
  opener = null;
});
