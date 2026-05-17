'use strict';

document.documentElement.classList.add('js-enabled');

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const safeText = (value) => String(value || '').replace(/[<>]/g, '').trim();

window.addEventListener('load', () => {
  const loader = $('#pageLoader');
  if (!loader) return;
  const seenLoader = sessionStorage.getItem('techhub-loader-seen') === 'true';
  const delay = seenLoader || prefersReducedMotion ? 0 : 450;
  window.setTimeout(() => {
    loader.classList.add('is-hidden');
    sessionStorage.setItem('techhub-loader-seen', 'true');
  }, delay);
});

const header = $('#siteHeader');
const navToggle = $('#navToggle');
const navMenu = $('#navMenu');
const navLinks = $$('.nav-link');

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 24);
};
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

const closeMenu = () => {
  if (!navToggle || !navMenu) return;
  navToggle.classList.remove('open');
  navMenu.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
};

navToggle?.addEventListener('click', () => {
  const willOpen = !navMenu.classList.contains('open');
  navToggle.classList.toggle('open', willOpen);
  navMenu.classList.toggle('open', willOpen);
  navToggle.setAttribute('aria-expanded', String(willOpen));
  document.body.classList.toggle('menu-open', willOpen);
});

navLinks.forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    closeDialogs();
  }
});

const sections = $$('main section[id]');
const highlightNav = () => {
  const scrollPosition = window.scrollY + 130;
  let current = sections[0]?.id || '';
  sections.forEach((section) => {
    if (section.offsetTop <= scrollPosition) current = section.id;
  });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
};
window.addEventListener('scroll', highlightNav, { passive: true });
highlightNav();

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 35, 240)}ms`;
    revealObserver.observe(element);
  });
} else {
  $$('.reveal').forEach((element) => element.classList.add('visible'));
}

const counters = $$('[data-count]');
if ('IntersectionObserver' in window && counters.length && !prefersReducedMotion) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target;
      const finalValue = Number(target.dataset.count || 0);
      const duration = 950;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        target.textContent = Math.round(finalValue * progress).toString();
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(target);
    });
  }, { threshold: 0.5 });
  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach((counter) => { counter.textContent = counter.dataset.count || '0'; });
}

$$('.magnetic').forEach((button) => {
  button.addEventListener('mousemove', (event) => {
    if (prefersReducedMotion) return;
    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.08;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.08;
    button.style.transform = `translate(${x}px, ${y}px)`;
  });
  button.addEventListener('mouseleave', () => { button.style.transform = ''; });
});

$$('.tilt-card').forEach((card) => {
  card.addEventListener('mousemove', (event) => {
    if (prefersReducedMotion || window.innerWidth < 981) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1100px) rotateY(${x * -10}deg) rotateX(${y * 8}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

const filterButtons = $$('.filter-btn');
const galleryItems = $$('.gallery-item');
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter || 'all';
    filterButtons.forEach((btn) => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    galleryItems.forEach((item) => {
      const show = filter === 'all' || item.dataset.category === filter;
      item.classList.toggle('is-hidden', !show);
    });
  });
});

const lightbox = $('#lightbox');
const lightboxClose = $('#lightboxClose');
const lightboxTitle = $('#lightboxTitle');
const lightboxNote = $('#lightboxNote');
const lightboxPreview = $('#lightboxPreview');
const lightboxImage = $('#lightboxImage');

const imageExists = (src) => new Promise((resolve) => {
  if (!src) return resolve(false);
  const img = new Image();
  img.onload = () => resolve(true);
  img.onerror = () => resolve(false);
  img.src = src;
});

galleryItems.forEach((item) => {
  const imagePath = item.dataset.image;
  imageExists(imagePath).then((exists) => {
    if (exists) {
      item.classList.add('has-image');
      item.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,.74), rgba(0,0,0,.16)), url('${imagePath}')`;
    }
  });

  item.addEventListener('click', async () => {
    const title = safeText(item.dataset.title || item.textContent);
    const note = safeText(item.dataset.note || 'Design preview.');
    const category = safeText(item.dataset.category || 'all');
    const imagePath = item.dataset.image;
    if (!lightbox || !lightboxTitle || !lightboxNote || !lightboxPreview || !lightboxImage) return;
    lightbox.dataset.category = category;
    lightboxTitle.textContent = title;
    lightboxNote.textContent = note;
    lightboxPreview.dataset.title = title;
    const hasImage = await imageExists(imagePath);
    lightboxImage.hidden = !hasImage;
    lightboxPreview.hidden = hasImage;
    lightboxPreview.setAttribute('aria-hidden', String(hasImage));
    if (hasImage) {
      lightboxImage.src = imagePath;
      lightboxImage.alt = `${title} design preview`;
    } else {
      lightboxImage.removeAttribute('src');
    }
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
  });
});

