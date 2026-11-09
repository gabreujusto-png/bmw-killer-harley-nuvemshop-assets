(() => {
  const storageKey = 'harley_analytics_consent_v1';
  const siteId = 'bmw_killer_harley';
  const environment = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'local' : 'preview';
  const panel = document.querySelector('.analytics-consent');
  const settings = document.querySelector('.analytics-settings');
  if (!panel || !settings) return;
  let decision;
  try { decision = localStorage.getItem(storageKey); } catch (_) { decision = null; }
  let ready = false;
  let loading = false;
  let activeSince = document.hidden ? null : performance.now();

  function capture(name, properties = {}) {
    if (ready && decision === 'accept') window.posthog.capture(name, { site_id: siteId, environment, ...properties });
  }

  function observeSections() {
    const observed = new Set();
    const sections = [
      ['inicio', '.hero'], ['numeros', '#numeros'], ['consulta', '#consulta'],
      ['historia', '.story'], ['reconstrucao', '.rebirth'], ['modelo_3d', '.garage'],
      ['detalhes', '.details'], ['bmw_killer', '.atelier'], ['final', '.finale'],
    ];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target.dataset.analyticsSection;
        if (!section || observed.has(section)) continue;
        observed.add(section);
        capture('harley_section_view', { section });
      }
    }, { rootMargin: '-10% 0px -60% 0px' });
    for (const [name, selector] of sections) {
      const element = document.querySelector(selector);
      if (!element) continue;
      element.dataset.analyticsSection = name;
      observer.observe(element);
    }
  }

  function trackInteractions() {
    const search = document.querySelector('#number-search');
    const searchNumber = () => {
      const value = Number(search?.value);
      capture('harley_number_search', { valid: /^\d{1,3}$/.test(search?.value?.trim() || '') && Number.isInteger(value) && value >= 0 && value <= 999 });
    };
    document.querySelector('.numbers__find')?.addEventListener('click', searchNumber);
    search?.addEventListener('keydown', (event) => { if (event.key === 'Enter') searchNumber(); });
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const number = target.closest('.numbers__grid button[data-number]');
      if (number) capture('harley_number_select', { source: 'list', number: number.textContent.trim() });
      if (target.closest('.hero__action, .topbar__status a')) capture('harley_numbers_cta_click');
      if (target.closest('.story__play, .story__toggle')) capture('harley_video_control', { action: 'play_or_pause' });
      if (target.closest('.detail-card, .rebirth__image button')) capture('harley_gallery_open');
      if (target.closest('.garage__activate')) capture('harley_model_3d_open');
      if (target.closest('.intro__skip')) capture('harley_intro_skip');
    });
    window.addEventListener('harley:checkout', (event) => capture('harley_checkout', event.detail || {}));
    window.addEventListener('harley:model', (event) => capture('harley_model_3d_status', event.detail || {}));
  }

  function recordActiveTime() {
    if (activeSince === null) return;
    const seconds = Math.round((performance.now() - activeSince) / 1000);
    activeSince = null;
    if (seconds >= 5) capture('harley_active_time', { seconds });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) recordActiveTime();
    else activeSince = performance.now();
  });
  window.addEventListener('pagehide', recordActiveTime);

  function installPostHog(config) {
    // Official PostHog queue stub. Its SDK is requested only after visitor consent.
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],o='init capture register opt_in_capturing opt_out_capturing stopSessionRecording reset'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(config.token, {
      api_host: config.api_host,
      defaults: '2026-08-30',
      autocapture: true,
      capture_pageview: false,
      capture_pageleave: true,
      capture_heatmaps: true,
      capture_performance: true,
      person_profiles: 'identified_only',
      session_recording: { maskAllInputs: true },
      before_send(event) {
        if (event?.properties) {
          event.properties.site_id = siteId;
          event.properties.environment = environment;
          event.properties.$current_url = location.origin + location.pathname;
          event.properties.$pathname = location.pathname;
          if (event.properties.$referrer) {
            try { const url = new URL(event.properties.$referrer); event.properties.$referrer = url.origin + url.pathname; }
            catch (_) { delete event.properties.$referrer; }
          }
        }
        return event;
      },
      loaded(instance) {
        instance.register({ site_id: siteId, environment });
        ready = true;
        instance.capture('$pageview', { site_id: siteId, environment });
        observeSections();
        trackInteractions();
      },
    });
  }

  async function start() {
    if (loading) { if (ready) window.posthog.opt_in_capturing(); return; }
    loading = true;
    try {
      const response = await fetch('./analytics-config.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('config unavailable');
      const config = await response.json();
      if (!/^phc_[\w-]+$/.test(config.token) || !/^https:\/\/[\w.-]+\.posthog\.com$/.test(config.api_host)) throw new Error('invalid config');
      installPostHog(config);
    } catch (error) { loading = false; console.warn('Métricas indisponíveis:', error.message); }
  }

  function choose(value) {
    decision = value;
    try { localStorage.setItem(storageKey, value); } catch (_) { /* Browser without storage. */ }
    panel.hidden = true;
    document.body.classList.remove('analytics-pending');
    if (value === 'accept') {
      if (ready) window.posthog.opt_in_capturing();
      else start();
    } else if (ready) {
      recordActiveTime();
      window.posthog.stopSessionRecording();
      window.posthog.opt_out_capturing();
      window.posthog.reset();
    }
  }

  panel.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-analytics-choice]');
    if (choice) choose(choice.dataset.analyticsChoice);
  });
  settings.addEventListener('click', () => { panel.hidden = false; document.body.classList.add('analytics-pending'); panel.querySelector('button').focus(); });
  if (decision === 'accept') {
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 });
    else window.addEventListener('load', start, { once: true });
  } else if (decision !== 'reject') {
    panel.hidden = false;
    document.body.classList.add('analytics-pending');
  }
})();
