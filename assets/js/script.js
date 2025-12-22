// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.getElementById('site-nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open');
  });
}

const applyScrollReveal = () => {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof IntersectionObserver === 'undefined') {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  items.forEach(el => io.observe(el));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyScrollReveal);
} else {
  applyScrollReveal();
}

const header = document.querySelector('.site-header');
const setHeaderScrollState = () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 8);
};
window.addEventListener('scroll', setHeaderScrollState, { passive: true });
setHeaderScrollState();

// Highlight active nav link based on current page (header and footer)
(() => {
  try {
    const navs = [];
    const headerNav = document.getElementById('site-nav');
    if (headerNav) navs.push(headerNav);
    document.querySelectorAll('.footer-nav').forEach(n => navs.push(n));
    if (!navs.length) return;

    const path = (window.location.pathname || '').toLowerCase();
    const file = (path.split('/').pop() || 'index.html');
    const inResourcesSection = path.includes('/resources/');

    navs.forEach(nav => {
      const links = Array.from(nav.querySelectorAll('a[href]'));
      if (!links.length) return;
      let matched = false;
      if (inResourcesSection && file !== 'resources.html') {
        const res = links.find(a => (a.getAttribute('href') || '').toLowerCase().includes('resources.html'));
        if (res) { res.setAttribute('aria-current', 'page'); matched = true; }
      }
      if (!matched) {
        links.forEach(a => {
          const href = a.getAttribute('href') || '';
          if (/^(https?:)?\/\//i.test(href)) return;
          if ((file === '' || file === 'index.html') && href.replace(/#.*/,'') === '' && href.startsWith('#')) {
            const id = href.slice(1);
            if (id === 'home') { a.setAttribute('aria-current', 'page'); return; }
          }
          if (href.startsWith('#')) return;
          const tmp = document.createElement('a');
          tmp.href = href;
          const hrefFile = (tmp.pathname || '').toLowerCase().split('/').pop();
          if (hrefFile === file) {
            a.setAttribute('aria-current', 'page');
          }
        });
      }
    });
  } catch (_) {}
})();

// Footer year
const y = document.getElementById('year');
if (y) y.textContent = String(new Date().getFullYear());

const form = document.querySelector('.newsletter-form');
if (form) {
  const emailInput = form.querySelector('#email');
  const statusEl = form.querySelector('.form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!emailInput) return;

    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      statusEl.textContent = 'Please enter a valid email address.';
      statusEl.classList.remove('success');
      statusEl.classList.add('error');
      emailInput.focus();
      return;
    }

    // Simulate success without backend
    try {
      const key = 'nova_newsletter_emails';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!list.includes(email)) list.push(email);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) {}

    statusEl.textContent = 'Thanks! You\'re subscribed.';
    statusEl.classList.remove('error');
    statusEl.classList.add('success');
    form.reset();
  });
}

