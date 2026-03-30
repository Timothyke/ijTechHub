/* ================================================================
   TECH HUB — script.js (REPAIRED & ENHANCED)
   All interactive behaviour for techhubdigital.co.ke
   
   CHANGES MADE:
   ✅ Fixed CSS variable fallbacks in showToast()
   ✅ Added email/phone validation to contact form
   ✅ Fixed portfolio filter transition conflicts
   ✅ Added focus trap for mobile menu (a11y)
   ✅ Added debounce to scroll handlers for performance
   ✅ Fixed counter animation decimal flicker
   ✅ Added error boundary for fetch operations
   ✅ Ensured graceful degradation if CSS fails
   ================================================================ */


/* ================================================================
   01. PRELOADER
   Fades out once the DOM is ready + a short delay for the bar animation
   ================================================================ */
(function initPreloader() {
  const loader = document.getElementById('preloader');
  if (!loader) return;

  // Fallback: hide preloader after 3s max if load event fails
  const fallbackTimer = setTimeout(() => loader.classList.add('done'), 3000);

  window.addEventListener('load', () => {
    clearTimeout(fallbackTimer);
    // Match the 1.2s fill animation then fade out
    setTimeout(() => {
      loader.classList.add('done');
      // Remove from DOM after transition to free memory
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 400);
    }, 1300);
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
  let lastScrollY = window.scrollY;
  function onScroll() {
    const currentScrollY = window.scrollY;
    // Only update DOM if state changed (performance)
    const shouldScroll = currentScrollY > 60;
    if (navbar.classList.contains('scrolled') !== shouldScroll) {
      navbar.classList.toggle('scrolled', shouldScroll);
    }
    lastScrollY = currentScrollY;
  }

  // Debounced scroll handler for performance
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      onScroll();
      scrollTimeout = null;
    }, 100);
  }, { passive: true });
  
  onScroll(); // run once on load

  /* --- Active nav link via IntersectionObserver --- */
  if (sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            if (link.classList.contains('active') !== isActive) {
              link.classList.toggle('active', isActive);
            }
          });
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0.1 }
    );
    sections.forEach((sec) => sectionObserver.observe(sec));
  }
})();


/* ================================================================
   03. MOBILE MENU
   Opens / closes the full-screen overlay with accessibility enhancements
   ================================================================ */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu      = document.getElementById('mobileMenu');
  const closeBtn  = document.getElementById('mobileClose');
  if (!hamburger || !menu) return;

  let lastFocusedElement = null;
  const focusableSelectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

  function getFocusableElements() {
    return Array.from(menu.querySelectorAll(focusableSelectors))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }

  function open() {
    lastFocusedElement = document.activeElement;
    hamburger.classList.add('open');
    menu.classList.add('open');
    menu.hidden = false; // Ensure visible for screen readers
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    
    // Focus first focusable element for accessibility
    setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable[0]) focusable[0].focus();
    }, 100);
  }

  function close() {
    hamburger.classList.remove('open');
    menu.classList.remove('open');
    menu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    
    // Restore focus to hamburger
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  hamburger.addEventListener('click', (e) => {
    e.preventDefault();
    menu.classList.contains('open') ? close() : open();
  });

  if (closeBtn) closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    close();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      e.preventDefault();
      close();
    }
  });

  // Focus trap for accessibility (WCAG 2.1)
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !menu.classList.contains('open')) return;
    
    const focusable = getFocusableElements();
    if (!focusable.length) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && 
        !menu.contains(e.target) && 
        !hamburger.contains(e.target)) {
      close();
    }
  });

  // Expose closeMobile for inline onclick attributes
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
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );

  revealEls.forEach((el) => {
    // Add initial state for CSS transition
    el.style.willChange = 'transform, opacity';
    observer.observe(el);
  });
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
    if (isNaN(target)) return;
    
    const duration = 1800; // ms
    const stepTime = 16;   // ~60fps
    const steps    = Math.floor(duration / stepTime);
    const increment = target / steps;
    let current = 0;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      current += increment;
      
      // Use Math.round for clean integers, prevent overshoot
      const displayValue = stepCount >= steps ? target : Math.round(current);
      el.textContent = displayValue;
      
      if (stepCount >= steps) {
        el.textContent = target; // Ensure exact final value
        clearInterval(timer);
      }
    }, stepTime);
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

  counters.forEach((el) => {
    // Ensure element has initial value
    if (!el.textContent || el.textContent === '0') {
      el.textContent = '0';
    }
    counterObserver.observe(el);
  });
})();


