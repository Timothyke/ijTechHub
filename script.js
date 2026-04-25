/**
 * TECH HUB — script.js
 * Production build — clean, modular, accessible
 *
 * Modules:
 *  01. Preloader
 *  02. Navbar (scroll state + active link)
 *  03. Mobile Menu (with focus trap)
 *  04. Scroll Reveal
 *  05. Stat Counters
 *  06. Portfolio Filter
 *  07. Contact Form (Web3Forms)
 *  08. Back to Top
 *  09. Footer Year
 *  10. Toast Notification
 *  11. Utilities
 */

'use strict';

/* ================================================================
   UTILITIES
   ================================================================ */

/**
 * Throttle: limit how often a function fires.
 * @param {Function} fn
 * @param {number} limit - ms
 */
function throttle(fn, limit = 200) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Safe text setter — prevents XSS by using textContent.
 * @param {Element} el
 * @param {string} text
 */
function safeText(el, text) {
  if (el) el.textContent = String(text);
}

/**
 * Show or hide an element using the hidden attribute.
 * @param {Element} el
 * @param {boolean} visible
 */
function setVisible(el, visible) {
  if (!el) return;
  el.hidden = !visible;
}

/**
 * Sanitize a string for safe display (strips HTML tags).
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.textContent;
}


/* ================================================================
   01. PRELOADER
   ================================================================ */
(function initPreloader() {
  const loader = document.getElementById('preloader');
  if (!loader) return;

  // Fallback: hide after 3s even if load event doesn't fire
  const fallback = setTimeout(() => loader.classList.add('done'), 3000);

  window.addEventListener('load', () => {
    clearTimeout(fallback);
    // Wait for bar animation (1.1s) then fade out
    setTimeout(() => {
      loader.classList.add('done');
      // Remove from DOM after transition to free memory
      setTimeout(() => loader.remove(), 500);
    }, 1200);
  });
})();


/* ================================================================
   02. NAVBAR
   ================================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  if (!navbar) return;

  /* Scroll state */
  function updateNavbar() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', throttle(updateNavbar, 100), { passive: true });
  updateNavbar(); // run on load

  /* Active link via IntersectionObserver */
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      });
    },
    { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
})();


/* ================================================================
   03. MOBILE MENU
   ================================================================ */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu      = document.getElementById('mobileMenu');
  const closeBtn  = document.getElementById('mobileClose');
  if (!hamburger || !menu) return;

  let previousFocus = null;

  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function getFocusable() {
    return [...menu.querySelectorAll(FOCUSABLE)].filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  function openMenu() {
    previousFocus = document.activeElement;
    menu.hidden = false;
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable[0]) focusable[0].focus();
    });
  }

  function closeMenu() {
    menu.hidden = true;
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }

  /* Toggle */
  hamburger.addEventListener('click', () => {
    menu.hidden ? openMenu() : closeMenu();
  });

  /* Close button */
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  /* Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      e.preventDefault();
      closeMenu();
    }
  });

  /* Focus trap */
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || menu.hidden) return;
    const focusable = getFocusable();
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

  /* Close on nav link click (mobile) */
  menu.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  /* Close on outside click */
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });

  /* Expose for any inline usage */
  window.closeMobile = closeMenu;
})();


/* ================================================================
   04. SCROLL REVEAL
   ================================================================ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
})();


/* ================================================================
   05. STAT COUNTERS
   ================================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  function animate(el) {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target) || target <= 0) return;

    const duration  = 1600; // ms
    const frameTime = 1000 / 60; // ~60fps
    const totalFrames = Math.round(duration / frameTime);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      // Ease-out: decelerates near the end
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      el.textContent = frame >= totalFrames ? target : Math.round(progress * target);

      if (frame >= totalFrames) {
        clearInterval(timer);
        el.textContent = target; // Guarantee exact final value
      }
    }, frameTime);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => {
    el.textContent = '0';
    observer.observe(el);
  });
})();


/* ================================================================
   06. PORTFOLIO FILTER
   ================================================================ */
(function initPortfolioFilter() {
  const filterGroup = document.querySelector('.pf-filters');
  const grid        = document.getElementById('portfolioGrid');
  if (!filterGroup || !grid) return;

  filterGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.pf-btn');
    if (!btn) return;

    const category = btn.dataset.filter;

    /* Update button states */
    filterGroup.querySelectorAll('.pf-btn').forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });

    /* Show/hide cards */
    grid.querySelectorAll('.port-card').forEach((card) => {
      const matches = category === 'all' || card.dataset.cat === category;
      card.classList.toggle('is-hidden', !matches);
    });
  });
})();


/* ================================================================
   07. CONTACT FORM — Web3Forms
   ================================================================ */
