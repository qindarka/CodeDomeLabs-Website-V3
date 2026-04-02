/**
 * CodeDomeLabs V2 — OPUS PREMIUM EDITION
 * Enhanced interactions: parallax, staggered reveals, refined scroll behavior,
 * intersection-driven animations, counter animation, smooth nav, dark mode,
 * timeline, mobile menu, focus trapping, keyboard navigation.
 * Zero external dependencies. Vanilla JS only.
 */

'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const on = (el, ev, fn, opts) => { if (el) el.addEventListener(ev, fn, opts); };

/** Throttle using rAF */
const rafThrottle = (fn) => {
  let ticking = false;
  return (...args) => {
    if (!ticking) {
      requestAnimationFrame(() => { fn(...args); ticking = false; });
      ticking = true;
    }
  };
};

/** Check for reduced motion preference */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Ease out quad for counter animations */
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

/** Ease out expo */
const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/* ============================================================
   PAGE LOAD TRANSITION
   ============================================================ */
const initPageLoad = () => {
  // Remove loading overlay once DOM + CSS ready
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('loaded');
    });
  });
};

/* ============================================================
   DARK MODE
   ============================================================ */
const THEME_KEY = 'cdl-theme-v2';

const initTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  const toggle = $('#themeToggle');
  if (toggle) {
    const isDark = theme === 'dark';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
};

const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
};

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

/* ============================================================
   NAVIGATION — SCROLL BEHAVIOR (enhanced)
   ============================================================ */
const initNavScroll = () => {
  const header = $('#site-header');
  if (!header) return;

  let lastScrollY = 0;
  let headerHidden = false;

  const update = rafThrottle(() => {
    const scrollY = window.scrollY;

    // Add/remove scrolled class
    if (scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Optional: hide on scroll down, show on scroll up (for mobile feel)
    if (window.innerWidth <= 768) {
      if (scrollY > lastScrollY && scrollY > 200 && !headerHidden) {
        header.style.transform = 'translateY(-100%)';
        headerHidden = true;
      } else if (scrollY < lastScrollY && headerHidden) {
        header.style.transform = 'translateY(0)';
        headerHidden = false;
      }
    } else {
      header.style.transform = '';
      headerHidden = false;
    }

    lastScrollY = scrollY;
  });

  window.addEventListener('scroll', update, { passive: true });
  update();
};

/* ============================================================
   NAVIGATION — MOBILE MENU (enhanced)
   ============================================================ */
const initMobileMenu = () => {
  const toggle = $('#navToggle');
  const menu   = $('#navMenu');
  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';

    // Stagger link animations
    if (!prefersReducedMotion()) {
      $$('.nav-link, .theme-toggle', menu).forEach((link, i) => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(8px)';
        setTimeout(() => {
          link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          link.style.opacity = '1';
          link.style.transform = 'translateY(0)';
        }, 50 + i * 40);
      });
    }
  };

  const close = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';

    // Reset inline styles
    $$('.nav-link, .theme-toggle', menu).forEach(link => {
      link.style.opacity = '';
      link.style.transform = '';
      link.style.transition = '';
    });
  };

  on(toggle, 'click', () => {
    menu.classList.contains('open') ? close() : open();
  });

  $$('.nav-link', menu).forEach(link => on(link, 'click', close));

  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      close();
      toggle.focus();
    }
  });

  on(document, 'click', (e) => {
    const header = $('#site-header');
    if (header && !header.contains(e.target) && menu.classList.contains('open')) {
      close();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) close();
  }, { passive: true });
};

/* ============================================================
   SMOOTH SCROLL — ANCHOR LINKS
   ============================================================ */
const initSmoothScroll = () => {
  const HEADER_OFFSET = 88;

  on(document, 'click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = $(targetId);
    if (!target) return;

    e.preventDefault();

    const targetTop = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });

    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  });
};

/* ============================================================
   TIMELINE — INTERACTIVE TOGGLES (enhanced)
   ============================================================ */
const initTimeline = () => {
  const toggles = $$('.timeline-toggle');

  toggles.forEach(toggle => {
    const bodyId = toggle.getAttribute('aria-controls');
    const body   = bodyId ? $(`#${bodyId}`) : null;
    const card   = toggle.closest('.timeline-card');
    if (!body) return;

    on(toggle, 'click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        toggle.setAttribute('aria-expanded', 'false');
        body.hidden = true;
        card?.setAttribute('aria-expanded', 'false');
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        card?.setAttribute('aria-expanded', 'true');

        // Smooth reveal
        setTimeout(() => {
          const rect = toggle.getBoundingClientRect();
          if (rect.top < 100) {
            window.scrollBy({ top: rect.top - 120, behavior: 'smooth' });
          }
        }, 60);
      }
    });
  });
};

