/* ================================================================
   TECH HUB — script.js
   All interactive behaviour for techhubdigital.co.ke
   
   CONTENTS:
   01. Preloader
   02. Navbar: scroll state + active link highlighting
   03. Mobile menu
   04. Scroll reveal (IntersectionObserver)
   05. Animated stat counters
   06. Portfolio filter
   07. Contact form (Formspree)
   08. Back-to-top button
   09. Footer: auto year
   10. Helpers
   ================================================================ */


/* ================================================================
   01. PRELOADER
   Fades out once the DOM is ready + a short delay for the bar animation
   ================================================================ */

(function initPreloader() {
  const loader = document.getElementById('preloader');
  if (!loader) return;

  window.addEventListener('load', () => {
    // Match the 1.2s fill animation then fade out
    setTimeout(() => loader.classList.add('done'), 1300);
  });
})();


/* ================================================================
   02. NAVBAR
   - Adds .scrolled class when page scrolls past 60px
   - Highlights the nav link for the section currently in the viewport
   ================================================================ */

(function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  if (!navbar) return;

  /* --- Scroll state (solid background) --- */
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load in case page is already scrolled

  /* --- Active nav link via IntersectionObserver --- */
  // Triggers when a section is 40% into the viewport
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      });
    },
    { rootMargin: '-40% 0px -40% 0px' }
  );

  sections.forEach((sec) => sectionObserver.observe(sec));
})();


/* ================================================================
   03. MOBILE MENU
   Opens / closes the full-screen overlay
   ================================================================ */

(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu      = document.getElementById('mobileMenu');
  const closeBtn  = document.getElementById('mobileClose');
  if (!hamburger || !menu) return;

  function open() {
    hamburger.classList.add('open');
    menu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // prevent scroll behind overlay
  }

  function close() {
    hamburger.classList.remove('open');
    menu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () =>
    menu.classList.contains('open') ? close() : open()
  );

  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) close();
  });

  // Expose closeMobile for inline onclick attributes in the HTML
  window.closeMobile = close;
})();


/* ================================================================
   04. SCROLL REVEAL
   Elements with class .reveal animate in when scrolled into view.
   Adds .visible → CSS transitions handle the animation.
   ================================================================ */

(function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once only
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => observer.observe(el));
})();


/* ================================================================
   05. ANIMATED STAT COUNTERS
   Elements with data-target="NUMBER" count up when scrolled into view.
   Used in the hero stats row.
   ================================================================ */

(function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1800; // ms
    const step     = 16;   // ~60fps
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, step);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => counterObserver.observe(el));
})();


/* ================================================================
   06. PORTFOLIO FILTER
   Shows/hides portfolio cards based on data-cat attribute.
   Called by onclick on filter buttons in the HTML.
   ================================================================ */

function filterPortfolio(clickedBtn, category) {
  // Update button active states
  document.querySelectorAll('.pf-btn').forEach((btn) => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  });
  clickedBtn.classList.add('active');
  clickedBtn.setAttribute('aria-pressed', 'true');

  // Show/fade cards
  document.querySelectorAll('.port-card').forEach((card) => {
    const isMatch = category === 'all' || card.dataset.cat === category;
    card.style.opacity       = isMatch ? '1' : '0.2';
    card.style.transform     = isMatch ? '' : 'scale(0.97)';
    card.style.pointerEvents = isMatch ? '' : 'none';
  });
}


/* ================================================================
   07. CONTACT FORM
   Uses Formspree for email delivery (no backend required).
   
   SETUP:
   1. Go to https://formspree.io and create a free account
   2. Create a new form and copy the form ID
   3. In index.html, replace YOURFORMID in the form action URL
   4. That's it — submissions will be emailed to you automatically
   
   The handler below gives instant UI feedback (success/error)
   and also handles the native Formspree redirect if preferred.
   ================================================================ */

(function initContactForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');
  const errorMsg   = document.getElementById('formError');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic client-side validation
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = '#ef4444';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });
    if (!valid) return;

    // Update button state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';

    try {
      const data     = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        // Success
        form.reset();
        successMsg.hidden = false;
        errorMsg.hidden   = true;
        showToast('Message sent! We\'ll reply within 4 hours.');
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
        setTimeout(() => {
          successMsg.hidden    = true;
          submitBtn.disabled   = false;
          submitBtn.innerHTML  = '<i class="fa-solid fa-paper-plane"></i> Send Message';
        }, 5000);
      } else {
        throw new Error('Server error');
      }
    } catch {
      // Error — show inline message AND error-styled toast
      errorMsg.hidden   = false;
      successMsg.hidden = true;
      showToast('Something went wrong. Try WhatsApp instead.', 'error');
      submitBtn.disabled   = false;
      submitBtn.innerHTML  = '<i class="fa-solid fa-paper-plane"></i> Send Message';
    }
  });

  // Remove red border on input focus after a failed attempt
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => { field.style.borderColor = ''; });
  });
})();


/* ================================================================
   08. BACK TO TOP BUTTON
   Appears when user scrolls more than 400px down the page.
   ================================================================ */

(function initBackToTop() {
  const btn = document.getElementById('backTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.hidden = window.scrollY < 400;
  }, { passive: true });
})();


/* ================================================================
   09. FOOTER — AUTO YEAR
   Keeps the copyright year current automatically.
   ================================================================ */

(function setYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ================================================================
   10. HELPERS
   ================================================================ */

/**
 * showToast — displays the bottom-right toast notification.
 *
 * @param {string}  message  - Text to display
 * @param {'success'|'error'} type - Controls icon and colour (default: 'success')
 * @param {number}  duration - Milliseconds before auto-hide (default: 4000)
 *
 * Usage:
 *   showToast('Message sent!');
 *   showToast('Something went wrong.', 'error');
 */
function showToast(message, type = 'success', duration = 4000) {
  const toast  = document.getElementById('toast');
  if (!toast) return;

  const iconEl = toast.querySelector('i');
  const textEl = toast.querySelector('span');

  // Update text
  if (textEl) textEl.textContent = message;

  // Swap icon and colour based on type
  if (iconEl) {
    iconEl.className = type === 'error'
      ? 'fa-solid fa-circle-exclamation'
      : 'fa-solid fa-circle-check';
  }
  toast.style.background = type === 'error' ? '#ef4444' : 'var(--citrus)';
  toast.style.color      = type === 'error' ? '#fff'    : 'var(--ink)';

  // Remove the one-time inline visibility:hidden set in HTML
  toast.style.visibility = '';

  // Show
  toast.classList.add('show');

  // Auto-hide after duration
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}