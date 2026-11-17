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
