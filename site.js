const eventTitle = document.querySelector('#hero-title').textContent.trim();
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

function showPicker(values = {}) {
  renderDialog('picker');
  const form = content.querySelector('form');
  const readDraft = () => Object.fromEntries(new FormData(form));
  for (const [key, value] of Object.entries(values)) form.elements.namedItem(key).value = value;
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
    `Праздник: ${eventTitle}`,
    `Возраст детей: ${values.age.trim()}`,
    `Количество детей: ${values.count}`,
    `Желаемая дата: ${date}`,
    'Подскажите, пожалуйста, свободные даты и место встречи.',
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

for (const trigger of document.querySelectorAll('[data-picker]')) {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    opener = trigger;
    showPicker();
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