(function initContactForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');
  const errorMsg   = document.getElementById('formError');
  const errorText  = document.getElementById('formErrorText');
  if (!form || !submitBtn) return;

  /* Validation rules */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^(\+254|0)[17]\d{8}$/;

  const validators = {
    fn:  (v) => v.length >= 2 ? null : 'Please enter your first name.',
    ln:  (v) => v.length >= 2 ? null : 'Please enter your last name.',
    em:  (v) => EMAIL_RE.test(v) ? null : 'Please enter a valid email address.',
    ph:  (v) => !v || PHONE_RE.test(v.replace(/\s/g, '')) ? null : 'Enter a valid Kenyan number (e.g. 0712345678).',
    msg: (v) => v.length >= 10 ? null : 'Please describe your project (at least 10 characters).',
  };

  /* Field-level error display */
  function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(`${fieldId}-error`);
    if (!field) return;

    if (message) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', `${fieldId}-error`);
      if (errEl) {
        safeText(errEl, message);
        errEl.hidden = false;
      }
    } else {
      field.setAttribute('aria-invalid', 'false');
      field.removeAttribute('aria-describedby');
      if (errEl) {
        safeText(errEl, '');
        errEl.hidden = true;
      }
    }
  }

  function clearFieldError(fieldId) {
    setFieldError(fieldId, null);
  }

  /* Run all validations; return true if valid */
  function validateForm() {
    let isValid = true;

    Object.entries(validators).forEach(([id, validate]) => {
      const field = document.getElementById(id);
      if (!field) return;
      const value = field.value.trim();
      const error = validate(value);
      if (error) {
        setFieldError(id, error);
        isValid = false;
      } else {
        clearFieldError(id);
      }
    });

    return isValid;
  }

  /* Live validation on blur */
  Object.keys(validators).forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;

    field.addEventListener('blur', () => {
      const error = validators[id](field.value.trim());
      if (error) {
        setFieldError(id, error);
      } else {
        clearFieldError(id);
      }
    });

    field.addEventListener('input', () => {
      // Clear error as soon as user starts typing again
      if (field.getAttribute('aria-invalid') === 'true') {
        clearFieldError(id);
      }
    });
  });

  /* Submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous feedback
    setVisible(successMsg, false);
    setVisible(errorMsg, false);

    // Honeypot check
    const honeypot = form.querySelector('input[name="botcheck"]');
    if (honeypot && honeypot.value) {
      // Silently reject bots — show fake success
      setVisible(successMsg, true);
      return;
    }

    // Validate
    if (!validateForm()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Loading state
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending…';

    try {
      const formData = new FormData(form);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // SUCCESS
        form.reset();

        // Clear any lingering field errors
        Object.keys(validators).forEach(clearFieldError);

        setVisible(successMsg, true);
        successMsg?.focus();
        showToast('Message sent! We\'ll be in touch within 4 hours.');

        submitBtn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Sent!';
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }, 3500);

      } else {
        // API returned an error
        throw new Error(result.message || 'Submission failed. Please try again.');
      }

    } catch (err) {
      console.error('[Tech Hub] Form error:', err.message);

      const userMessage = err.message && err.message.length < 120
        ? sanitize(err.message)
        : 'Something went wrong. Please try WhatsApp or email instead.';

      if (errorText) safeText(errorText, userMessage);
      setVisible(errorMsg, true);
      errorMsg?.focus();

      showToast('Submission failed. Try WhatsApp instead.', 'error');

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });
})();


/* ================================================================
   08. BACK TO TOP
   ================================================================ */
(function initBackToTop() {
  const btn = document.getElementById('backTop');
  if (!btn) return;

  function update() {
    setVisible(btn, window.scrollY > 400);
  }

  window.addEventListener('scroll', throttle(update, 120), { passive: true });
  update();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ================================================================
   09. FOOTER YEAR
   ================================================================ */
(function setYear() {
  const el = document.getElementById('currentYear');
  if (el) safeText(el, new Date().getFullYear());
})();


/* ================================================================
   10. TOAST NOTIFICATION
   ================================================================ */

/**
 * Display a toast message.
 * @param {string} message
 * @param {'success'|'error'} type
 * @param {number} duration - ms before auto-hide
 */
function showToast(message, type = 'success', duration = 4500) {
  const toast   = document.getElementById('toast');
  const textEl  = document.getElementById('toastText');
  const iconEl  = toast?.querySelector('i');
  if (!toast) return;

  // Set content safely
  if (textEl) safeText(textEl, message);

  // Icon
  if (iconEl) {
    iconEl.className = type === 'error'
      ? 'fa-solid fa-circle-exclamation'
      : 'fa-solid fa-circle-check';
    iconEl.setAttribute('aria-hidden', 'true');
  }

  // Colour
  toast.style.background = type === 'error' ? '#ef4444' : '';
  toast.style.color      = type === 'error' ? '#fff' : '';

  // Show
  toast.hidden = false;
  // Force reflow to restart transition
  void toast.offsetWidth;
  toast.classList.add('show');

  // Auto-hide
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (!toast.classList.contains('show')) {
        toast.hidden = true;
        toast.style.background = '';
        toast.style.color = '';
      }
    }, 350);
  }, duration);
}

// Expose globally in case needed from inline HTML
window.showToast = showToast;


/* ================================================================
   INIT LOG
   ================================================================ */
if (typeof console !== 'undefined') {
  console.log('%c✅ Tech Hub initialized', 'color:#E8FF47;font-weight:bold;background:#0D0F14;padding:2px 6px;border-radius:3px');
}