/* ============================================================
   SCROLL REVEAL — Enhanced with stagger & scale variants
   ============================================================ */
const initScrollReveal = () => {
  if (!('IntersectionObserver' in window)) {
    $$('.reveal, .reveal-scale').forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -60px 0px' }
  );

  $$('.reveal, .reveal-scale').forEach(el => observer.observe(el));
};

/**
 * Apply reveal classes — enhanced stagger system.
 * Uses finer delay increments for premium feel.
 */
const applyRevealClasses = () => {
  const revealSets = [
    { selector: '.pillar-card',     base: 'reveal-scale', maxDelay: 3 },
    { selector: '.project-card',    base: 'reveal',       maxDelay: 4 },
    { selector: '.reaction-card',   base: 'reveal',       maxDelay: 6 },
    { selector: '.timeline-entry',  base: 'reveal',       maxDelay: 3 },
    { selector: '.video-card',      base: 'reveal',       maxDelay: 4 },
    { selector: '.trust-logo-item', base: 'reveal',       maxDelay: 3 },
  ];

  revealSets.forEach(({ selector, base, maxDelay }) => {
    $$(selector).forEach((el, i) => {
      el.classList.add(base);
      const delay = Math.min(i, maxDelay);
      if (delay > 0) {
        el.classList.add(`reveal-delay-${delay}`);
      }
    });
  });

  // Section headers with scale reveal
  $$('.section-header').forEach(el => el.classList.add('reveal-scale'));

  // Single blocks
  ['.reaction-featured', '.connect-content'].forEach(sel => {
    $$(sel).forEach(el => el.classList.add('reveal'));
  });
};

/* ============================================================
   HERO ANIMATIONS — Staggered entrance
   ============================================================ */
const initHeroAnimations = () => {
  if (prefersReducedMotion()) return;

  // Add animate class to hero children for CSS stagger
  const heroElements = [
    '.hero-badge',
    '.hero-title',
    '.hero-subtitle',
    '.hero-actions',
    '.hero-stats'
  ];

  heroElements.forEach(sel => {
    const el = $(sel);
    if (el) el.classList.add('animate');
  });
};

/* ============================================================
   ACTIVE NAV LINK — SCROLL SPY (enhanced)
   ============================================================ */
const initScrollSpy = () => {
  const sections = $$('section[id], div[id]').filter(el => el.id);
  const navLinks = $$('.nav-link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const getActiveSection = () => {
    const scrollY = window.scrollY + 140;
    let active = null;

    for (const section of sections) {
      if (section.offsetTop <= scrollY) {
        active = section.id;
      }
    }
    return active;
  };

  const updateActiveLink = rafThrottle(() => {
    const activeId = getActiveSection();
    navLinks.forEach(link => {
      const href = link.getAttribute('href').slice(1);
      if (href === activeId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  });

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
};

/* ============================================================
   BOOK COVER — PARALLAX TILT (enhanced)
   ============================================================ */
const initBookParallax = () => {
  const featured = $('.reaction-featured');
  const book     = $('.book-cover', featured);
  if (!featured || !book || prefersReducedMotion()) return;

  let currentRotateX = 0;
  let currentRotateY = -8;
  let targetRotateX = 0;
  let targetRotateY = -8;
  let animating = false;

  const lerp = (start, end, factor) => start + (end - start) * factor;

  const animate = () => {
    currentRotateX = lerp(currentRotateX, targetRotateX, 0.08);
    currentRotateY = lerp(currentRotateY, targetRotateY, 0.08);
    book.style.transform = `perspective(600px) rotateY(${currentRotateY}deg) rotateX(${currentRotateX}deg)`;

    if (Math.abs(currentRotateX - targetRotateX) > 0.01 ||
        Math.abs(currentRotateY - targetRotateY) > 0.01) {
      requestAnimationFrame(animate);
    } else {
      animating = false;
    }
  };

  const startAnimation = () => {
    if (!animating) {
      animating = true;
      requestAnimationFrame(animate);
    }
  };

  on(featured, 'mousemove', (e) => {
    const rect = featured.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    targetRotateY = -8 + ((e.clientX - centerX) / rect.width) * 10;
    targetRotateX = -((e.clientY - centerY) / rect.height) * 6;
    startAnimation();
  });

  on(featured, 'mouseleave', () => {
    targetRotateX = 0;
    targetRotateY = -8;
    startAnimation();
  });
};

/* ============================================================
   STATS COUNTER ANIMATION — Enhanced with premium easing
   ============================================================ */
const initCounters = () => {
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;

  const statsEl = $('.hero-stats');
  if (!statsEl) return;

  const statNums = $$('.stat-num', statsEl);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);

      statNums.forEach((el, index) => {
        const text = el.textContent.trim();
        const numMatch = text.match(/(\d+)/);
        if (!numMatch) return;

        const end = parseInt(numMatch[1], 10);
        const suffix = text.replace(numMatch[1], '').replace(/\d/g, '');
        const duration = 1600;
        const delay = index * 150;

        setTimeout(() => {
          const start = performance.now();

          const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            el.textContent = Math.round(eased * end) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }, delay);
      });
    });
  }, { threshold: 0.5 });

  observer.observe(statsEl);
};

