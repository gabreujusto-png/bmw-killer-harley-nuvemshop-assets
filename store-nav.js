(() => {
  const button = document.querySelector('.topbar__menu');
  const menu = document.querySelector('.topbar__nav');
  if (!button || !menu) return;

  const close = () => {
    button.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  };

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });
  document.addEventListener('click', (event) => {
    if (!button.contains(event.target) && !menu.contains(event.target)) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', close);
})();
