(() => {
  const liveUrl = 'https://bmw-killer-harlao-sales-api.gabreujusto.chatgpt.site/sales';
  const fallbackUrl = 'https://raw.githubusercontent.com/gabreujusto-png/bmw-killer-harlao-sales-feed/main/sales.json';
  let request = 0;
  let started = false;
  let lastPaid = null;

  function captionFor(paid) {
    return `${paid} de 1.000 bonés vendidos com pagamento confirmado.`;
  }

  async function refresh() {
    const root = document.querySelector('#numeros[data-sales-enabled="true"]');
    const panel = root?.querySelector('.numbers__sales-progress');
    if (!panel) return;
    const current = ++request;
    try {
      let response;
      try {
        response = await fetch(liveUrl, { cache: 'no-store', credentials: 'omit' });
        if (!response.ok) throw new Error('live_sales_unavailable');
      } catch (_) {
        response = await fetch(`${fallbackUrl}?v=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      }
      if (!response.ok) return;
      const data = await response.json();
      if (current !== request || data.total !== 1000 || !Number.isInteger(data.paid) ||
          data.paid < 0 || data.paid > 1000) return;
      const percent = data.paid / 10;
      const track = panel.querySelector('.numbers__sales-progress-track');
      const amount = panel.querySelector('.numbers__sales-progress-percent');
      const caption = panel.querySelector('.numbers__sales-progress-caption');
      const fill = track?.querySelector('span');
      if (!track || !fill || !amount || !caption) return;
      amount.textContent = `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(percent)}%`;
      track.setAttribute('aria-valuenow', String(percent));
      fill.style.width = `${percent}%`;
      lastPaid = data.paid;
      caption.textContent = captionFor(data.paid);
      panel.hidden = false;
    } catch (_) {
      // Mantém o último total confirmado se a consulta falhar.
    }
  }

  function start() {
    const panel = document.querySelector('#numeros[data-sales-enabled="true"] .numbers__sales-progress');
    if (started || !panel) return false;
    started = true;
    const caption = panel.querySelector('.numbers__sales-progress-caption');
    if (caption) {
      const initialPaid = Number.parseInt(caption.textContent, 10);
      if (Number.isInteger(initialPaid)) {
        lastPaid = initialPaid;
        caption.textContent = captionFor(initialPaid);
      }
      const captionObserver = new MutationObserver(() => {
        if (lastPaid !== null && caption.textContent !== captionFor(lastPaid)) {
          caption.textContent = captionFor(lastPaid);
        }
      });
      captionObserver.observe(caption, { childList: true, characterData: true, subtree: true });
    }
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