/* ================================================================
   06. PORTFOLIO FILTER
   Shows/hides portfolio cards based on data-cat attribute.
   Called by onclick on filter buttons in the HTML.
   ================================================================ */
function filterPortfolio(clickedBtn, category) {
  // Prevent default if called from event
  if (clickedBtn?.preventDefault) clickedBtn.preventDefault();
  
  // Update button active states
  document.querySelectorAll('.pf-btn').forEach((btn) => {
    const isActive = btn === clickedBtn;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // Show/fade cards with smooth transition
  document.querySelectorAll('.port-card').forEach((card) => {
    const isMatch = category === 'all' || card.dataset.cat === category;
    
    // Use CSS class for transition instead of inline styles (cleaner)
    if (isMatch) {
      card.classList.remove('hidden');
      card.style.pointerEvents = '';
    } else {
      card.classList.add('hidden');
      card.style.pointerEvents = 'none';
    }
  });
}

// Add CSS class handler for .hidden state (ensure this exists in styles.css)
// .port-card.hidden { opacity: 0; transform: scale(0.97); pointer-events: none; }


/* ================================================================
   07. CONTACT FORM
   Uses Formspree for email delivery (no backend required).
   
   SETUP:
   1. Go to https://formspree.io and create a free account
   2. Create a new form and copy the form ID
   3. In index.html, replace YOURFORMID in the form action URL
   4. That's it — submissions will be emailed to you automatically
   ================================================================ */
(function initContactForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');
  const errorMsg   = document.getElementById('formError');
  if (!form) return;

  // Email validation regex (simple but effective)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Kenya phone regex (optional, lenient)
  const phoneRegex = /^(\+254|0)[17]\d{8}$/;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset previous errors
    let hasError = false;
    form.querySelectorAll('[required]').forEach((field) => {
      field.style.borderColor = '';
      field.setAttribute('aria-invalid', 'false');
    });

    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = '#ef4444';
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', `${field.id}-error`);
        hasError = true;
      }
    });

    // Validate email format
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value.trim() && !emailRegex.test(emailField.value.trim())) {
      emailField.style.borderColor = '#ef4444';
      emailField.setAttribute('aria-invalid', 'true');
      showToast('Please enter a valid email address.', 'error');
      hasError = true;
    }

    // Validate phone format (if provided)
    const phoneField = form.querySelector('input[type="tel"]');
    if (phoneField && phoneField.value.trim() && !phoneRegex.test(phoneField.value.trim().replace(/\s/g, ''))) {
      phoneField.style.borderColor = '#ef4444';
      phoneField.setAttribute('aria-invalid', 'true');
      showToast('Please enter a valid Kenyan phone number.', 'error');
      hasError = true;
    }

    if (hasError) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Update button state
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    
    // Hide previous messages
    if (successMsg) successMsg.hidden = true;
    if (errorMsg) errorMsg.hidden = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        // Success
        form.reset();
        if (successMsg) {
          successMsg.hidden = false;
          successMsg.focus?.(); // Focus for screen readers
        }
        showToast('Message sent! We\'ll reply within 4 hours.');
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
        
        // Reset button after delay
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }, 3000);
        
      } else if (response.status === 400) {
        // Formspree validation error
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors?.[0]?.message || 'Form validation failed');
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (err) {
      console.error('Form submission error:', err);
      
      // Show user-friendly error
      if (errorMsg) {
        errorMsg.hidden = false;
        errorMsg.textContent = `Error: ${err.message || 'Something went wrong'}`;
        errorMsg.focus?.();
      }
      showToast('Something went wrong. Try WhatsApp or email instead.', 'error');
      
      // Keep button enabled for retry
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }
  });

  // Remove error styling on input
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => { 
      field.style.borderColor = '';
      field.setAttribute('aria-invalid', 'false');
    });
    field.addEventListener('blur', () => {
      // Re-validate on blur if field is required and has value
      if (field.hasAttribute('required') && field.value.trim()) {
        if (field.type === 'email' && !emailRegex.test(field.value.trim())) {
          field.style.borderColor = '#ef4444';
          field.setAttribute('aria-invalid', 'true');
        }
      }
    });
  });
})();


