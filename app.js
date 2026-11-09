document.body.classList.add('is-loading');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
const openInitialSection = () => {
  const section = document.getElementById(location.hash.slice(1));
  if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileIntro = window.matchMedia('(max-width: 700px)').matches;
const introVideo = document.querySelector('.intro__video');
let skipRequested=false;
document.querySelector('.intro__skip')?.addEventListener('click',()=>{skipRequested=true;});

async function initMotion() {
  window.scrollTo(0, 0);
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    document.body.classList.add('no-motion');
    document.body.classList.remove('is-loading');
    document.querySelector('.intro')?.remove();
    document.querySelectorAll('.title-line i').forEach((line) => { line.style.transform = 'none'; });
    setTimeout(openInitialSection, 200);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  let introFinished = false;
  let introScene;

  const finishIntro = (quick = false) => {
    if (introFinished) return;
    introFinished = true;
    window.introHasEnded=true;
    introScene?.kill();
    introVideo?.pause();
    window.scrollTo(0, 0);
    document.body.classList.remove('is-loading');

    gsap.timeline({
      onComplete: () => {
        gsap.set('.intro', { display: 'none' });
        ScrollTrigger.refresh();
        setTimeout(openInitialSection, 200);
      }
    })
      .to('.intro', { yPercent: -100, duration: quick ? .48 : .88, ease: 'power4.inOut' })
      .to('.title-line i', { y: 0, duration: 1.05, stagger: .12, ease: 'power4.out' }, '-=.34')
      .from('.reveal-up', { y: 34, opacity: 0, duration: .75, stagger: .1, ease: 'power3.out' }, '-=.7')
      .from('.hero__photo--main', { clipPath: 'polygon(7% 48%,100% 48%,100% 52%,93% 52%,0 52%,0 48%)', duration: 1.05, ease: 'power4.inOut' }, '-=.9');
  };

  document.querySelector('.intro__loading')?.remove();
  if (!introVideo || skipRequested) finishIntro(true);
  else {
    introVideo.preload = 'auto';
    introVideo.play().catch(() => {});
    introScene = gsap.timeline({ onComplete: () => finishIntro(false) });
    introScene
      .from('.intro__meta, .intro__logo, .intro__skip', { opacity: 0, y: -12, duration: .5, stagger: .08 }, 0)
      .to('.intro__scene', { x: -7, duration: .05, repeat: 7, yoyo: true, ease: 'none' }, 2.36)
      .fromTo('.intro__impact', { opacity: 0, scale: .1 }, { opacity: 1, scale: 1.5, duration: .22, ease: 'power2.out' }, 2.36)
      .to('.intro__impact', { opacity: 0, scale: 4, duration: .5 }, 2.57)
      .fromTo('.intro__dust', { opacity: 0, scale: .2 }, { opacity: 1, scale: 1.25, duration: .3 }, 2.33)
      .to('.intro__dust i', { x: () => gsap.utils.random(-260, 280), y: () => gsap.utils.random(-180, 90), opacity: 0, duration: .75, stagger: .025, ease: 'power2.out' }, 2.38)
      .to('.intro__scene, .intro__meta, .intro__logo', { opacity: 0, duration: .56, ease: 'power2.in' }, 4.4)
      .to('.intro__statement', { opacity: 1, duration: .35 }, 4.62)
      .from('.intro__statement > span', { y: 20, opacity: 0, duration: .45, ease: 'power3.out' }, 4.64)
      .from('.intro__statement strong', { y: 72, opacity: 0, clipPath: 'inset(100% 0 0 0)', duration: .85, ease: 'power4.out' }, 4.66)
      .from('.intro__statement small', { opacity: 0, y: 14, duration: .48 }, 5.08)
      .to('.intro__statement strong em', { textShadow: '0 0 42px rgba(255,90,0,.7)', duration: .22, repeat: 1, yoyo: true }, 5.45)
      .to({}, { duration: .7 });
  }

  document.querySelector('.intro__skip')?.addEventListener('click', () => finishIntro(true));

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
// A third-party video or font request must not trap visitors behind the intro.
setTimeout(startMotion, 5000);
