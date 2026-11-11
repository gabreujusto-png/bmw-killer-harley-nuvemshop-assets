const openInitialSection = () => {
  const section = document.getElementById(location.hash.slice(1));
  if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileIntro = window.matchMedia('(max-width: 700px)').matches;

async function initMotion() {
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    document.body.classList.add('no-motion');
    requestAnimationFrame(openInitialSection);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  gsap.to('.progress i', {
    width: '100%', ease: 'none',
    scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: true }
  });

  if (!mobileIntro) gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 1.15 }
  })
    .to('.hero__photo--main', { yPercent: -8, scale: .96, ease: 'none' }, 0)
    .to('.hero__content', { yPercent: -8, ease: 'none' }, 0)
    .to('.kinetic-grid', { rotation: 2, scale: 1.1, ease: 'none' }, 0)
    .to('.hero__number', { yPercent: -30, ease: 'none' }, 0);

  gsap.fromTo('.story__scene',
    { y: 60, opacity: .3, clipPath: 'inset(0 0 32% 0)' },
    { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', ease: 'power2.out',
      scrollTrigger: { trigger: '.story__scene', start: 'top 95%', end: 'center 60%', scrub: 1 } }
  );

  if (mobileIntro) {
    gsap.from('.impact__words > span', {
      y: 32, opacity: 0, duration: .72, stagger: .13, ease: 'power3.out',
      scrollTrigger: { trigger: '.impact', start: 'top 75%', toggleActions: 'play none none reverse' }
    });
  } else {
    const impactWords = gsap.utils.toArray('.impact__words > span');
    const impactTl = gsap.timeline({
      scrollTrigger: { trigger: '.impact', start: 'top top', end: 'bottom bottom', scrub: 1 }
    });
    impactWords.forEach((word, index) => {
      impactTl
        .fromTo(word, { xPercent: index % 2 ? 48 : -48, opacity: 0, filter: 'blur(10px)' }, { xPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' }, index * .8)
        .to(word, { opacity: index === impactWords.length - 1 ? 1 : .1, duration: .65 }, index * .8 + 1.05);
    });
    impactTl
      .to('.impact__media img', { scale: 1, xPercent: 2, duration: 3.8, ease: 'none' }, 0)
      .to('.impact__logo', { opacity: .62, rotate: -3, duration: 1.2 }, 2.2);
  }

  gsap.fromTo('.rebirth__image img', { scale: 1.12 }, { scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.rebirth__image', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.utils.toArray('.rebirth__details .spec').forEach((card, index) => {
    gsap.from(card, { y: 52, opacity: 0, duration: .9, delay: index * .06, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 95%', toggleActions: 'play none none reverse' } });
  });

  if (!mobileIntro) gsap.to('.finale__media img', {
    scale: 1, yPercent: 4, ease: 'none',
    scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom top', scrub: 1.1 }
  });
  gsap.fromTo('.finale__logo', { rotate: 4, opacity: .15 }, {
    rotate: -2, opacity: .82, ease: 'none',
    scrollTrigger: { trigger: '.finale', start: 'top 85%', end: 'center center', scrub: 1 }
  });

  gsap.utils.toArray('.section-index, .story h2, .story__body, .story__fact, .story__source, .rebirth__intro > *, .details__head > *, .atelier__copy > *, .finale__content > *').forEach((el) => {
    gsap.from(el, {
      y: 56, opacity: 0, duration: 1.05, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 89%', toggleActions: 'play none none reverse' }
    });
  });

  const chapters = [['.hero','01'], ['.story','02'], ['.impact','03'], ['.details','04'], ['.atelier','05'], ['.finale','06']];
  chapters.forEach(([selector, number]) => {
    ScrollTrigger.create({
      trigger: selector, start: 'top center', end: 'bottom center',
      onEnter: () => { document.querySelector('.topbar__chapter span').textContent = number; },
      onEnterBack: () => { document.querySelector('.topbar__chapter span').textContent = number; }
    });
  });

  const cursor = document.querySelector('.cursor');
  const glow = document.querySelector('.cursor-glow');
  window.addEventListener('pointermove', (event) => {
    gsap.to(cursor, { x: event.clientX, y: event.clientY, duration: .18, ease: 'power2.out' });
    gsap.to(glow, { x: event.clientX, y: event.clientY, duration: .75, ease: 'power2.out' });
  });
  document.querySelectorAll('a, button, .detail-card').forEach((target) => {
    target.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
    target.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  });

  ScrollTrigger.refresh();
  requestAnimationFrame(openInitialSection);
}

let motionStarted = false;
function startMotion() {
  if (motionStarted) return;
  motionStarted = true;
  initMotion();
}
if (document.readyState === 'complete') startMotion();
else document.addEventListener('DOMContentLoaded', startMotion, { once: true });
window.addEventListener('load', startMotion, { once: true });
