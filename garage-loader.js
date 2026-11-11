// Load the showroom only when it is needed. On mobile the real photos remain
// visible until someone explicitly chooses to download the interactive model.
const garageSection = document.querySelector('.garage');
if (garageSection) {
  const activate = garageSection.querySelector('.garage__activate');
  const load = () => import('https://cdn.jsdelivr.net/gh/gabreujusto-png/bmw-killer-harley-nuvemshop-assets@native-v9/garage.js').catch((error) => {
    garageSection.querySelector('.garage__loading').textContent = 'O 3D não abriu neste aparelho. Veja as fotos reais abaixo.';
    activate.disabled = false;
    console.warn('Falha ao carregar o 3D:', error.message);
  });
  if (matchMedia('(max-width: 700px)').matches) {
    activate.addEventListener('click', () => {
      activate.disabled = true;
      activate.textContent = 'CARREGANDO MODELO…';
      garageSection.querySelector('.garage__loading').textContent = 'PREPARANDO A VISUALIZAÇÃO 3D…';
      load();
    });
  } else {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      load();
    }, { rootMargin: '900px' });
    observer.observe(garageSection);
  }
}
