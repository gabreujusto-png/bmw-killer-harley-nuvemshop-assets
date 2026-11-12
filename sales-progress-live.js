(() => {
  const url = 'https://raw.githubusercontent.com/gabreujusto-png/bmw-killer-harlao-sales-feed/main/sales.json';
  let request = 0;
  let started = false;

  async function refresh() {
    const root = document.querySelector('#numeros[data-sales-enabled="true"]');
    const panel = root?.querySelector('.numbers__sales-progress');
    if (!panel) return;
    const current = ++request;
    try {
      const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) return;
      const data = await response.json();
      if (current !== request || data.total !== 1000 || !Number.isInteger(data.paid) ||
          data.paid < 0 || data.paid > 1000) return;
      const percent = data.paid / 10;
      const track = panel.querySelector('.numbers__sales-progress-track');
      const amount = panel.querySelector('.numbers__sales-progress-percent');
      const caption = panel.querySelector('.numbers__sales-progress-caption');
      if (!track || !amount || !caption) return;
      amount.textContent = `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(percent)}%`;
      track.setAttribute('aria-valuenow', String(percent));
      track.querySelector('span').style.width = `${percent}%`;
      caption.textContent = `${data.paid} de 1.000 números vendidos com pagamento confirmado.`;
      panel.hidden = false;
    } catch (_) {
      // Mantém o último total confirmado se a consulta falhar.
    }
  }

  function start() {
    if (started || !document.querySelector('#numeros[data-sales-enabled="true"] .numbers__sales-progress')) return false;
    started = true;
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
