(() => {
  const root = document.querySelector('#numeros');
  if (!root) return;

  const grid = root.querySelector('.numbers__grid');
  const previous = root.querySelector('.numbers__prev');
  const next = root.querySelector('.numbers__next');
  const pageLabel = root.querySelector('.numbers__page-label');
  const search = root.querySelector('#number-search');
  const find = root.querySelector('.numbers__find');
  const selectionCard = root.querySelector('.numbers__selection');
  const selectedOutput = root.querySelector('#selected-number');
  const message = root.querySelector('#number-message');
  const buy = root.querySelector('.numbers__buy');
  const buyNote = root.querySelector('.numbers__buy-note');
  const certificate = (root.dataset.certificate || '').trim();
  let regulationUrl = null;
  try {
    regulationUrl = new URL(root.dataset.regulationUrl || '');
    if (regulationUrl.protocol !== 'https:') regulationUrl = null;
  } catch (_) { /* Regulamento ainda não publicado. */ }
  const salesEnabled = root.dataset.salesEnabled === 'true';
  const apiBase = 'https://storefront-api.tiendanube.com';
  const storeId = 5377099;
  const productId = 379154691;
  const pageSize = 50;
  const total = 1000;
  const firstNumber = 0;
  const lastNumber = total - 1;
  const formatNumber = (value) => String(value).padStart(3, '0');
  const arrowIcon = '<svg class="ui-icon ui-icon--arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 19 19 5M7 5h12v12"/></svg>';
  let page = 0;
  const selected = new Set();
  const selectedList = document.createElement('div');
  selectedList.className = 'numbers__chosen-list';
  selectedList.setAttribute('aria-label', 'Números escolhidos');
  selectedOutput.after(selectedList);
  let variants = null;
  let busy = false;
  let availabilityRequestId = 0;

  async function jsonRequest(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, { credentials: 'omit', ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.error?.code || `HTTP ${response.status}`);
      error.status = response.status;
      error.reason = body?.error?.details?.reason;
      throw error;
    }
    return body;
  }

  async function fetchVariants() {
    const product = await jsonRequest(`/2026-11/stores/${storeId}/products/${productId}?fields=id,variants.id,variants.product_id,variants.values,variants.price,variants.promotional_price,variants.stock_management,variants.stock`, { cache: 'no-store' });
    if (product.id !== productId) throw new Error('wrong_campaign_product');
    const byNumber = new Map();
    for (const variant of product.variants || []) {
      const number = Number(variant.values?.[0]);
      if (!Number.isInteger(number) || number < firstNumber || number > lastNumber ||
          variant.values?.[0] !== formatNumber(number) ||
          variant.product_id !== productId || Number(variant.price) !== 179 ||
          variant.promotional_price !== null || variant.stock_management !== true ||
          !Number.isInteger(variant.stock) || variant.stock < 0 || variant.stock > 1 ||
          byNumber.has(number)) throw new Error('invalid_campaign_catalog');
      byNumber.set(number, variant);
    }
    if (byNumber.size !== total) throw new Error('incomplete_campaign_catalog');
    return byNumber;
  }

  function isAvailable(value) {
    return !!variants?.get(value) && Number(variants.get(value).stock) > 0;
  }

  function updateSelectedDisplay() {
    selectedOutput.textContent = selected.size ? String(selected.size).padStart(2, '0') : '—';
    const fragment = document.createDocumentFragment();
    for (const number of [...selected].sort((a, b) => a - b)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.dataset.removeNumber = String(number);
      chip.textContent = `${formatNumber(number)} ×`;
      chip.setAttribute('aria-label', `Remover número ${formatNumber(number)}`);
      if (salesEnabled && variants && !isAvailable(number)) chip.dataset.unavailable = 'true';
      chip.disabled = busy;
      fragment.append(chip);
    }
    selectedList.replaceChildren(fragment);
    buy.innerHTML = selected.size > 1
      ? `IR AO CHECKOUT · R$ ${selected.size * 179} ${arrowIcon}`
      : `COMPRAR BONÉ · R$ 179 ${arrowIcon}`;
  }

  function updateSelectionMessage() {
    updateSelectedDisplay();
    if (!selected.size) {
      buy.disabled = true;
      message.textContent = salesEnabled && variants ? 'Digite ou toque em um número para começar. Você pode escolher mais de um.' : 'Digite ou toque em um número para visualizá-lo.';
      return;
    }
    if (!salesEnabled) {
      message.textContent = `${selected.size} número${selected.size > 1 ? 's' : ''} mostrado${selected.size > 1 ? 's' : ''} nesta prévia. Nenhum está reservado.`;
      buy.disabled = true;
    } else if (!variants) {
      message.textContent = 'A consulta de disponibilidade está indisponível no momento. Tente novamente em instantes.';
      buy.disabled = true;
    } else if ([...selected].some((number) => !isAvailable(number))) {
      message.textContent = 'Um dos números escolhidos ficou indisponível. Remova o número riscado para continuar.';
      buy.disabled = true;
    } else {
      message.textContent = `${selected.size} número${selected.size > 1 ? 's' : ''} ${selected.size > 1 ? 'disponíveis' : 'disponível'} agora. Confira todos no checkout da Nuvemshop.`;
      buy.disabled = busy;
    }
  }

  function activateLiveCopy() {
    document.title = 'Boné Harlão do Agro + Harley Iron Harvest | BMW KILLER';
    document.querySelector('meta[name="description"]').content = 'Compre o boné Harlão do Agro por R$ 179, escolha seu número e concorra à Harley Iron Harvest reconstruída pela BMW Killer.';
    document.querySelector('.hero__lead').textContent = 'Compre o boné Harlão do Agro por R$ 179, escolha seu número e concorra à Iron Harvest após a confirmação do pagamento na Nuvemshop.';
    document.querySelector('.hero__action').firstChild.textContent = 'ESCOLHER BONÉ + NÚMERO ';
    document.querySelector('.hero__availability').textContent = 'NÚMEROS DE 000 A 999 · COMPRA NA NUVEMSHOP';
    root.querySelector('.numbers__heading .section-index').lastChild.textContent = ' ESCOLHA SEU NÚMERO';
    root.querySelector('.numbers__heading > p:not(.numbers__eyebrow)').textContent = 'Escolha seu número, compre o boné Harlão do Agro por R$ 179 na Nuvemshop e, após o pagamento confirmado, concorra à Harley Iron Harvest.';
    root.querySelector('.numbers__notice strong').textContent = 'COMPRA NA NUVEMSHOP';
    root.querySelector('.numbers__notice span').textContent = `${[...variants.values()].filter((variant) => variant.stock === 1).length} de 1000 números disponíveis agora. Os indisponíveis continuam na lista para consulta.`;
    root.querySelector('.numbers__steps').setAttribute('aria-label', 'Como participar');
    root.querySelector('.numbers__selection > div:first-child span').textContent = 'NÚMEROS ESCOLHIDOS';
    root.querySelector('.numbers__steps > div:nth-child(2) span').textContent = 'Boné Harlão do Agro · R$ 179 por boné. A compra paga participa da ação.';
    root.querySelector('.numbers__steps > div:nth-child(3) span').textContent = 'Finalize o pedido e aguarde a confirmação do pagamento.';
    root.querySelector('.numbers__price small').textContent = 'POR BONÉ · CHECKOUT NUVEMSHOP';
    root.querySelector('.numbers__product-copy > small').textContent = 'O número escolhido aparece como variação do boné no seu pedido.';
    root.querySelector('.numbers__browse p').textContent = 'Toque nos números para adicioná-los ou removê-los. Contorno e X vermelho indicam indisponibilidade.';
    root.querySelector('.numbers__fineprint').textContent = 'O carrinho não reserva estoque. Se outra pessoa finalizar antes, escolha outro número.';
    if (certificate && regulationUrl) {
      root.querySelector('.numbers__legal strong').textContent = `Certificado de Autorização nº ${certificate}`;
      root.querySelector('.numbers__legal a').href = regulationUrl.href;
      root.querySelector('.numbers__legal').hidden = false;
    }
    document.querySelector('.finale__content p').textContent = 'O boné Harlão do Agro é seu. Sua compra paga também participa da ação da Harley Iron Harvest. Escolha seu número e siga para a Nuvemshop.';
    document.querySelector('.finale__actions a').href = '#numeros';
    document.querySelector('.finale__actions a').firstChild.textContent = 'ESCOLHER BONÉ + NÚMERO ';
    document.querySelector('.finale__actions small').lastChild.textContent = ' COMPRA NA NUVEMSHOP';
    buyNote.textContent = 'PAGAMENTO SEGURO NA NUVEMSHOP';
  }

  async function refreshAvailability() {
    if (!salesEnabled || busy) return;
    const requestId = ++availabilityRequestId;
    try {
      const currentVariants = await fetchVariants();
      if (requestId !== availabilityRequestId || busy) return;
      variants = currentVariants;
      activateLiveCopy();
      renderGrid();
      updateSelectionMessage();
    } catch (error) {
      if (requestId !== availabilityRequestId || busy) return;
      variants = null;
      renderGrid();
      buy.disabled = true;
      message.textContent = 'A consulta de disponibilidade está indisponível no momento. Tente novamente em instantes.';
    }
  }

  async function startCheckout() {
    if (!salesEnabled || !variants || !selected.size || busy) return;
    const numbers = [...selected].sort((a, b) => a - b);
    busy = true;
    availabilityRequestId += 1;
    let failure = null;
    let unavailable = false;
    buy.disabled = true;
    buy.textContent = 'CONFERINDO NÚMEROS…';
    try {
      variants = await fetchVariants();
      if (numbers.some((number) => !isAvailable(number))) throw new Error('number_unavailable');
      const cart = await jsonRequest(`/unstable/stores/${storeId}/carts`, { method: 'POST' });
      if (!cart.id) throw new Error('cart_mismatch');
      let cartWithItems = cart;
      for (const number of numbers) {
        cartWithItems = await jsonRequest(`/unstable/stores/${storeId}/carts/${encodeURIComponent(cart.id)}/line-items`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId, variant_id: variants.get(number).id, quantity: 1 })
        });
      }
      const lines = cartWithItems.line_items || [];
      const exactLines = lines.length === numbers.length && numbers.every((number) => {
        const matching = lines.filter((line) => line.variant_id === variants.get(number).id);
        const line = matching[0];
        return matching.length === 1 && line?.product_id === productId && line?.quantity === 1 &&
          line?.variant_values?.[0] === formatNumber(number) && Number(line?.cost?.unit_price) === 179;
      });
      if (cartWithItems.currency !== 'BRL' || cartWithItems.total_quantity !== numbers.length ||
          !exactLines || Number(cartWithItems.cost?.total) !== 179 * numbers.length) {
        throw new Error('cart_mismatch');
      }
      const checkout = await jsonRequest(`/unstable/stores/${storeId}/carts/${encodeURIComponent(cart.id)}/checkout`, { method: 'POST' });
      const url = new URL(checkout.checkout_url);
      if (url.protocol !== 'https:') throw new Error('invalid_checkout_url');
      window.dispatchEvent(new CustomEvent('harley:checkout', { detail: { stage: 'redirect', numbers: numbers.map(formatNumber) } }));
      window.location.assign(url.href);
    } catch (error) {
      failure = error;
      unavailable = error.message === 'number_unavailable' ||
        (error.message === 'line_item_rejected' && ['out_of_stock', 'unavailable', 'variant_not_found'].includes(error.reason));
      if (unavailable) window.setTimeout(refreshAvailability, 500);
    } finally {
      busy = false;
      updateSelectedDisplay();
      if (failure) {
        window.dispatchEvent(new CustomEvent('harley:checkout', { detail: { stage: 'failed', reason: unavailable ? 'unavailable' : failure.message } }));
        message.textContent = unavailable
          ? 'Um dos números ficou indisponível. Revise sua seleção e tente novamente.'
          : failure.message === 'cart_mismatch'
            ? 'O valor ou o número no carrinho não conferiu. A compra foi interrompida.'
            : 'Não foi possível abrir o pagamento. Tente novamente em instantes.';
        buy.disabled = unavailable || failure.message === 'cart_mismatch' || !variants || numbers.some((number) => !isAvailable(number));
      }
    }
  }

  function renderGrid() {
    const fragment = document.createDocumentFragment();
    const first = page * pageSize;
    const last = Math.min(first + pageSize - 1, lastNumber);
    for (let value = first; value <= last; value += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = formatNumber(value);
      button.dataset.number = String(value);
      button.setAttribute('aria-label', salesEnabled && variants
        ? `Número ${formatNumber(value)} ${isAvailable(value) ? 'disponível' : 'indisponível'}`
        : `Ver número ${formatNumber(value)}`);
      button.setAttribute('aria-pressed', String(selected.has(value)));
      button.dataset.availability = salesEnabled && variants
        ? (isAvailable(value) ? 'available' : 'unavailable') : 'preview';
      button.disabled = salesEnabled && !variants;
      fragment.append(button);
    }
    grid.replaceChildren(fragment);
    pageLabel.textContent = `${formatNumber(first)} A ${formatNumber(last)}`;
    previous.disabled = page === 0;
    next.disabled = last === lastNumber;
  }

  function setPage(nextPage) {
    page = Math.max(0, Math.min(nextPage, Math.ceil(total / pageSize) - 1));
    renderGrid();
  }

  function selectNumber(value, scrollToResult = false) {
    if (busy) return;
    if (salesEnabled && variants && !isAvailable(value) && !selected.has(value)) {
      message.textContent = `O número ${formatNumber(value)} está indisponível. Escolha outro.`;
      search.value = formatNumber(value);
      setPage(Math.floor(value / pageSize));
      return;
    }
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    search.value = formatNumber(value);
    search.removeAttribute('aria-invalid');
    updateSelectionMessage();
    setPage(Math.floor(value / pageSize));
    if (scrollToResult) {
      selectionCard.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }

  function findNumber() {
    if (busy) return;
    const raw = search.value.trim();
    const value = Number(raw);
    if (!/^\d{1,3}$/.test(raw) || !Number.isInteger(value) || value < firstNumber || value > lastNumber) {
      message.textContent = 'Digite um número de 000 a 999 para continuar.';
      search.setAttribute('aria-invalid', 'true');
      search.focus();
      return;
    }
    selectNumber(value);
  }

  previous.addEventListener('click', () => setPage(page - 1));
  next.addEventListener('click', () => setPage(page + 1));
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-number]');
    if (button) selectNumber(Number(button.dataset.number), true);
  });
  selectedList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-remove-number]');
    if (!button || busy) return;
    selected.delete(Number(button.dataset.removeNumber));
    updateSelectionMessage();
    renderGrid();
  });
  find.addEventListener('click', findNumber);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') findNumber();
  });
  buy.addEventListener('click', startCheckout);
  if (salesEnabled) {
    refreshAvailability();
    window.addEventListener('focus', refreshAvailability);
    window.addEventListener('pageshow', refreshAvailability);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshAvailability(); });
    window.setInterval(() => { if (!document.hidden) refreshAvailability(); }, 60000);
  }

  setPage(0);
  const requestedNumber = new URLSearchParams(window.location.search).get('numero');
  if (requestedNumber !== null && /^\d{1,3}$/.test(requestedNumber)) {
    const value = Number(requestedNumber);
    if (value >= firstNumber && value <= lastNumber) selectNumber(value);
  }
})();
