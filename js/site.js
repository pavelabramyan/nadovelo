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
      var comment = form.comment.value.trim();
      if (!name || phone.replace(/\D/g, '').length < 11) return;

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

  document.querySelectorAll('.gallery-grid').forEach(function (grid) {
    grid.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      grid.scrollLeft += e.deltaY;
    }, { passive: false });
  });
})();