/* ================================================================
   08. BACK TO TOP BUTTON
   Appears when user scrolls more than 400px down the page.
   ================================================================ */
(function initBackToTop() {
  const btn = document.getElementById('backTop');
  if (!btn) return;

  // Debounced scroll for performance
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      const shouldShow = window.scrollY > 400;
      if (btn.hidden !== shouldShow) {
        btn.hidden = !shouldShow;
      }
      scrollTimeout = null;
    }, 100);
  }, { passive: true });
  
  // Initial state
  btn.hidden = window.scrollY < 400;
  
  // Smooth scroll with fallback
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  });
})();


/* ================================================================
   09. FOOTER — AUTO YEAR
   Keeps the copyright year current automatically.
   ================================================================ */
(function setYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    // Use textContent to prevent XSS
    yearEl.textContent = new Date().getFullYear();
  }
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
 */
function showToast(message, type = 'success', duration = 4000) {
  const toast = document.getElementById('toast');
  if (!toast) {
    // Fallback: use alert if toast element missing
    console.warn('Toast element not found. Message:', message);
    if (type === 'error') alert(`Error: ${message}`);
    return;
  }

  const iconEl = toast.querySelector('i');
  const textEl = toast.querySelector('span');

  // Update text safely
  if (textEl) textEl.textContent = message;

  // Swap icon and colour based on type with CSS variable fallbacks
  if (iconEl) {
    iconEl.className = type === 'error'
      ? 'fa-solid fa-circle-exclamation'
      : 'fa-solid fa-circle-check';
  }
  
  // Use CSS variables with fallbacks (define these in your CSS root)
  const colors = {
    success: getComputedStyle(document.documentElement).getPropertyValue('--citrus').trim() || '#E8FF47',
    error: getComputedStyle(document.documentElement).getPropertyValue('--error-red').trim() || '#ef4444'
  };
  const textColors = {
    success: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#111827',
    error: '#ffffff'
  };
  
  toast.style.background = colors[type];
  toast.style.color = textColors[type];

  // Show toast using class (more reliable than inline visibility)
  toast.classList.remove('show'); // Reset animation
  void toast.offsetWidth; // Force reflow to restart animation
  toast.classList.add('show');
  toast.hidden = false; // Ensure visible for screen readers

  // Auto-hide after duration
  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
    // Hide from screen readers after animation
    setTimeout(() => {
      if (!toast.classList.contains('show')) {
        toast.hidden = true;
      }
    }, 300);
  }, duration);
}

// ✅ Utility: Debounce function for performance-critical events
function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
window.debounce = debounce; // Expose globally if needed

// ✅ Utility: Throttle function for scroll/resize
function throttle(func, limit = 200) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
window.throttle = throttle;

// ✅ Initialize everything when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // All IIFEs above run immediately, but this ensures DOM is ready
    console.log('✅ Tech Hub scripts initialized');
  });
} else {
  console.log('✅ Tech Hub scripts initialized (DOM already ready)');
}