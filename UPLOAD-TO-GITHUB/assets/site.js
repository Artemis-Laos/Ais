// The Australian International School — small progressive enhancements. The site works without this file.
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  // Mobile menu
  var burger = document.querySelector('.burger');
  var header = document.querySelector('.header');
  if (burger && header) {
    burger.addEventListener('click', function () {
      var open = doc.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.style.setProperty('--header-bottom', header.getBoundingClientRect().bottom + 'px');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        doc.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header is see-through over the hero, and turns solid navy once the page scrolls
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Pathway rail (home): tabs from Nursery to university
  var stops = Array.prototype.slice.call(document.querySelectorAll('.rail__stop'));
  var fill = document.querySelector('.rail__fill');
  function selectStop(i, focus) {
    stops.forEach(function (s, n) {
      var on = n === i;
      s.setAttribute('aria-selected', on ? 'true' : 'false');
      s.tabIndex = on ? 0 : -1;
      s.classList.toggle('is-done', n < i);
      var panel = document.getElementById(s.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (fill) fill.style.width = (i / (stops.length - 1)) * 80 + '%';
    if (focus) stops[i].focus();
  }
  stops.forEach(function (s, i) {
    s.addEventListener('click', function () { selectStop(i); });
    s.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); selectStop((i + 1) % stops.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); selectStop((i - 1 + stops.length) % stops.length, true); }
    });
  });
  if (stops.length) selectStop(0);

  // Pathway wheel: click a card, use the arrows or arrow keys, or drag sideways to turn it
  document.querySelectorAll('[data-wheel]').forEach(function (wheel) {
    var cards = Array.prototype.slice.call(wheel.querySelectorAll('.wheel__card'));
    var prev = wheel.querySelector('.wheel__btn--prev');
    var next = wheel.querySelector('.wheel__btn--next');
    var active = 0;
    function select(i, focus) {
      active = Math.max(0, Math.min(cards.length - 1, i));
      wheel.style.setProperty('--active', active);
      cards.forEach(function (card, n) {
        var on = n === active;
        card.setAttribute('aria-selected', on ? 'true' : 'false');
        card.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(card.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      prev.disabled = active === 0;
      next.disabled = active === cards.length - 1;
      if (focus) cards[active].focus();
    }
    var dragged = false;
    cards.forEach(function (card, n) {
      card.addEventListener('click', function () { if (!dragged) select(n); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select(active + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select(active - 1, true); }
      });
    });
    prev.addEventListener('click', function () { select(active - 1); });
    next.addEventListener('click', function () { select(active + 1); });

    var startX = null;
    wheel.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.wheel__panels, .wheel__btn')) return;
      startX = e.clientX; dragged = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 60) { dragged = true; select(active + (dx < 0 ? 1 : -1)); startX = e.clientX; }
    });
    window.addEventListener('pointerup', function () { startX = null; setTimeout(function () { dragged = false; }, 0); });
    select(0);
  });

  // Achievement slider: an endless loop. The cards are copied before and after the real set,
  // and whenever the row comes to rest inside a copy it is silently moved back to the same
  // student in the real set, so it never has to rewind.
  document.querySelectorAll('[data-slider]').forEach(function (sl) {
    var track = sl.querySelector('.slider__track');
    var prev = sl.querySelector('.slider__btn--prev');
    var next = sl.querySelector('.slider__btn--next');
    var originals = Array.prototype.slice.call(track.children);
    var count = originals.length;
    function copy(card) {
      var c = card.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      var img = c.querySelector('img');
      if (img) img.loading = 'eager';
      return c;
    }
    originals.forEach(function (card) { track.appendChild(copy(card)); });
    originals.slice().reverse().forEach(function (card) { track.insertBefore(copy(card), track.firstChild); });

    function step() {
      return originals[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
    }
    // scroll position that puts a card in the middle of the row
    function centred(card) { return card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2; }
    function jump(left) { track.scrollTo({ left: left, behavior: 'instant' }); }
    // the card nearest the middle is the one in the spotlight
    function spotlight() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = null, bestD = Infinity;
      Array.prototype.forEach.call(track.children, function (card) {
        var d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid);
        if (d < bestD) { bestD = d; best = card; }
      });
      Array.prototype.forEach.call(track.children, function (card) { card.classList.toggle('is-active', card === best); });
      return best;
    }
    function silently(fn) {
      track.classList.add('no-anim');
      fn();
      spotlight();
      void track.offsetWidth;
      track.classList.remove('no-anim');
    }
    function normalise() {
      var setW = step() * count, base = centred(originals[0]);
      if (track.scrollLeft >= base + setW - 2) silently(function () { jump(track.scrollLeft - setW); });
      else if (track.scrollLeft < base - 2) silently(function () { jump(track.scrollLeft + setW); });
    }
    function go(dir) {
      normalise();
      track.scrollBy({ left: dir * step(), behavior: 'smooth' });
    }
    silently(function () { jump(centred(originals[0])); });

    var idle = null, ticking = false;
    track.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spotlight(); }); }
      clearTimeout(idle);
      idle = setTimeout(normalise, 140);
    }, { passive: true });
    window.addEventListener('resize', function () { silently(function () { jump(centred(originals[0])); }); });
    // clicking a faded neighbour brings it into the spotlight
    track.addEventListener('click', function (e) {
      var card = e.target.closest('.honour');
      if (card && !card.classList.contains('is-active')) { track.scrollTo({ left: centred(card), behavior: 'smooth' }); restart(); }
    });
    prev.addEventListener('click', function () { go(-1); restart(); });
    next.addEventListener('click', function () { go(1); restart(); });

    // Moves by itself every 6 seconds; waits while someone is hovering, touching or tabbing through it
    var timer = null, paused = false;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function restart() {
      clearInterval(timer);
      if (still) return;
      timer = setInterval(function () { if (!paused && !document.hidden) go(1); }, 6000);
    }
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) {
      sl.addEventListener(ev, function () { paused = true; }, { passive: true });
    });
    ['mouseleave', 'focusout', 'touchend'].forEach(function (ev) {
      sl.addEventListener(ev, function () { paused = false; restart(); }, { passive: true });
    });
    restart();
  });

  // Videos: load the YouTube player only when someone presses play
  document.querySelectorAll('.video[data-yt]').forEach(function (v) {
    v.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + v.dataset.yt + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      f.title = v.getAttribute('aria-label') || 'Video';
      v.replaceChildren(f);
    });
  });

  // Enquiry form: opens the visitor's email app with the message filled in
  var form = document.querySelector('[data-enquiry]');
  if (form) {
    // Phone: letters cannot be typed at all, and it needs 8 to 15 digits. Email: must look like name@domain.tld.
    var phone = form.querySelector('[name="phone"]');
    var email = form.querySelector('[name="email"]');
    function check(input, ok, message) {
      var err = document.getElementById(input.id + '-err');
      var bad = input.value !== '' && !ok;
      input.setCustomValidity(bad ? message : '');
      input.classList.toggle('is-invalid', bad);
      if (err) err.textContent = bad ? message : '';
      return !bad;
    }
    function checkPhone() {
      var digits = phone.value.replace(/\D/g, '').length;
      return check(phone, digits >= 8 && digits <= 15, 'Enter a full phone number, 8 to 15 digits.');
    }
    function checkEmail() {
      var v = email.value.trim();
      var ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(v) && v.indexOf('..') === -1;
      return check(email, ok, 'Enter a valid email address, like name@example.com.');
    }
    if (phone) {
      phone.addEventListener('input', function () {
        var v = phone.value.replace(/[^0-9+()\- ]/g, '').replace(/(?!^)\+/g, '');
        if (v !== phone.value) phone.value = v;
        if (phone.classList.contains('is-invalid')) checkPhone();
      });
      phone.addEventListener('blur', checkPhone);
    }
    if (email) {
      email.addEventListener('input', function () { if (email.classList.contains('is-invalid')) checkEmail(); });
      email.addEventListener('blur', checkEmail);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okPhone = !phone || checkPhone(), okEmail = !email || checkEmail();
      if (!okPhone || !okEmail) { (okEmail ? phone : email).focus(); return; }
      var d = new FormData(form);
      var body = 'Name: ' + d.get('name') +
        '\nEmail: ' + d.get('email') + '\nPhone: ' + d.get('phone') +
        '\nEnquiry about: ' + d.get('topic') + '\n\n' + d.get('message');
      window.location.href = 'mailto:info@aisedulaos.com?subject=' +
        encodeURIComponent('Website enquiry: ' + d.get('topic')) + '&body=' + encodeURIComponent(body);
      form.querySelector('.form__status').textContent =
        'Your email app should now open with your message ready to send. If it does not, email info@aisedulaos.com or call +856 20 2222 0526.';
    });
  }

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
