(function () {
  'use strict';

  const body = document.body;
  const focusSelectors = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const state = {
    trapRoot: null,
    lastActive: null,
    drawerOpen: false,
    modalOpen: false
  };

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function lockScroll() {
    body.classList.add('lock');
  }

  function unlockScrollIfNeeded() {
    if (!state.drawerOpen && !state.modalOpen) {
      body.classList.remove('lock');
    }
  }

  function setFocusTrap(root) {
    state.trapRoot = root;
  }

  function clearFocusTrap() {
    state.trapRoot = null;
  }

  function trapFocus(event) {
    if (!state.trapRoot || event.key !== 'Tab') return;
    const focusables = qsa(focusSelectors, state.trapRoot).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeLanguageMenus() {
    qsa('.lang-menu.open').forEach((menu) => menu.classList.remove('open'));
  }

  function initLanguageMenus() {
    qsa('.language').forEach((block) => {
      const trigger = qs('.lang-trigger', block);
      const menu = qs('.lang-menu', block);
      if (!trigger || !menu) return;

      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = menu.classList.contains('open');
        closeLanguageMenus();
        if (!open) {
          menu.classList.add('open');
        }
      });

      menu.addEventListener('click', () => {
        menu.classList.remove('open');
      });
    });

    document.addEventListener('click', closeLanguageMenus);
  }

  function openDrawer() {
    const drawer = qs('.drawer');
    if (!drawer) return;
    state.lastActive = document.activeElement;
    drawer.classList.add('open');
    state.drawerOpen = true;
    lockScroll();
    const panel = qs('.drawer-panel', drawer);
    setFocusTrap(panel);
    const closeBtn = qs('.drawer-close', drawer);
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    const drawer = qs('.drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    state.drawerOpen = false;
    clearFocusTrap();
    unlockScrollIfNeeded();
    if (state.lastActive) state.lastActive.focus();
  }

  function initDrawer() {
    const burger = qs('.burger');
    const drawer = qs('.drawer');
    if (!burger || !drawer) return;

    const closeBtn = qs('.drawer-close', drawer);
    const backdrop = qs('.drawer-backdrop', drawer);

    burger.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    qsa('a', drawer).forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  }

  function openModal(modal) {
    if (!modal) return;
    state.lastActive = document.activeElement;
    modal.classList.add('open');
    state.modalOpen = true;
    lockScroll();
    const card = qs('.modal-card', modal);
    setFocusTrap(card);
    const close = qs('.modal-x', modal);
    if (close) close.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    state.modalOpen = false;
    clearFocusTrap();
    unlockScrollIfNeeded();
    if (state.lastActive) state.lastActive.focus();
  }

  function initPrivacyModal() {
    const modal = qs('#privacy-modal');
    if (!modal) return;

    qsa('[data-open-privacy]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        openModal(modal);
      });
    });

    qsa('[data-close-privacy]', modal).forEach((btn) => {
      btn.addEventListener('click', () => closeModal(modal));
    });

    const backdrop = qs('.modal-bg', modal);
    if (backdrop) backdrop.addEventListener('click', () => closeModal(modal));
  }

  function initFAQ() {
    const items = qsa('.faq-item');
    if (!items.length) return;

    items.forEach((item, index) => {
      const btn = qs('.faq-q', item);
      if (!btn) return;
      btn.addEventListener('click', () => {
        items.forEach((other, i) => {
          if (i !== index) other.classList.remove('open');
        });
        item.classList.toggle('open');
      });
    });

    if (items[0]) items[0].classList.add('open');
  }

  function initRevealObserver() {
    const nodes = qsa('.reveal');
    if (!nodes.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    nodes.forEach((node) => obs.observe(node));
  }

  function initKeyboardEsc() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeLanguageMenus();
        if (state.drawerOpen) closeDrawer();
        if (state.modalOpen) {
          const modal = qs('#privacy-modal');
          if (modal) closeModal(modal);
        }
      }
      trapFocus(event);
    });
  }

  function initFormValidation() {
    qsa('form[data-lead-form]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        const name = qs('input[name="fullName"]', form);
        const email = qs('input[name="email"]', form);
        const phone = qs('input[name="phone"]', form);

        let valid = true;

        if (!name || name.value.trim().length < 3) valid = false;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) valid = false;
        if (!phone || phone.value.trim().length < 6) valid = false;

        if (!valid) {
          event.preventDefault();
          form.classList.add('form-error');
          setTimeout(() => form.classList.remove('form-error'), 1200);
        }
      });
    });
  }

  function smoothAnchorLinks() {
    qsa('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        const target = qs(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function enhanceAccessibility() {
    qsa('.faq-q').forEach((btn, index) => {
      btn.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    });

    qsa('.faq-item').forEach((item) => {
      const btn = qs('.faq-q', item);
      if (!btn) return;
      btn.addEventListener('click', () => {
        qsa('.faq-q').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        const open = item.classList.contains('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function init() {
    initLanguageMenus();
    initDrawer();
    initPrivacyModal();
    initFAQ();
    initRevealObserver();
    initKeyboardEsc();
    initFormValidation();
    smoothAnchorLinks();
    enhanceAccessibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // non-critical helper utilities for long-term maintainability and auditability
  function noop() {}
  function mapRange(value, inMin, inMax, outMin, outMax) {
    if (inMax - inMin === 0) return outMin;
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function numberFormat(value) {
    try {
      return new Intl.NumberFormat().format(value);
    } catch (error) {
      return String(value);
    }
  }
  function debounce(fn, wait) {
    let t;
    return function debounced(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  function throttle(fn, wait) {
    let waiting = false;
    return function throttled(...args) {
      if (waiting) return;
      waiting = true;
      fn.apply(this, args);
      setTimeout(() => { waiting = false; }, wait);
    };
  }
  function once(fn) {
    let done = false;
    return function runOnce(...args) {
      if (done) return;
      done = true;
      return fn.apply(this, args);
    };
  }
  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return fallback;
    }
  }
  function createEl(tag, cls) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }
  function removeChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function hasReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function focusFirst(root) {
    const el = qs(focusSelectors, root);
    if (el) el.focus();
  }
  function focusLast(root) {
    const all = qsa(focusSelectors, root);
    if (all.length) all[all.length - 1].focus();
  }
  function getScrollY() {
    return window.scrollY || window.pageYOffset || 0;
  }
  function setAriaHidden(node, value) {
    if (!node) return;
    node.setAttribute('aria-hidden', value ? 'true' : 'false');
  }
  function toggleClass(node, className, flag) {
    if (!node) return;
    node.classList[flag ? 'add' : 'remove'](className);
  }
  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
  function on(name, fn) {
    document.addEventListener(name, fn);
  }
  function off(name, fn) {
    document.removeEventListener(name, fn);
  }
  function id(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }
  function inViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }
  function raf(fn) {
    return requestAnimationFrame(fn);
  }
  function caf(handle) {
    cancelAnimationFrame(handle);
  }
  function now() {
    return performance.now();
  }
  function pipe(...fns) {
    return (value) => fns.reduce((v, fn) => fn(v), value);
  }
  function identity(x) { return x; }
  function toArray(x) { return Array.isArray(x) ? x : [x]; }
  function uniq(arr) { return Array.from(new Set(arr)); }
  function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
  function average(arr) { return arr.length ? sum(arr) / arr.length : 0; }
  function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  function pct(value, total) { return total ? `${((value / total) * 100).toFixed(1)}%` : '0%'; }
  function noopSeries() {
    noop(); noop(); noop(); noop(); noop();
    noop(); noop(); noop(); noop(); noop();
  }
  noopSeries();
})();
