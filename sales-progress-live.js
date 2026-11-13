(() => {
  const liveUrl = 'https://bmw-killer-harlao-sales-api.gabreujusto.chatgpt.site/sales';
  const feedUrl = 'https://raw.githubusercontent.com/gabreujusto-png/bmw-killer-harlao-sales-feed/main/sales.json';
  const cacheKey = 'harlao-paid-confirmed-v1';
  const cacheAgeMs = 10 * 60 * 1000;
  let inFlight = false;
  let feedInFlight = false;
  let lastFeedRequest = 0;
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

  function apply(panel, data) {
    if (data.total !== 1000 || !Number.isInteger(data.paid) ||
        data.paid < 0 || data.paid > 1000) return;
    // Uma resposta antiga de outra instância não pode fazer a barra recuar.
    if (lastPaid !== null && data.paid < lastPaid) return;
    lastPaid = data.paid;
    render(panel);
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ paid: lastPaid, savedAt: Date.now() }));
    } catch (_) { /* A consulta ao vivo continua funcionando sem armazenamento local. */ }
  }

  async function refreshFeed(panel) {
    if (feedInFlight || Date.now() - lastFeedRequest < 60000) return;
    feedInFlight = true;
    lastFeedRequest = Date.now();
    try {
      const response = await fetch(`${feedUrl}?v=${Math.floor(Date.now() / 60000)}`, {
        cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('feed_unavailable');
      apply(panel, await response.json());
    } catch (_) {
      // A consulta direta ou o último total confirmado continuam disponíveis.
    } finally {
      feedInFlight = false;
    }
  }

  async function refresh() {
    const root = document.querySelector('#numeros[data-sales-enabled="true"]');
    const panel = root?.querySelector('.numbers__sales-progress');
    if (!panel) return;
    refreshFeed(panel);
    if (inFlight) return;
    inFlight = true;
    try {
      const response = await fetch(liveUrl, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(75000) });
      if (!response.ok) throw new Error('live_unavailable');
      apply(panel, await response.json());
    } catch (_) {
      // Mantém o último número confirmado; nunca troca por zero quando a rede falha.
    } finally {
      inFlight = false;
    }
  }

  function start() {
    const panel = document.querySelector('#numeros[data-sales-enabled="true"] .numbers__sales-progress');
    if (started || !panel) return false;
    started = true;
    // O zero no HTML é apenas um marcador de carregamento, não uma venda confirmada.
    try {
      const saved = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (saved && Number.isInteger(saved.paid) && saved.paid >= 0 && saved.paid <= 1000 &&
          Number.isFinite(saved.savedAt) && Date.now() - saved.savedAt < cacheAgeMs) {
        lastPaid = saved.paid;
        render(panel);
      }
    } catch (_) { /* A consulta ao vivo preenche a barra. */ }
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
