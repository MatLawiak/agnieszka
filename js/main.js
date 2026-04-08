/* ================================================================
   AGNIESZKA ASLANKENT-WOŹNIAK — Coaching w zgodzie ze sobą
   Główny plik JavaScript
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. NAWIGACJA — scroll effect + hamburger
   ---------------------------------------------------------------- */
(function initNav() {
  const nav       = document.querySelector('.site-nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');

  if (!nav) return;

  // Scrolled state
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on nav link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Active nav link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-mobile a[href^="#"]');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) current = section.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
})();


/* ----------------------------------------------------------------
   2. SCROLL REVEAL
   ---------------------------------------------------------------- */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );

  els.forEach(el => observer.observe(el));
})();


/* ----------------------------------------------------------------
   3. FORMULARZ KONTAKTOWY — walidacja + Formspree
   ---------------------------------------------------------------- */
(function initContactForm() {
  const form   = document.getElementById('contact-form');
  if (!form) return;

  const statusEl  = form.querySelector('.form-status');
  const submitBtn = form.querySelector('.form-submit-btn');

  // --- Walidacja pól ---
  function validateField(input) {
    const group    = input.closest('.form-group') || input.closest('.form-consent');
    const errorEl  = group ? group.querySelector('.field-error') : null;
    let   isValid  = true;
    let   message  = '';

    if (input.type === 'checkbox') {
      isValid = input.checked;
      message = 'Zgoda jest wymagana.';
    } else if (!input.value.trim()) {
      isValid = false;
      message = 'To pole jest wymagane.';
    } else if (input.type === 'email') {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(input.value.trim())) {
        isValid = false;
        message = 'Podaj prawidłowy adres e-mail.';
      }
    } else if (input.type === 'tel' && input.value.trim()) {
      const telRe = /^[\+\d\s\-\(\)]{7,20}$/;
      if (!telRe.test(input.value.trim())) {
        isValid = false;
        message = 'Podaj prawidłowy numer telefonu.';
      }
    } else if (input.tagName === 'TEXTAREA' && input.value.trim().length < 10) {
      isValid = false;
      message = 'Wiadomość musi mieć co najmniej 10 znaków.';
    }

    input.classList.toggle('error', !isValid);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle('visible', !isValid);
    }
    return isValid;
  }

  // Live validation on blur
  form.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('blur', () => {
      if (field.value || field.required) validateField(field);
    });
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  // --- Wysyłanie formularza ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all required fields
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach(field => {
      if (!validateField(field)) valid = false;
    });

    if (!valid) return;

    // Loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    statusEl.className = 'form-status';

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        statusEl.className = 'form-status success';
        statusEl.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Dziękuję! Wiadomość wysłana. Odezwę się w ciągu 24 godzin.</span>
        `;
        form.reset();
        // Scroll do statusu
        statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        const responseData = await response.json().catch(() => ({}));
        if (responseData.errors) {
          throw new Error(responseData.errors.map(e => e.message).join(', '));
        }
        throw new Error('Błąd serwera');
      }
    } catch (err) {
      statusEl.className = 'form-status error';
      statusEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Coś poszło nie tak. Napisz bezpośrednio na <a href="mailto:agnieszka.wozniak88@gmail.com">agnieszka.wozniak88@gmail.com</a></span>
      `;
      console.error('Form error:', err);
    } finally {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
    }
  });
})();


/* ----------------------------------------------------------------
   4. SMOOTH SCROLL dla kotwic w navie
   ---------------------------------------------------------------- */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ----------------------------------------------------------------
   5. LICZNIKI STATYSTYK (animacja liczb w sekcji hero)
   ---------------------------------------------------------------- */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el       = entry.target;
      const target   = parseInt(el.dataset.count, 10);
      const suffix   = el.dataset.suffix || '';
      const duration = 1800;
      const start    = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();
