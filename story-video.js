(() => {
  const shell = document.querySelector('.story__video');
  if (!shell) return;

  const figure = shell.closest('.story__scene');
  const transport = figure.querySelector('.story__transport');
  const overlay = shell.querySelector('.story__play');
  const toggle = transport.querySelector('.story__toggle');
  const seek = transport.querySelector('.story__seek');
  const time = transport.querySelector('.story__time');
  const mute = transport.querySelector('.story__mute');
  const fullscreen = transport.querySelector('.story__fullscreen');
  const video = shell.querySelector('#story-video-player');
  const embedUrl = 'https://players.brightcove.net/6415858730001/default_default/index.html?videoId=6384960205112';
  let player;
  let fallbackActive = false;
  let ready = false;

  function fallback() {
    if (fallbackActive || ready) return;
    fallbackActive = true;
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = 'Vídeo real do acidente na BR-282';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    shell.replaceChildren(iframe);
    overlay.hidden = true;
    transport.hidden = true;
    shell.dataset.player = 'external-fallback';
  }

  const loadTimeout = setTimeout(fallback, 12000);
  if (!window.videojs) {
    clearTimeout(loadTimeout);
    fallback();
    return;
  }

  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return '--:--';
    const whole = Math.floor(Math.max(0, seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  };

  try {
    player = window.videojs.getPlayer(video.id);
    player.ready(() => {
      if (fallbackActive) return;
      clearTimeout(loadTimeout);
      ready = true;
      shell.dataset.player = 'custom';
      player.controls(false);
      transport.hidden = false;

      function sync() {
        const duration = Number(player.duration());
        const current = Number(player.currentTime()) || 0;
        const hasDuration = Number.isFinite(duration) && duration > 0;
        const played = hasDuration ? Math.min(100, current / duration * 100) : 0;
        seek.value = String(Math.round(played * 10));
        seek.style.setProperty('--played', `${played}%`);
        seek.disabled = !hasDuration;
        time.value = `${formatTime(current)} / ${formatTime(duration)}`;
        const playing = !player.paused() && !player.ended();
        shell.classList.toggle('is-playing', playing);
        toggle.textContent = playing ? 'Ⅱ' : '▶';
        toggle.setAttribute('aria-label', playing ? 'Pausar vídeo' : 'Reproduzir vídeo');
        overlay.setAttribute('aria-label', player.ended() ? 'Rever vídeo do acidente' : 'Reproduzir vídeo do acidente');
        mute.textContent = player.muted() ? 'SOM OFF' : 'SOM ON';
        mute.setAttribute('aria-label', player.muted() ? 'Ativar som do vídeo' : 'Silenciar vídeo');
      }

      function togglePlayback() {
        if (player.paused() || player.ended()) {
          if (player.ended()) player.currentTime(0);
          const started = player.play();
          if (started?.catch) started.catch(() => sync());
        } else player.pause();
      }

      overlay.addEventListener('click', togglePlayback);
      toggle.addEventListener('click', togglePlayback);
      seek.addEventListener('input', () => {
        const duration = Number(player.duration());
        if (Number.isFinite(duration) && duration > 0) player.currentTime(Number(seek.value) / 1000 * duration);
        sync();
      });
      mute.addEventListener('click', () => { player.muted(!player.muted()); sync(); });
      fullscreen.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await figure.requestFullscreen();
        } catch (error) { console.warn('Tela cheia indisponível:', error.message); }
      });

      ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'seeked', 'volumechange'].forEach(event => player.on(event, sync));
      player.on('error', () => {
        if (player.error()) console.warn('O player do vídeo não conseguiu reproduzir o registro.');
      });
      sync();
      if (shell.dataset.autoplay === 'true') togglePlayback();
    });
  } catch (error) {
    clearTimeout(loadTimeout);
    console.warn('Controles personalizados indisponíveis:', error.message);
    fallback();
  }
})();
