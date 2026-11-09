(() => {
  const figure = document.querySelector('.story__scene');
  if (!figure) return;
  const shell = figure.querySelector('.story__video');
  const overlay = shell.querySelector('.story__play');
  let started = false;

  function loadPlayer() {
    if (started) return;
    started = true;
    const script = document.createElement('script');
    script.src = 'https://players.brightcove.net/6415858730001/default_default/index.min.js';
    script.async = true;
    script.onload = script.onerror = () => import('https://cdn.jsdelivr.net/gh/gabreujusto-png/bmw-killer-harley-nuvemshop-assets@native-v6/story-video.js');
    document.head.append(script);
  }

  overlay.addEventListener('click', () => {
    shell.dataset.autoplay = 'true';
    overlay.classList.add('is-loading');
    overlay.setAttribute('aria-label', 'Carregando vídeo do acidente');
    loadPlayer();
  }, { once: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadPlayer();
    }, { rootMargin: '200px' });
    observer.observe(figure);
  } else loadPlayer();
})();
