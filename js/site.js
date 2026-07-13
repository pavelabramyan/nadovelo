(function () {
  'use strict';

  var SITE = {
    phone: '+79093408841',
    phoneDisplay: '+7 (909) 340-88-41',
    telegram: 'https://t.me/nadovelo',
    telegramDisplay: 't.me/nadovelo',
    vk: 'https://vk.com/nadovelosaratov',
    address: 'г. Саратов, ул. Чапаева, 8/12',
    mapQuery: 'Саратов, ул. Чапаева, 8/12',
    metrikaId: 0
  };

  var header = document.getElementById('header');
  var nav = document.getElementById('site-nav');
  var backdrop = document.getElementById('nav-backdrop');
  var burger = document.querySelector('.burger');
  var form = document.getElementById('lead-form');
  var commentField = document.getElementById('comment');

  function openMenu() {
    nav.classList.add('open');
    nav.removeAttribute('hidden');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    if (backdrop) {
      backdrop.removeAttribute('hidden');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    trapFocus(nav);
  }

  function closeMenu() {
    nav.classList.remove('open');
    nav.setAttribute('hidden', '');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    if (backdrop) {
      backdrop.setAttribute('hidden', '');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    releaseFocusTrap();
  }

  var focusTrapHandler = null;
  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container) {
    var nodes = container.querySelectorAll(focusableSelector);
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    focusTrapHandler = function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', focusTrapHandler);
    first.focus();
  }

  function releaseFocusTrap() {
    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  if (burger && nav) {
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (nav.classList.contains('open')) closeMenu();
      else openMenu();
    });
    nav.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    if (backdrop) {
      backdrop.addEventListener('click', closeMenu);
    }
    document.addEventListener('click', function () {
      if (nav.classList.contains('open')) closeMenu();
    });
    nav.querySelectorAll('.nav-links a, .nav-mobile-cta a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
        burger.focus();
      }
    });
  }

  window.addEventListener('scroll', function () {
    if (header) header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  var scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
    if (!scrollProgress) return;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
    scrollProgress.style.transform = 'scaleX(' + progress + ')';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  document.querySelectorAll('.faq-question').forEach(function (btn) {
    var answer = btn.nextElementSibling;
    btn.setAttribute('aria-expanded', 'false');
    if (answer) answer.setAttribute('hidden', '');
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        var q = i.querySelector('.faq-question');
        var a = i.querySelector('.faq-answer');
        if (q) q.setAttribute('aria-expanded', 'false');
        if (a) a.setAttribute('hidden', '');
      });
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (answer) answer.removeAttribute('hidden');
      }
    });
  });

  var floatingCta = document.getElementById('floatingCta');
  function checkFloatingCta() {
    if (!floatingCta) return;
    floatingCta.classList.toggle('visible', window.innerWidth <= 768 && window.scrollY > 400);
  }
  window.addEventListener('scroll', checkFloatingCta, { passive: true });
  window.addEventListener('resize', checkFloatingCta);

  var scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', function () {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function formatPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 7) out += '-' + digits.slice(7, 9);
    if (digits.length >= 9) out += '-' + digits.slice(9, 11);
    return out;
  }

  var phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      phoneInput.value = formatPhone(phoneInput.value);
      phoneInput.setCustomValidity('');
    });
    phoneInput.addEventListener('focus', function () {
      if (!phoneInput.value) phoneInput.value = '+7 (';
    });
  }

  function buildLeadMessage(data) {
    var lines = ['Заявка с сайта НадоВело', 'Имя: ' + data.name, 'Телефон: ' + data.phone];
    if (data.comment) lines.push('Комментарий: ' + data.comment);
    return lines.join('\n');
  }

  function trackGoal(name) {
    if (typeof ym === 'function' && SITE.metrikaId) ym(SITE.metrikaId, 'reachGoal', name);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var comment = (form.comment && form.comment.value || '').trim();
      var phoneIsValid = phone.replace(/\D/g, '').length === 11;
      form.phone.setCustomValidity(phoneIsValid ? '' : 'Введите телефон полностью');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      trackGoal('lead_submit');
      var message = buildLeadMessage({ name: name, phone: phone, comment: comment });
      var tgUrl = SITE.telegram + '?text=' + encodeURIComponent(message);
      window.open(tgUrl, '_blank', 'noopener');

      var success = document.getElementById('form-success');
      if (success) {
        success.hidden = false;
        form.hidden = true;
      }
    });
  }

  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      trackGoal(el.getAttribute('data-track'));
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      if (!id) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (link.dataset.calcTab && window.NadoVeloCalc) {
        window.NadoVeloCalc.switchTab(link.dataset.calcTab);
      }
    });
  });

  if (location.hash) {
    setTimeout(function () {
      if (location.hash === '#calculators' && window.NadoVeloCalc) {
        var tab = new URLSearchParams(location.search).get('tab') || 'rent';
        if (location.hash.includes('buyout')) tab = 'buyout';
        window.NadoVeloCalc.switchTab(tab);
      }
      document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  document.querySelectorAll('[data-calc-tab]').forEach(function (el) {
    el.addEventListener('click', function () {
      setTimeout(function () {
        if (window.NadoVeloCalc) window.NadoVeloCalc.switchTab(el.dataset.calcTab);
      }, 300);
    });
  });

  window.NadoVeloSite = {
    updateFormComment: function (text) {
      if (commentField && !commentField.dataset.userEdited) {
        commentField.value = text;
      }
    },
    markCommentEdited: function () {
      if (commentField) commentField.dataset.userEdited = '1';
    }
  };

  if (commentField) {
    commentField.addEventListener('input', function () {
      commentField.dataset.userEdited = '1';
    });
  }

  if (SITE.metrikaId) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    ym(SITE.metrikaId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  document.querySelectorAll('.stagger-reveal').forEach(function (el) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
    observer.observe(el);
  });

  document.querySelectorAll('[data-gallery]').forEach(function (root) {
    var mainImg = root.querySelector('[data-gallery-main]');
    var captionEl = root.querySelector('[data-gallery-caption]');
    var counterEl = root.querySelector('[data-gallery-counter]');
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('.gallery-thumb'));
    var prevBtn = root.querySelector('[data-gallery-prev]');
    var nextBtn = root.querySelector('[data-gallery-next]');
    var stage = root.querySelector('.gallery-stage');
    if (!mainImg || !thumbs.length) return;

    var index = Math.max(0, thumbs.findIndex(function (t) { return t.classList.contains('is-active'); }));
    if (index < 0) index = 0;
    var touchX = null;

    function scrollThumbIntoView(thumb) {
      if (!thumb || !thumb.scrollIntoView) return;
      thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    function setIndex(next, focusThumb) {
      var total = thumbs.length;
      index = ((next % total) + total) % total;
      var active = thumbs[index];
      thumbs.forEach(function (thumb, i) {
        var on = i === index;
        thumb.classList.toggle('is-active', on);
        thumb.setAttribute('aria-selected', on ? 'true' : 'false');
        thumb.tabIndex = on ? 0 : -1;
      });

      var src = active.getAttribute('data-src');
      var fallback = active.getAttribute('data-fallback');
      var alt = active.getAttribute('data-alt') || '';
      var caption = active.getAttribute('data-caption') || '';

      mainImg.classList.add('is-switching');
      window.setTimeout(function () {
        mainImg.onerror = function () {
          if (fallback && mainImg.src.indexOf(fallback) === -1) mainImg.src = fallback;
        };
        mainImg.src = src;
        mainImg.alt = alt;
        if (captionEl) captionEl.textContent = caption;
        if (counterEl) counterEl.textContent = (index + 1) + ' / ' + total;
        mainImg.classList.remove('is-switching');
      }, 120);

      scrollThumbIntoView(active);
      if (focusThumb) active.focus({ preventScroll: true });
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { setIndex(i); });
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIndex(index + 1, true);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setIndex(index - 1, true);
        } else if (e.key === 'Home') {
          e.preventDefault();
          setIndex(0, true);
        } else if (e.key === 'End') {
          e.preventDefault();
          setIndex(thumbs.length - 1, true);
        }
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { setIndex(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { setIndex(index + 1); });

    if (stage) {
      stage.addEventListener('touchstart', function (e) {
        touchX = e.changedTouches[0].clientX;
      }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (touchX == null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) < 40) return;
        setIndex(dx < 0 ? index + 1 : index - 1);
      }, { passive: true });
    }

    setIndex(index);
  });

  var premiumHero = document.querySelector('[data-three-hero]');
  var premiumHeroCard = premiumHero && premiumHero.querySelector('.hero-product-card');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (premiumHero && premiumHeroCard && finePointer && !reduceMotion) {
    var parallaxFrame = null;
    var parallaxCurrent = { x: 0, y: 0 };
    var parallaxTarget = { x: 0, y: 0 };

    function renderHeroParallax() {
      parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * 0.09;
      parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * 0.09;
      premiumHeroCard.style.setProperty('--tilt-x', (parallaxCurrent.x * 3.6).toFixed(2) + 'deg');
      premiumHeroCard.style.setProperty('--tilt-y', (parallaxCurrent.y * -3).toFixed(2) + 'deg');
      premiumHeroCard.style.setProperty('--shift-x', (parallaxCurrent.x * 5).toFixed(2) + 'px');
      premiumHeroCard.style.setProperty('--shift-y', (parallaxCurrent.y * 4).toFixed(2) + 'px');

      if (Math.abs(parallaxTarget.x - parallaxCurrent.x) > 0.002
        || Math.abs(parallaxTarget.y - parallaxCurrent.y) > 0.002) {
        parallaxFrame = requestAnimationFrame(renderHeroParallax);
      } else {
        parallaxFrame = null;
      }
    }

    function requestHeroParallax() {
      if (!parallaxFrame) parallaxFrame = requestAnimationFrame(renderHeroParallax);
    }

    premiumHero.addEventListener('pointermove', function (event) {
      var rect = premiumHero.getBoundingClientRect();
      parallaxTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      parallaxTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      requestHeroParallax();
    }, { passive: true });

    premiumHero.addEventListener('pointerleave', function () {
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
      requestHeroParallax();
    }, { passive: true });
  }

  if (document.body.classList.contains('premium-site') && !reduceMotion) {
    var premiumRevealItems = document.querySelectorAll(
      'main section:not(.hero) .section-label, '
      + 'main section:not(.hero) h2, '
      + '.calc-header > p, '
      + '.cta-banner-inner > *, '
      + '.contacts-inner'
    );
    var premiumRevealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        premiumRevealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    premiumRevealItems.forEach(function (item, index) {
      item.classList.add('premium-reveal');
      item.style.setProperty('--reveal-delay', Math.min(index % 3, 2) * 60 + 'ms');
      premiumRevealObserver.observe(item);
    });
  }
})();
