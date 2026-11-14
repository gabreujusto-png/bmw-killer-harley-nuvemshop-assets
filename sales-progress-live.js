(() => {
  const feedUrl = 'https://api.github.com/repos/gabreujusto-png/bmw-killer-harlao-sales-feed/contents/sales.json?ref=main';
  let inFlight = false;
  let started = false;
  let lastPaid = null;
  let lastBucket = -1;

  function captionFor(paid) {
    return `${paid} de 1.000 bonés vendidos com pagamento confirmado.`;
  }

  function render(panel) {
    const track = panel.querySelector('.numbers__sales-progress-track');
    const amount = panel.querySelector('.numbers__sales-progress-percent');
    const caption = panel.querySelector('.numbers__sales-progress-caption');
    const fill = track?.querySelector('span');
    if (!track || !fill || !amount || !caption) return;
    if (lastPaid === null) {
      if (amount.textContent !== '—') amount.textContent = '—';
      if (caption.textContent !== 'Atualizando vendas confirmadas...') {
        caption.textContent = 'Atualizando vendas confirmadas...';
      }
      track.removeAttribute('aria-valuenow');
      fill.style.width = '0%';
    } else {
      const percent = lastPaid / 10;
      const percentText = `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(percent)}%`;
      if (amount.textContent !== percentText) amount.textContent = percentText;
      if (track.getAttribute('aria-valuenow') !== String(percent)) track.setAttribute('aria-valuenow', String(percent));
      if (fill.style.width !== `${percent}%`) fill.style.width = `${percent}%`;
      if (caption.textContent !== captionFor(lastPaid)) caption.textContent = captionFor(lastPaid);
    }
    if (panel.hidden) panel.hidden = false;
  }

  async function refresh() {
    const panel = document.querySelector('#numeros[data-sales-enabled="true"] .numbers__sales-progress');
    if (!panel) return;
    if (inFlight) return;
    const bucket = Math.floor(Date.now() / 120000);
    if (bucket === lastBucket) return;
    inFlight = true;
    try {
      const response = await fetch(`${feedUrl}&window=${bucket}`, {
        cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000),
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) throw new Error('sales_feed_unavailable');
      const file = await response.json();
      if (file.type !== 'file' || file.encoding !== 'base64' || typeof file.content !== 'string') {
        throw new Error('sales_feed_invalid_file');
      }
      const data = JSON.parse(atob(file.content.replace(/\s/g, '')));
      if (data.total !== 1000 || !Number.isInteger(data.paid) ||
          data.paid < 0 || data.paid > 1000 ||
          !Array.isArray(data.numbers) || data.numbers.length !== data.paid ||
          new Set(data.numbers).size !== data.paid) {
        throw new Error('sales_feed_invalid');
      }
      lastPaid = data.paid;
      lastBucket = bucket;
      render(panel);
    } catch (_) {
      // Conserva o último total auditado nesta aba quando houver falha temporária.
    } finally {
      inFlight = false;
    }
  }

  function start() {
    const panel = document.querySelector('#numeros[data-sales-enabled="true"] .numbers__sales-progress');
    if (started || !panel) return false;
    started = true;
    render(panel);
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    const untilNextWindow = 120000 - Date.now() % 120000 + 500;
    window.setTimeout(() => {
      if (!document.hidden) refresh();
      window.setInterval(() => { if (!document.hidden) refresh(); }, 120000);
    }, untilNextWindow);
    return true;
  }

  if (!start()) {
    const observer = new MutationObserver(() => { if (start()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
