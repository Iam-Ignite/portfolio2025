/* Modern portfolio interactions — vanilla JS, no dependencies */
(() => {
  'use strict';

  /* ---------- Theme toggle (persisted) ---------- */
  const themeKey = 'fg-theme';
  const root = document.documentElement;
  const stored = localStorage.getItem(themeKey);
  if (stored === 'light' || stored === 'dark') {
    root.setAttribute('data-theme', stored);
  }

  const themeBtn = document.querySelector('[data-theme-toggle]');
  themeBtn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem(themeKey, next);
  });

  /* ---------- Nav scroll state ---------- */
  const nav = document.querySelector('[data-nav]');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer ---------- */
  const drawer = document.querySelector('[data-drawer]');
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const closeDrawer = () => drawer?.classList.remove('open');
  menuBtn?.addEventListener('click', () => drawer?.classList.toggle('open'));
  drawer?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ---------- Active nav highlight via IntersectionObserver ---------- */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (sections.length && navLinks.length) {
    const linkMap = new Map();
    navLinks.forEach((a) => linkMap.set(a.getAttribute('href')?.slice(1), a));

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.remove('active'));
          linkMap.get(id)?.classList.add('active');
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            reveal.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => reveal.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Smooth scroll with easing for anchor links ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const navHeight = () => {
    const v = getComputedStyle(root).getPropertyValue('--nav-h').trim();
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 72;
  };

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let scrollAnim = null;
  const smoothScrollTo = (targetY, duration = 700) => {
    if (scrollAnim) cancelAnimationFrame(scrollAnim);
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      window.scrollTo(0, startY + distance * easeInOutCubic(t));
      if (t < 1) scrollAnim = requestAnimationFrame(step);
    };
    scrollAnim = requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeDrawer();
      const rectTop = target.getBoundingClientRect().top + window.scrollY;
      const offset = navHeight() + 12;
      const targetY = Math.max(0, rectTop - offset);

      if (prefersReducedMotion) {
        window.scrollTo(0, targetY);
      } else {
        const distance = Math.abs(targetY - window.scrollY);
        const duration = Math.min(1100, Math.max(450, distance * 0.45));
        smoothScrollTo(targetY, duration);
      }

      if (history.pushState) history.pushState(null, '', href);

      target.classList.remove('section-arrive');
      void target.offsetWidth;
      target.classList.add('section-arrive');
      setTimeout(() => target.classList.remove('section-arrive'), 1200);
    });
  });

  /* ---------- Footer year ---------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