(() => {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const metrics = document.querySelectorAll('.metric');
  if (!metrics.length) return;

  const animate = (el, to, suffix = '', duration = 1200) => {
    if (reduce) { el.textContent = `${to}${suffix}`; return; }
    const start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const val = Math.floor(start + (to - start) * p);
      el.textContent = `${val}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const run = (el) => {
    const raw = (el.textContent || '').trim();
    const m = raw.match(/^(\d+)(.*)$/);
    if (!m) return;
    const target = parseInt(m[1], 10);
    const suffix = m[2] || '';
    animate(el, target, suffix);
  };

  if (typeof IntersectionObserver === 'undefined' || reduce) {
    metrics.forEach(run);
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        run(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  metrics.forEach(m => io.observe(m));
})();

(() => {
  try {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) return;
    const logoImg = document.querySelector('.site-header .logo .logo-img');
    if (logoImg) logoImg.style.animation = 'none';
  } catch (_) {}
})();

(() => {
  const input = document.getElementById('faqSearch');
  if (!input) return;
  const list = document.querySelector('.faq-list');
  const items = list ? Array.from(list.querySelectorAll('.faq-item')) : [];
  const empty = document.getElementById('faqEmpty');
  const normalize = (s) => (s || '').toLowerCase().trim();
  const matches = (item, q) => {
    if (!q) return true;
    const sum = item.querySelector('summary');
    const ans = item.querySelector('.answer');
    const text = (sum ? sum.textContent : '') + ' ' + (ans ? ans.textContent : '');
    return normalize(text).includes(q);
  };
  const apply = () => {
    const q = normalize(input.value);
    let visible = 0;
    items.forEach(d => {
      const ok = matches(d, q);
      d.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    if (empty) empty.style.display = visible ? 'none' : 'block';
  };
  input.addEventListener('input', apply);
  apply();
})();

(() => {
  const cal = document.getElementById('eventsCalendar');
  if (!cal) return;
  const titleEl = cal.querySelector('.cal-title');
  const prevBtn = cal.querySelector('.cal-prev');
  const nextBtn = cal.querySelector('.cal-next');
  const grid = cal.querySelector('.cal-grid');
  const cards = Array.from(document.querySelectorAll('.event-card[data-date]'));
  if (!grid) return;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const toDate = (s) => { const a = s.split('-').map(x=>parseInt(x,10)); return new Date(a[0], a[1]-1, a[2]); };
  const events = cards.map(el => ({ el, date: el.getAttribute('data-date') || '', d: toDate(el.getAttribute('data-date') || '1970-01-01') }))
    .sort((a,b) => a.d - b.d);
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = events.find(e => e.d >= today) || events[0] || null;
  let current = upcoming ? new Date(upcoming.d.getFullYear(), upcoming.d.getMonth(), 1) : new Date();
  const setTitle = (y,m) => { if (titleEl) titleEl.textContent = months[m] + ' ' + y; };
  const byDate = events.reduce((acc, e) => { (acc[e.date] ||= []).push(e); return acc; }, {});
  const render = () => {
    const y = current.getFullYear();
    const m = current.getMonth();
    grid.innerHTML = '';
    setTitle(y,m);
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { const div = document.createElement('div'); div.className = 'cal-dow'; div.textContent = d; grid.appendChild(div); });
    const first = new Date(y,m,1).getDay();
    const days = new Date(y,m+1,0).getDate();
    for (let i=0;i<first;i++){ const e = document.createElement('div'); e.className = 'cal-cell'; grid.appendChild(e); }
    for (let d=1; d<=days; d++){
      const ymd = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-cell cal-day' + (byDate[ymd] ? ' has-event' : '');
      btn.textContent = String(d);
      btn.addEventListener('click', () => {
        const list = byDate[ymd] || [];
        if (!list.length) return;
        const target = list[0].el;
        try {
          target.classList.add('is-highlighted');
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => target.classList.remove('is-highlighted'), 1600);
        } catch (_) {}
      });
      grid.appendChild(btn);
    }
  };
  if (prevBtn) prevBtn.addEventListener('click', () => { current = new Date(current.getFullYear(), current.getMonth()-1, 1); render(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { current = new Date(current.getFullYear(), current.getMonth()+1, 1); render(); });
  render();
})();

(() => {
  const cat = document.getElementById('resCategory');
  const typ = document.getElementById('resType');
  if (!cat && !typ) return;
  const cards = Array.from(document.querySelectorAll('.res-card'));
  const norm = (s) => (s || 'All').toLowerCase();
  const apply = () => {
    const c = norm(cat ? cat.value : 'All');
    const t = norm(typ ? typ.value : 'All');
    let shown = 0;
    cards.forEach(el => {
      const ec = norm(el.getAttribute('data-category'));
      const et = norm(el.getAttribute('data-type'));
      const okC = c === 'all' || c === ec;
      const okT = t === 'all' || t === et;
      const ok = okC && okT;
      el.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
  };
  if (cat) cat.addEventListener('change', apply);
  if (typ) typ.addEventListener('change', apply);
  apply();
})();

// About page: sequential timeline reveal (single active card, sequential is-revealed)
(() => {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const items = Array.from(timeline.querySelectorAll('.tl-item'));
  if (!items.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let nextIndex = 0; // next item to reveal
  let ticking = false;
  const REVEAL_ZONE = 80; // px around viewport center

  const getNodes = () => items.map(it => {
    const node = it.querySelector('.tl-node');
    const r = (node || it).getBoundingClientRect();
    return { el: it, cy: r.top + r.height / 2 };
  });

  const update = () => {
    ticking = false;
    const mid = window.innerHeight / 2;
    const nodes = getNodes();

    // Determine currently active (closest to center)
    let activeIdx = 0, best = Infinity;
    nodes.forEach((n, i) => {
      const d = Math.abs(n.cy - mid);
      if (d < best) { best = d; activeIdx = i; }
    });
    items.forEach((el, i) => el.classList.toggle('is-active', i === activeIdx));

    if (reduce) {
      items.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    // Catch up: reveal any prior items that have already passed well above the center
    while (nextIndex < items.length) {
      const dTop = nodes[nextIndex].cy - mid;
      if (dTop < -REVEAL_ZONE) {
        items[nextIndex].classList.add('is-revealed');
        nextIndex++;
      } else {
        break;
      }
    }

    // Reveal exactly the next item when its node is within the center zone
    if (nextIndex < items.length) {
      const d = Math.abs(nodes[nextIndex].cy - mid);
      if (d <= REVEAL_ZONE) {
        items[nextIndex].classList.add('is-revealed');
        nextIndex++;
      }
    }
  };

  if (reduce) {
    // No animations: reveal all immediately
    items.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // Initial run
  update();
})();

// Join form logic (toggle school other field, validate, and persist locally)
const joinForm = document.getElementById('joinForm');
if (joinForm) {
  const fullName = joinForm.querySelector('#fullName');
  const email = joinForm.querySelector('#email');
  const school = joinForm.querySelector('#school');
  const schoolOtherWrap = document.getElementById('schoolOtherWrap');
  const schoolOther = document.getElementById('schoolOther');
  const role = joinForm.querySelector('#role');
  const status = joinForm.querySelector('.form-status');

  const toggleOther = () => {
    const isOther = school && school.value === 'Other';
    if (schoolOtherWrap) {
      schoolOtherWrap.classList.toggle('hidden', !isOther);
      if (!isOther && schoolOther) schoolOther.value = '';
    }
  };

  if (school) {
    toggleOther();
    school.addEventListener('change', toggleOther);
  }

  joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Basic validation
    const nameOk = fullName && fullName.value.trim().length >= 2;
    const emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    const schoolVal = school ? school.value : '';
    const needsOther = schoolVal === 'Other';
    const schoolOk = !!schoolVal && (!needsOther || (schoolOther && schoolOther.value.trim().length > 1));
    const roleOk = role && role.value.trim().length > 0;

    if (!nameOk || !emailOk || !schoolOk || !roleOk) {
      if (status) {
        status.textContent = 'Please complete all required fields with valid information.';
        status.classList.remove('success');
        status.classList.add('error');
      }
      return;
    }

    // Persist locally for now
    try {
      const key = 'nova_join_applications';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push({
        t: new Date().toISOString(),
        name: fullName.value.trim(),
        email: email.value.trim(),
        school: needsOther && schoolOther ? schoolOther.value.trim() : schoolVal,
        role: role.value.trim()
      });
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) {}

    if (status) {
      status.textContent = 'Application submitted! We\'ll be in touch shortly.';
      status.classList.remove('error');
      status.classList.add('success');
    }
    joinForm.reset();
    toggleOther();
  });
}
// Contact form: send via FormSubmit and show inline success/error
(() => {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;
  const name = contactForm.querySelector('#contact_name');
  const email = contactForm.querySelector('#contact_email');
  const message = contactForm.querySelector('#contact_message');
  const status = contactForm.querySelector('.form-status');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameOk = name && name.value.trim().length >= 2;
    const emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    const msgOk = message && message.value.trim().length > 3;
    if (!nameOk || !emailOk || !msgOk) {
      if (status) {
        status.textContent = 'Please complete all required fields with valid information.';
        status.classList.remove('success');
        status.classList.add('error');
      }
      return;
    }

    try {
      const data = new FormData(contactForm);
      const resp = await fetch(contactForm.action, { method: contactForm.method || 'POST', body: data, headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        if (status) {
          status.textContent = 'Thank you! Your message has been sent to the Nova team.';
          status.classList.remove('error');
          status.classList.add('success');
        }
        contactForm.reset();
      } else {
        if (status) {
          status.textContent = 'Sorry, there was a problem. Please try again or email initiative.nova@gmail.com.';
          status.classList.remove('success');
          status.classList.add('error');
        }
      }
    } catch (_) {
      if (status) {
        status.textContent = 'Network error. Please try again or email initiative.nova@gmail.com.';
        status.classList.remove('success');
        status.classList.add('error');
      }
    }
  });
})();