/* ============================================================
   PARALLAX ELEMENTS — Subtle depth on scroll
   ============================================================ */
const initParallax = () => {
  if (prefersReducedMotion()) return;

  const hero = $('.hero');
  const heroGrid = $('.hero-grid');
  const glows = $$('.hero-glow');
  const shapes = $$('.hero-shape');

  if (!hero) return;

  const update = rafThrottle(() => {
    const scrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;

    if (scrollY > heroHeight) return;

    const progress = scrollY / heroHeight;

    // Parallax the grid
    if (heroGrid) {
      heroGrid.style.transform = `translateY(${scrollY * 0.15}px)`;
    }

    // Parallax glows at different rates
    glows.forEach((glow, i) => {
      const rate = 0.08 + i * 0.05;
      glow.style.transform = `translateY(${scrollY * rate}px)`;
    });

    // Parallax decorative shapes
    shapes.forEach((shape, i) => {
      const rate = 0.03 + i * 0.02;
      shape.style.transform = `rotate(${15 + scrollY * 0.02}deg) translateY(${scrollY * rate}px)`;
    });

    // Fade hero content on scroll
    const heroInner = $('.hero-inner');
    if (heroInner) {
      heroInner.style.opacity = `${1 - progress * 0.7}`;
      heroInner.style.transform = `translateY(${scrollY * 0.08}px)`;
    }
  });

  window.addEventListener('scroll', update, { passive: true });
};

/* ============================================================
   MAGNETIC HOVER — Subtle pull on buttons
   ============================================================ */
const initMagneticButtons = () => {
  if (prefersReducedMotion() || 'ontouchstart' in window) return;

  const buttons = $$('.btn-primary, .nav-cta');

  buttons.forEach(btn => {
    on(btn, 'mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    on(btn, 'mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });
};

/* ============================================================
   CURSOR GLOW — Subtle glow following cursor on dark sections
   ============================================================ */
const initCursorGlow = () => {
  if (prefersReducedMotion() || 'ontouchstart' in window) return;

  const darkSections = $$('.ai-reactions, .featured');

  darkSections.forEach(section => {
    const glow = document.createElement('div');
    glow.setAttribute('aria-hidden', 'true');
    glow.style.cssText = `
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(227,6,19,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.5s ease;
    `;
    section.appendChild(glow);

    on(section, 'mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      glow.style.left = `${e.clientX - rect.left}px`;
      glow.style.top = `${e.clientY - rect.top}px`;
      glow.style.opacity = '1';
    });

    on(section, 'mouseleave', () => {
      glow.style.opacity = '0';
    });
  });
};

/* ============================================================
   KEYBOARD FOCUS TRAP — Mobile Menu
   ============================================================ */
const initFocusTrap = () => {
  const menu = $('#navMenu');
  if (!menu) return;

  on(document, 'keydown', (e) => {
    if (!menu.classList.contains('open') || e.key !== 'Tab') return;

    const focusable = $$('a[href], button:not([disabled])', menu);
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
};

/* ============================================================
   CARD TILT — Subtle 3D tilt on project/reaction cards
   ============================================================ */
const initCardTilt = () => {
  if (prefersReducedMotion() || 'ontouchstart' in window) return;

  const cards = $$('.pillar-card, .project-card-featured');

  cards.forEach(card => {
    on(card, 'mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
    });

    on(card, 'mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
};

/* ============================================================
   SCROLL PROGRESS INDICATOR
   ============================================================ */
const initScrollProgress = () => {
  // Create progress bar
  const bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    width: 0%;
    background: linear-gradient(90deg, var(--red), var(--red-light));
    z-index: 10000;
    transition: width 0.1s linear;
    pointer-events: none;
  `;
  document.body.appendChild(bar);

  const update = rafThrottle(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  });

  window.addEventListener('scroll', update, { passive: true });
};

/* ============================================================
   INIT — DOM READY
   ============================================================ */
const init = () => {
  initTheme();
  initPageLoad();
  initHeroAnimations();
  applyRevealClasses();

  initNavScroll();
  initMobileMenu();
  initSmoothScroll();
  initTimeline();
  initScrollReveal();
  initScrollSpy();
  initBookParallax();
  initCounters();
  initFocusTrap();

  // Premium enhancements
  initParallax();
  initMagneticButtons();
  initCursorGlow();
  initCardTilt();
  initScrollProgress();

  // Theme toggle
  on($('#themeToggle'), 'click', toggleTheme);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
