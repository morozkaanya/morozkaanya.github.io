/* ═══════════════════════════════════════════════════════════════════════
   30 & FABULOUS — interaction layer
   Vanilla JS. No dependencies. Progressive enhancement friendly.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ── CONFIG: personalize before publishing ───────────────────────── */
  const RSVP_ENDPOINT = ''; // optional POST endpoint (Formspree / own API). Empty = save locally.
  const WISHLIST_URL = 'https://example.com/your-wishlist';
  const EVENT_START = new Date('2026-12-12T11:00:00+03:00');
  const EVENT_END = new Date('2026-12-12T17:00:00+03:00');
  const RSVP_DEADLINE = new Date('2026-12-01T23:59:59+03:00');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = n => String(n).padStart(2, '0');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ── TOAST ───────────────────────────────────────────────────────── */
  const toast = $('#toastNotification');
  let toastTimer = 0;
  const showToast = (message, duration = 3600) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
  };

  /* ── HEADER SCROLL STATE ─────────────────────────────────────────── */
  const header = $('#siteHeader');
  const stickyCta = $('#mobileStickyCta');
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 24);
    stickyCta?.classList.toggle('is-visible', y > window.innerHeight * 0.9);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── MOBILE MENU ─────────────────────────────────────────────────── */
  const burger = $('#burgerBtn');
  const mobileMenu = $('#mobileMenu');
  const closeMenu = $('#closeMenuBtn');

  let menuFocusReturn = null;
  const setMenu = open => {
    if (!mobileMenu) return;
    const wasOpen = mobileMenu.classList.contains('is-open');
    if (open && !wasOpen) menuFocusReturn = document.activeElement;
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger?.classList.toggle('is-open', open);
    burger?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);

    if (open) {
      window.requestAnimationFrame(() => closeMenu?.focus());
    } else if (wasOpen && menuFocusReturn && typeof menuFocusReturn.focus === 'function') {
      menuFocusReturn.focus();
      menuFocusReturn = null;
    }
  };
  burger?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('is-open')));
  closeMenu?.addEventListener('click', () => setMenu(false));
  $$('.mobile-nav-link', mobileMenu || document).forEach(link => link.addEventListener('click', () => setMenu(false)));
  mobileMenu?.addEventListener('click', e => {
    if (e.target === mobileMenu) setMenu(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setMenu(false);
    if (e.key !== 'Tab' || !mobileMenu?.classList.contains('is-open')) return;
    const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', mobileMenu)
      .filter(el => el.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ── ACTIVE NAV LINK ON SCROLL ───────────────────────────────────── */
  const sections = ['hero', 'about', 'program', 'dresscode', 'timeline', 'wishlist', 'faq', 'rsvp']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        $$('.nav-link').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
  }

  /* ── SCROLL REVEAL ───────────────────────────────────────────────── */
  const revealEls = $$('.reveal-up, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ── CUSTOM CURSOR ───────────────────────────────────────────────── */
  if (!isTouch && !reduceMotion) {
    const cursor = $('#cursor');
    const label = $('#cursorLabel');
    if (cursor) {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let cx = mx, cy = my;
      let rx = mx, ry = my;
      const dot = $('.cursor-dot', cursor);
      const ring = $('.cursor-ring', cursor);

      window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

      const loop = () => {
        cx += (mx - cx) * 0.55;
        cy += (my - cy) * 0.55;
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        if (dot) dot.style.transform = `translate(${cx}px, ${cy}px)`;
        if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
        if (label) label.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      const hoverables = 'a, button, .palette-item, .program-card, .faq-question, summary, input, select, textarea';
      document.addEventListener('mouseover', e => {
        if (e.target.closest(hoverables)) document.body.classList.add('cursor-hover');
      });
      document.addEventListener('mouseout', e => {
        if (e.target.closest(hoverables)) document.body.classList.remove('cursor-hover');
      });
      document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
    }
  }

  /* ── MAGNETIC BUTTONS ────────────────────────────────────────────── */
  if (!isTouch && !reduceMotion) {
    $$('.magnetic-target').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = `translate(${x * 7}px, ${y * 6}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ── HERO 3D TILT ────────────────────────────────────────────────── */
  const tiltCard = $('#heroPhotoTilt');
  if (tiltCard && !isTouch && !reduceMotion) {
    const glare = $('.tilt-glare', tiltCard);
    let raf = 0;
    tiltCard.addEventListener('mousemove', e => {
      const r = tiltCard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * 12;
      const ry = (px - 0.5) * 14;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        tiltCard.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        if (glare) {
          glare.style.setProperty('--gx', `${px * 100}%`);
          glare.style.setProperty('--gy', `${py * 100}%`);
        }
      });
    });
    tiltCard.addEventListener('mouseleave', () => {
      tiltCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  /* ── COUNTDOWN ───────────────────────────────────────────────────── */
  const timerNodes = {
    days: $('#timerDays'),
    hours: $('#timerHours'),
    minutes: $('#timerMinutes'),
    seconds: $('#timerSeconds'),
  };
  const lastValues = {};

  const setDigit = (key, value) => {
    const node = timerNodes[key];
    if (!node) return;
    const text = pad(value);
    if (node.textContent === text) return;
    node.textContent = text;
    if (!reduceMotion && lastValues[key] !== undefined) {
      node.classList.remove('tick');
      void node.offsetWidth;
      node.classList.add('tick');
    }
    lastValues[key] = value;
  };

  const tick = () => {
    const now = Date.now();
    const diff = Math.max(0, EVENT_START.getTime() - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    setDigit('days', days);
    setDigit('hours', hours);
    setDigit('minutes', minutes);
    setDigit('seconds', seconds);
  };
  tick();
  window.setInterval(tick, 1000);

  /* ── PALETTE PICKER ──────────────────────────────────────────────── */
  $$('.palette-item').forEach(item => {
    item.addEventListener('click', () => {
      const picked = item.classList.contains('is-picked');
      $$('.palette-item').forEach(i => i.classList.remove('is-picked'));
      if (!picked) {
        item.classList.add('is-picked');
        const name = $('strong', item)?.textContent || 'этот вайб';
        showToast(`Отличный выбор! ${name} — твой образ будет незабываемым ✨`, 3000);
      }
    });
  });

  /* ── LOOK GENERATOR ──────────────────────────────────────────────── */
  const looks = [
    { emoji: '💃', title: 'Коктейльное платье в пайетках', sub: 'Серебряные лодочки + акцентные серьги' },
    { emoji: '🖤', title: 'Черное мини + фуксия', sub: 'Яркая помада и клатч с блестками' },
    { emoji: '✨', title: 'Шелковый костюм с пайетками', sub: 'Кроп-топ + широкие брюки + каблук' },
    { emoji: '🌹', title: 'Платье цвета спелой вишни', sub: 'Золотые украшения и атласные перчатки' },
    { emoji: '🦋', title: 'Платье-комбинация шампань', sub: 'Меховая накидка и мини-сумочка' },
    { emoji: '👑', title: 'Корсет + кожаная юбка', sub: 'Дерзкий образ для главной героини вечера' },
    { emoji: '💎', title: 'Белый смокинг оверсайз', sub: 'Стразы, красная помада и высокий каблук' },
    { emoji: '🌸', title: 'Платье с объемными цветами', sub: 'Нежные локоны и жемчужные серьги' },
  ];
  const genBtn = $('#genLookBtn');
  const preview = $('#lookPreviewBadge');
  const genEmoji = $('#genEmoji');
  const genTitle = $('#genTitle');
  const genSub = $('#genSub');
  let lastLook = -1;

  genBtn?.addEventListener('click', () => {
    let idx = Math.floor(Math.random() * looks.length);
    if (idx === lastLook) idx = (idx + 1) % looks.length;
    lastLook = idx;
    const look = looks[idx];

    if (genEmoji) genEmoji.textContent = look.emoji;
    if (genTitle) genTitle.textContent = look.title;
    if (genSub) genSub.textContent = look.sub;

    if (preview && !reduceMotion) {
      preview.classList.remove('flip');
      void preview.offsetWidth;
      preview.classList.add('flip');
    }
    showToast('Образ подобран! Сохрани скриншот и беги за нарядом 💫', 3200);
  });

  /* ── CALENDAR (.ics) ─────────────────────────────────────────────── */
  const escapeICS = v => String(v)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const formatICS = date => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
    return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
  };

  const downloadCalendar = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//30 and Fabulous//Birthday Invitation//RU',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE', 'TZID:Europe/Moscow', 'X-LIC-LOCATION:Europe/Moscow',
      'BEGIN:STANDARD', 'TZOFFSETFROM:+0300', 'TZOFFSETTO:+0300',
      'TZNAME:MSK', 'DTSTART:19700101T000000', 'END:STANDARD', 'END:VTIMEZONE',
      'BEGIN:VEVENT',
      `UID:birthday-30-fabulous-${formatICS(EVENT_START)}@invite`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Moscow:${formatICS(EVENT_START)}`,
      `DTEND;TZID=Europe/Moscow:${formatICS(EVENT_END)}`,
      `SUMMARY:${escapeICS('30 & Fabulous — день рождения')}`,
      `LOCATION:${escapeICS('Калуга')}`,
      `DESCRIPTION:${escapeICS('Мастер-класс, фотосессия и праздничный ужин. Точные адреса придут в закрытый чат накануне. Dress code: fuchsia, silver, wine, champagne.')}`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS('Завтра день рождения! Готовим образ 💖')}`,
      'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR', '',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '30-fabulous-12-12-2026.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('Событие сохранено! 12 декабря, 11:00 — увидимся 🥂', 3800);
    burstConfetti(0.5);
  };

  $('#heroAddToCal')?.addEventListener('click', downloadCalendar);
  $('#ticketSaveBtn')?.addEventListener('click', downloadCalendar);

  /* ── WISHLIST GUARD ──────────────────────────────────────────────── */
  $('#wishlistLink')?.addEventListener('click', e => {
    const href = e.currentTarget.getAttribute('href') || '';
    if (!WISHLIST_URL || /example\.com|your-wishlist/i.test(WISHLIST_URL) || href === WISHLIST_URL) {
      e.preventDefault();
      showToast('Вишлист скоро появится здесь. Пока просто приходи с хорошим настроением 💝', 4200);
    }
  });

  /* ── CONFETTI ENGINE ─────────────────────────────────────────────── */
  let confettiCanvas = null;
  let confettiCtx = null;
  let confettiParticles = [];
  let confettiRaf = 0;
  let confettiUntil = 0;

  const confettiColors = ['#ff5eab', '#ff8cc6', '#ffe9c4', '#f3c98b', '#ffffff', '#c9126c', '#ffd7ea'];

  const ensureConfettiCanvas = () => {
    if (confettiCanvas) return;
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confettiCanvas';
    confettiCanvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext('2d');
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      confettiCanvas.width = window.innerWidth * dpr;
      confettiCanvas.height = window.innerHeight * dpr;
      confettiCanvas.style.width = `${window.innerWidth}px`;
      confettiCanvas.style.height = `${window.innerHeight}px`;
      confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
  };

  const drawParticle = p => {
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.globalAlpha = Math.max(0, Math.min(1, p.life));
    confettiCtx.fillStyle = p.color;
    if (p.shape === 'circle') {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    } else if (p.shape === 'ribbon') {
      confettiCtx.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
    } else {
      confettiCtx.beginPath();
      confettiCtx.moveTo(0, -p.size / 2);
      confettiCtx.lineTo(p.size / 2, 0);
      confettiCtx.lineTo(0, p.size / 2);
      confettiCtx.lineTo(-p.size / 2, 0);
      confettiCtx.closePath();
      confettiCtx.fill();
    }
    confettiCtx.restore();
  };

  const confettiLoop = () => {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < window.innerHeight + 80);
    confettiParticles.forEach(p => {
      p.vy += 0.12;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.0035;
      drawParticle(p);
    });
    if (confettiParticles.length || Date.now() < confettiUntil) {
      confettiRaf = requestAnimationFrame(confettiLoop);
    } else {
      confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      confettiRaf = 0;
    }
  };

  function burstConfetti(intensity = 1) {
    if (reduceMotion) return;
    ensureConfettiCanvas();
    const count = Math.round(120 * intensity);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.42;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 11 * intensity;
      confettiParticles.push({
        x: cx + (Math.random() - 0.5) * 140,
        y: cy + (Math.random() - 0.5) * 90,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 9,
        color: confettiColors[(Math.random() * confettiColors.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        life: 1,
        shape: ['circle', 'ribbon', 'diamond'][(Math.random() * 3) | 0],
      });
    }
    confettiUntil = Date.now() + 1200;
    if (!confettiRaf) confettiRaf = requestAnimationFrame(confettiLoop);
  }

  /* ── RSVP FORM ───────────────────────────────────────────────────── */
  const form = $('#rsvpForm');
  const successBlock = $('#rsvpSuccess');
  const successMsg = $('#successCustomMsg');
  const nameInput = $('#guestName');
  const contactInput = $('#guestContact');

  const validate = () => {
    let ok = true;
    const nameError = $('#nameError');
    const contactError = $('#contactError');

    if (!nameInput || nameInput.value.trim().length < 2) {
      ok = false;
      nameInput?.classList.add('is-invalid');
      nameError?.classList.add('is-visible');
    } else {
      nameInput.classList.remove('is-invalid');
      nameError?.classList.remove('is-visible');
    }

    if (!contactInput || contactInput.value.trim().length < 3) {
      ok = false;
      contactInput?.classList.add('is-invalid');
      contactError?.classList.add('is-visible');
    } else {
      contactInput.classList.remove('is-invalid');
      contactError?.classList.remove('is-visible');
    }
    return ok;
  };

  [nameInput, contactInput].forEach(input => {
    input?.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      input.parentElement?.querySelector('.form-error')?.classList.remove('is-visible');
    });
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) {
      showToast('Проверь, пожалуйста, имя и контакт — это важно 💌', 3200);
      return;
    }

    const data = {
      name: nameInput.value.trim(),
      contact: contactInput.value.trim(),
      attendance: form.querySelector('input[name="attendance"]:checked')?.value || 'yes',
      drink: $('#guestDrink')?.value || '',
      note: $('#guestNote')?.value.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const submitBtn = $('#rsvpSubmitBtn');
    const btnText = $('.btn-text', submitBtn || document);
    const originalText = btnText?.textContent;

    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Отправляю...';

    try {
      if (RSVP_ENDPOINT) {
        await fetch(RSVP_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await new Promise(resolve => window.setTimeout(resolve, 650));
      }
      try { localStorage.setItem('bday30-rsvp', JSON.stringify(data)); } catch (_) { /* private mode */ }
    } catch (_) {
      /* Network failure shouldn't block the guest — the answer is kept locally. */
      try { localStorage.setItem('bday30-rsvp', JSON.stringify(data)); } catch (__) { /* ignore */ }
    }

    const messages = {
      yes: `Спасибо, ${data.name}! Ты в списке самых близких. Жду тебя 12 декабря в 11:00 — будет невероятно! 💖`,
      part: `${data.name}, здорово, что ты будешь! Присоединяйся к нам — точное время подскажу в личных сообщениях. 💫`,
      no: `${data.name}, очень жаль, что не получится. Спасибо, что ответила — обнимаю крепко и обязательно увидимся позже! 💔`,
    };

    if (successMsg) successMsg.textContent = messages[data.attendance] || messages.yes;
    form.hidden = true;
    if (successBlock) {
      successBlock.hidden = false;
      successBlock.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
    if (submitBtn) submitBtn.disabled = false;
    if (btnText && originalText) btnText.textContent = originalText;

    burstConfetti(1.15);
    showToast('Ответ отправлен! Ты — лучшая 💌', 3200);
  });

  $('#confettiAgainBtn')?.addEventListener('click', () => burstConfetti(1));
  $('#resetFormBtn')?.addEventListener('click', () => {
    if (successBlock) successBlock.hidden = true;
    if (form) form.hidden = false;
    form?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  /* ── RESTORE SAVED RSVP ──────────────────────────────────────────── */
  try {
    const saved = JSON.parse(localStorage.getItem('bday30-rsvp') || 'null');
    if (saved && nameInput && contactInput) {
      nameInput.value = saved.name || '';
      contactInput.value = saved.contact || '';
      const radio = form?.querySelector(`input[name="attendance"][value="${saved.attendance}"]`);
      if (radio) radio.checked = true;
      if (saved.drink) {
        const select = $('#guestDrink');
        if (select) select.value = saved.drink;
      }
      if (saved.note) {
        const note = $('#guestNote');
        if (note) note.value = saved.note;
      }
    }
  } catch (_) { /* ignore */ }

  /* ── AMBIENT AUDIO (WebAudio, no assets) ─────────────────────────── */
  const audioBtn = $('#audioToggle');
  let audioCtx = null;
  let audioMaster = null;
  let audioTimer = 0;
  let audioOn = false;
  let step = 0;

  const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 783.99, 659.25, 587.33, 523.25];

  const playChime = () => {
    if (!audioCtx || !audioMaster) return;
    const t = audioCtx.currentTime;
    const freq = NOTES[step % NOTES.length];
    step++;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.075, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioMaster);

    osc.start(t);
    osc.stop(t + 2.7);

    // soft shimmer overtone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);
    gain2.gain.setValueAtTime(0.0001, t);
    gain2.gain.exponentialRampToValueAtTime(0.022, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc2.connect(gain2);
    gain2.connect(audioMaster);
    osc2.start(t);
    osc2.stop(t + 1.7);
  };

  const startAudio = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { showToast('Твой браузер не поддерживает звук, но праздник всё равно будет 🎉'); return; }
    if (!audioCtx) {
      audioCtx = new AC();
      audioMaster = audioCtx.createGain();
      audioMaster.gain.value = 0.6;
      audioMaster.connect(audioCtx.destination);
    }
    audioCtx.resume();
    audioOn = true;
    audioBtn?.classList.add('is-playing');
    audioBtn?.setAttribute('aria-label', 'Выключить праздничные звуки');
    const text = $('.audio-text', audioBtn || document);
    if (text) text.textContent = 'Играет';
    playChime();
    audioTimer = window.setInterval(playChime, 1500);
    showToast('Атмосфера включена ✨ Приятного просмотра!', 2600);
  };

  const stopAudio = () => {
    audioOn = false;
    window.clearInterval(audioTimer);
    audioBtn?.classList.remove('is-playing');
    audioBtn?.setAttribute('aria-label', 'Включить праздничные звуки');
    const text = $('.audio-text', audioBtn || document);
    if (text) text.textContent = 'Звук';
    if (audioCtx) audioCtx.suspend();
  };

  audioBtn?.addEventListener('click', () => {
    if (audioOn) stopAudio(); else startAudio();
  });

  /* ── DEADLINE NOTICE (after RSVP deadline) ───────────────────────── */
  if (Date.now() > RSVP_DEADLINE.getTime()) {
    const sub = $('.rsvp-sub');
    if (sub) {
      sub.innerHTML = 'Форма всё ещё открыта — но <strong>1 декабря</strong> уже прошло. Напиши мне лично, если ещё не ответила: постараюсь всё успеть! 💖';
    }
  }

  /* ── SMOOTH ANCHOR OFFSET FIX ────────────────────────────────────── */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 1024 ? 88 : 70);
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ── BACKGROUND PARTICLES / BOKEH ───────────────────────────────── */
  const canvas = $('#bgCanvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) {
      const lowPower = isTouch || window.innerWidth < 760;
      const targetFrameMs = lowPower ? 1000 / 30 : 1000 / 48;
      let w = 0, h = 0, dpr = 1;
      let particles = [];
      let mouseX = 0, mouseY = 0;
      let targetX = 0, targetY = 0;
      let bgRaf = 0;
      let lastFrame = 0;

      const buildParticles = () => {
        const areaCount = Math.floor((w * h) / (lowPower ? 36000 : 22000));
        const count = Math.min(lowPower ? 46 : 110, Math.max(lowPower ? 20 : 38, areaCount));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.8 + 0.5,
          a: Math.random() * 0.55 + 0.15,
          vy: -(Math.random() * 0.22 + 0.05),
          vx: (Math.random() - 0.5) * 0.14,
          tw: Math.random() * Math.PI * 2,
          tws: Math.random() * 0.02 + 0.006,
          depth: Math.random() * 0.8 + 0.2,
          hue: Math.random() > 0.72 ? 'gold' : 'pink',
        }));
      };

      const resizeCanvas = () => {
        dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.35 : 1.85);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildParticles();
      };

      const draw = timestamp => {
        bgRaf = 0;
        if (document.hidden) return;
        if (timestamp - lastFrame < targetFrameMs) {
          bgRaf = requestAnimationFrame(draw);
          return;
        }
        lastFrame = timestamp;
        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;
        ctx.clearRect(0, 0, w, h);

        particles.forEach(p => {
          p.y += p.vy;
          p.x += p.vx;
          p.tw += p.tws;
          if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -12) p.x = w + 10;
          if (p.x > w + 12) p.x = -10;

          const alpha = p.a * (0.55 + Math.sin(p.tw) * 0.45);
          const px = p.x + mouseX * p.depth;
          const py = p.y + mouseY * p.depth;
          const color = p.hue === 'gold'
            ? `rgba(255, 233, 196, ${alpha})`
            : `rgba(255, 140, 198, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowBlur = p.r * 6;
          ctx.shadowColor = color;
          ctx.fill();
        });
        ctx.shadowBlur = 0;
        bgRaf = requestAnimationFrame(draw);
      };

      const startBackground = () => {
        if (!document.hidden && !bgRaf) {
          lastFrame = 0;
          bgRaf = requestAnimationFrame(draw);
        }
      };
      const stopBackground = () => {
        if (bgRaf) cancelAnimationFrame(bgRaf);
        bgRaf = 0;
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas, { passive: true });
      if (!isTouch) {
        window.addEventListener('mousemove', e => {
          targetX = (e.clientX / window.innerWidth - 0.5) * 26;
          targetY = (e.clientY / window.innerHeight - 0.5) * 26;
        }, { passive: true });
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopBackground();
        else startBackground();
      });
      startBackground();
    }
  }

  /* ── CINEMATIC SCROLL ENGINE ─────────────────────────────────────── */
  const progressFill = $('#scrollProgressFill');
  const marqueeStrip = $('.marquee-strip');
  const heroSection = $('#hero');
  const heroFadeEls = $$('[data-hero-fade]');
  const driftSections = $$('.about-section, .rsvp-section');

  // Elements that float at their own speed while the page scrolls.
  const parallaxEls = $$('[data-parallax]').map(el => ({
    el,
    speed: parseFloat(el.dataset.parallax) || 0.06,
    base: 0,
    current: 0,
    target: 0,
  }));

  const measureParallaxBases = () => {
    parallaxEls.forEach(p => {
      const r = p.el.getBoundingClientRect();
      // Distance of the element center from viewport center, unshifted.
      p.base = (r.top + r.height / 2) - p.current;
    });
  };

  // Word-by-word reveal for the big titles.
  const titles = $$('.section-title, .letter-title, .rsvp-headline, .countdown-title, .wishlist-title');
  titles.forEach(title => {
    const html = title.innerHTML.trim();
    const words = html.split(/(\s+|<br\s*\/?>)/).filter(Boolean);
    const frag = document.createElement('span');
    frag.className = 'title-words';
    let wi = 0;
    words.forEach(part => {
      if (/^<br/.test(part)) { frag.appendChild(document.createElement('br')); return; }
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
      const w = document.createElement('span');
      w.className = 'tw';
      const inner = document.createElement('i');
      inner.textContent = part;
      inner.style.setProperty('--i', wi++);
      w.appendChild(inner);
      frag.appendChild(w);
    });
    title.innerHTML = '';
    title.appendChild(frag);
  });

  let titleObserver = null;
  if ('IntersectionObserver' in window) {
    titleObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelector('.title-words')?.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    titles.forEach(t => titleObserver.observe(t));
  } else {
    $$('.title-words').forEach(t => t.classList.add('is-in'));
  }

  let scrollRaf = 0;
  let lastScrollY = window.scrollY;
  let marqueeShift = 0;

  const cinematicFrame = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);

    // Reading progress bar.
    if (progressFill) progressFill.style.width = `${(y / max) * 100}%`;

    // Marquee drifts with scroll velocity (cinematic side-scroll).
    if (marqueeStrip) {
      marqueeShift += (y - lastScrollY) * 0.55;
      marqueeShift *= 0.9;
      marqueeStrip.style.setProperty('--mx', `${marqueeShift.toFixed(2)}px`);
      marqueeStrip.style.transform = `rotate(-.6deg) scale(1.02) translateX(${marqueeShift.toFixed(2)}px)`;
    }

    // Hero layers recede and fade like a camera dolly-out.
    if (heroSection && heroFadeEls.length) {
      const heroH = heroSection.offsetHeight || vh;
      const p = Math.min(1, Math.max(0, y / (heroH * 0.85)));
      heroFadeEls.forEach((el, i) => {
        const dir = i === 0 ? 1 : 0.45;
        el.style.opacity = String(1 - p * 0.92);
        el.style.transform = `translate3d(0, ${(y * 0.18 * dir).toFixed(1)}px, 0)`;
      });
    }

    // Per-element parallax with light easing. Uses the `translate`
    // property so it composes with CSS transforms (rotations, tilts).
    parallaxEls.forEach(p => {
      p.target = -(p.base - y - vh / 2) * p.speed;
      p.current += (p.target - p.current) * 0.09;
      if (Math.abs(p.current) > 0.05) {
        p.el.style.translate = `0 ${p.current.toFixed(2)}px`;
      } else if (p.el.style.translate) {
        p.el.style.translate = '';
      }
    });

    // Giant outline words in section backgrounds drift on the same rail.
    driftSections.forEach(section => {
      const r = section.getBoundingClientRect();
      const drift = (r.top + r.height / 2 - vh / 2) * 0.06;
      section.style.setProperty('--bg-drift', `${drift.toFixed(1)}px`);
    });

    lastScrollY = y;
    scrollRaf = requestAnimationFrame(cinematicFrame);
  };

  if (!reduceMotion) {
    measureParallaxBases();
    window.addEventListener('resize', measureParallaxBases);
    window.addEventListener('load', measureParallaxBases);
    scrollRaf = requestAnimationFrame(cinematicFrame);
  } else if (progressFill) {
    const fill = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressFill.style.width = `${(window.scrollY / max) * 100}%`;
    };
    window.addEventListener('scroll', fill, { passive: true });
    fill();
  }

  /* ── TACTILE MICRO-INTERACTIONS ──────────────────────────────────── */
  const rippleSelector = '.btn-primary-glow, .btn-secondary-glass, .btn-gen, .btn-wishlist, .btn-header-rsvp, .mobile-cta-btn, .mobile-nav-link';
  $$(rippleSelector).forEach(el => el.classList.add('has-ripple'));
  document.addEventListener('pointerdown', e => {
    if (reduceMotion || e.button > 0) return;
    const target = e.target.closest(rippleSelector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height) * 1.45;
    ripple.className = 'ui-ripple';
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - rect.left - diameter / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - diameter / 2}px`;
    target.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 720);
  }, { passive: true });

  /* ── HERO ENTRANCE ───────────────────────────────────────────────── */
  if (!reduceMotion) {
    document.body.classList.add('is-ready');
  }
})();
