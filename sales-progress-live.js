(() => {
  const liveUrl = 'https://bmw-killer-harlao-sales-api.gabreujusto.chatgpt.site/sales';
  const feedUrl = 'https://raw.githubusercontent.com/gabreujusto-png/bmw-killer-harlao-sales-feed/main/sales.json';
  let request = 0;
  let started = false;
  let lastPaid = null;

  function captionFor(paid) {
    return `${paid} de 1.000 bonés vendidos com pagamento confirmado.`;
  }

  function render(panel) {
    if (lastPaid === null) return;
    const track = panel.querySelector('.numbers__sales-progress-track');
    const amount = panel.querySelector('.numbers__sales-progress-percent');
    const caption = panel.querySelector('.numbers__sales-progress-caption');
    const fill = track?.querySelector('span');
    if (!track || !fill || !amount || !caption) return;
    const percent = lastPaid / 10;
    const percentText = `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(percent)}%`;
    if (amount.textContent !== percentText) amount.textContent = percentText;
    if (track.getAttribute('aria-valuenow') !== String(percent)) track.setAttribute('aria-valuenow', String(percent));
    if (fill.style.width !== `${percent}%`) fill.style.width = `${percent}%`;
    if (caption.textContent !== captionFor(lastPaid)) caption.textContent = captionFor(lastPaid);
    if (panel.hidden) panel.hidden = false;
  }

  function apply(panel, data, current, source) {
    if (current !== request || data.total !== 1000 || !Number.isInteger(data.paid) ||
        data.paid < 0 || data.paid > 1000) return;
    // O feed pode estar alguns minutos atrás da consulta direta.
    if (source === 'feed' && lastPaid !== null && data.paid < lastPaid) return;
    lastPaid = data.paid;
    render(panel);
  }

  async function refresh() {
    const root = document.querySelector('#numeros[data-sales-enabled="true"]');
    const panel = root?.querySelector('.numbers__sales-progress');
    if (!panel) return;
    const current = ++request;
    const feed = fetch(`${feedUrl}?v=${Date.now()}`, { cache: 'no-store', credentials: 'omit' })
      .then((response) => { if (!response.ok) throw new Error('feed_unavailable'); return response.json(); })
      .then((data) => apply(panel, data, current, 'feed'))
      .catch(() => {});
    const live = fetch(liveUrl, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(45000) })
      .then((response) => { if (!response.ok) throw new Error('live_unavailable'); return response.json(); })
      .then((data) => apply(panel, data, current, 'live'))
      .catch(() => {});
    await Promise.all([feed, live]);
  }

  function start() {
    const panel = document.querySelector('#numeros[data-sales-enabled="true"] .numbers__sales-progress');
    if (started || !panel) return false;
    started = true;
    // O zero no HTML é apenas um marcador de carregamento, não uma venda confirmada.
    const observer = new MutationObserver(() => render(panel));
    observer.observe(panel, { childList: true, characterData: true, attributes: true, subtree: true });
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.setInterval(() => { if (!document.hidden) refresh(); }, 60000);
    return true;
  }

  if (!start()) {
    const observer = new MutationObserver(() => { if (start()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