const projectModal = $('#projectModal');
const projectModalText = $('#projectModalText');
const projectClose = $('#projectClose');
$$('.project-preview').forEach((button) => {
  button.addEventListener('click', () => {
    if (!projectModal || !projectModalText) return;
    projectModalText.textContent = safeText(button.dataset.preview || 'Project preview.');
    if (typeof projectModal.showModal === 'function') projectModal.showModal();
  });
});

const closeDialogs = () => {
  [lightbox, projectModal].forEach((dialog) => {
    if (dialog?.open) dialog.close();
  });
};
lightboxClose?.addEventListener('click', () => lightbox?.close());
projectClose?.addEventListener('click', () => projectModal?.close());
[lightbox, projectModal].forEach((dialog) => {
  dialog?.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
});

const contactForm = $('#contactForm');
const submitBtn = $('#submitBtn');
const formStatus = $('#formStatus');
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const SUBMISSION_COOLDOWN_MS = 15000;
let lastSubmitTime = 0;

const setStatus = (message, type = '') => {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`.trim();
};

const validateField = (field) => {
  if (!field) return true;
  const value = field.value.trim();
  let valid = true;
  if (field.required && !value) valid = false;
  if (valid && field.minLength > 0 && value.length < field.minLength) valid = false;
  if (valid && field.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
  field.setAttribute('aria-invalid', String(!valid));
  return valid;
};

contactForm?.addEventListener('input', (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) validateField(target);
});

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');
  const now = Date.now();
  if (now - lastSubmitTime < SUBMISSION_COOLDOWN_MS) {
    setStatus('Please wait a few seconds before sending another message.', 'error');
    return;
  }
  const fields = $$('input, textarea, select', contactForm).filter((field) => field.type !== 'hidden' && field.name !== 'botcheck');
  const valid = fields.every(validateField);
  if (!valid) {
    setStatus('Please check the highlighted fields and try again.', 'error');
    return;
  }
  const honeypot = $('[name="botcheck"]', contactForm);
  if (honeypot?.checked) {
    setStatus('Submission blocked.', 'error');
    return;
  }
  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());
  ['first_name', 'last_name', 'email', 'phone', 'service', 'message'].forEach((key) => {
    if (payload[key]) payload[key] = safeText(payload[key]);
  });
  payload.message = `${payload.message}\n\nService needed: ${payload.service || 'Not specified'}\nPhone/WhatsApp: ${payload.phone || 'Not provided'}`;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
  setStatus('Sending your project details...', '');
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    window.clearTimeout(timeout);
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) throw new Error(result.message || 'Form service rejected the submission.');
    lastSubmitTime = Date.now();
    contactForm.reset();
    fields.forEach((field) => field.removeAttribute('aria-invalid'));
    setStatus('Message sent successfully. I will get back to you soon.', 'success');
  } catch (error) {
    const message = error.name === 'AbortError' ? 'The form took too long to respond. Please try again or use WhatsApp.' : 'The form could not send right now. Please try again or use WhatsApp.';
    setStatus(message, 'error');
    console.error('Contact form error:', error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
  }
});

$('#backTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
