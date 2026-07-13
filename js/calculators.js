(function () {
  'use strict';

  const fmt = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
  const fmtShort = (n) => Math.round(n).toLocaleString('ru-RU');

  const MODELS = {
    standard: { name: '1 АКБ 60V / 21 Ah', weekly: 3500, batteries: 1, hours: '8–10' },
    pro: { name: '2 АКБ 60V / 21 Ah', weekly: 4200, batteries: 2, hours: '10–12' }
  };

  const BUYOUT_MODELS = {
    cross: {
      name: 'Monster CROSS',
      retail: 85000,
      plans: {
        2: { payment: 45500, total: 91000 },
        4: { payment: 25000, total: 100000 },
        6: { payment: 17000, total: 102000 }
      }
    },
    pro: {
      name: 'Monster PRO',
      retail: null,
      plans: {
        2: { payment: 50500, total: 101000 },
        4: { payment: 27500, total: 110000 },
        6: { payment: 19000, total: 114000 }
      }
    }
  };

  const tabs = document.querySelectorAll('.calc-tab');
  const panels = document.querySelectorAll('.calc-panel');

  function switchTab(name) {
    const panelId = name === 'buyout' ? 'calc-buyout' : 'calc-rent';
    tabs.forEach((tab) => {
      const active = tab.dataset.panel === panelId;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((panel) => {
      const active = panel.id === panelId;
      panel.classList.toggle('active', active);
      if (active) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
    updateRentCalc();
    updateBuyoutCalc();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.panel === 'calc-buyout' ? 'buyout' : 'rent'));
  });

  document.querySelectorAll('.calc-toggle-group').forEach((group) => {
    group.querySelectorAll('.calc-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.calc-toggle').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updateRentCalc();
        updateBuyoutCalc();
      });
    });
  });

  const rentEls = {
    model: document.getElementById('rent-model'),
    period: document.getElementById('rent-period'),
    periodDisplay: document.getElementById('rent-period-val'),
    total: document.getElementById('rent-total'),
    perDay: document.getElementById('rent-per-day'),
    perWeek: document.getElementById('rent-per-week'),
    firstPay: document.getElementById('rent-first-pay'),
    tip: document.getElementById('rent-tip'),
    earnings: document.getElementById('rent-earnings'),
    orders: document.getElementById('rent-orders'),
    ordersDisplay: document.getElementById('rent-orders-val')
  };

  function weeksLabel(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return n + ' нед.';
    return n + ' нед.';
  }

  function syncFormFromRent() {
    if (!window.NadoVeloSite || !rentEls.model) return;
    if (!document.getElementById('calc-rent')?.classList.contains('active')) return;
    const model = MODELS[rentEls.model.value];
    const text = 'Аренда: ' + model.name + ', ' + rentEls.periodDisplay.textContent + ', итого ' + rentEls.total.textContent;
    window.NadoVeloSite.updateFormComment(text);
  }

  function updateRentCalc() {
    if (!rentEls.model) return;

    const model = MODELS[rentEls.model.value];
    const weeks = parseInt(rentEls.period.value, 10) || 1;
    const weekly = model.weekly;
    const daily = weekly / 7;
    const rentTotal = weekly * weeks;
    const firstPayment = weekly;

    rentEls.periodDisplay.textContent = weeksLabel(weeks);
    rentEls.period.setAttribute('aria-valuetext', weeksLabel(weeks));
    rentEls.total.textContent = fmt(rentTotal);
    rentEls.perWeek.textContent = fmt(weekly);
    rentEls.perDay.textContent = fmt(daily);
    rentEls.firstPay.textContent = fmt(firstPayment);

    const ordersPerDay = parseInt(rentEls.orders.value, 10);
    const avgOrderPay = 180;
    const dailyEarnings = ordersPerDay * avgOrderPay;
    const netDaily = dailyEarnings - daily;
    const netTotal = netDaily * weeks * 7;

    rentEls.ordersDisplay.textContent = ordersPerDay;
    if (netDaily > 0) {
      rentEls.earnings.innerHTML =
        '<span class="calc-disclaimer">Примерная оценка, не гарантия дохода.</span> При ' + ordersPerDay +
        ' заказах/день (~' + fmt(dailyEarnings) + ') чистыми <strong>' + fmt(netDaily) + '/день</strong>, за период — <strong>' + fmt(netTotal) + '</strong>';
    } else {
      rentEls.earnings.innerHTML =
        '<span class="calc-disclaimer">Примерная оценка.</span> Увеличьте количество заказов — при текущем тарифе расходы превышают доход';
    }

    rentEls.tip.textContent =
      model.name + ': до ' + model.hours + ' ч работы. Недельный тариф ' + fmt(weekly) +
      ' (~' + fmt(daily) + '/сутки). Без залога. Приведи друга — получи бонус.';

    syncFormFromRent();
  }

  if (rentEls.model) {
    ['change', 'input'].forEach((ev) => {
      rentEls.model.addEventListener(ev, updateRentCalc);
      rentEls.period.addEventListener(ev, updateRentCalc);
      rentEls.orders.addEventListener(ev, updateRentCalc);
    });
    updateRentCalc();
  }

  const buyEls = {
    model: document.getElementById('buyout-model'),
    term: () => document.querySelector('#buyout-term-group .calc-toggle.active')?.dataset.value || '2',
    termVal: document.getElementById('buyout-term-val'),
    retailHint: document.getElementById('buyout-retail-hint'),
    payment: document.getElementById('buyout-payment'),
    paymentLabel: document.getElementById('buyout-payment-label'),
    total: document.getElementById('buyout-total'),
    overpay: document.getElementById('buyout-overpay'),
    tip: document.getElementById('buyout-tip')
  };

  function syncFormFromBuyout() {
    if (!window.NadoVeloSite || !buyEls.model) return;
    if (!document.getElementById('calc-buyout')?.classList.contains('active')) return;
    const model = BUYOUT_MODELS[buyEls.model.value];
    const text = 'Выкуп: ' + model.name + ', ' + buyEls.term() + ' мес., платёж ' + buyEls.payment.textContent + '/мес.';
    window.NadoVeloSite.updateFormComment(text);
  }

  function updateBuyoutCalc() {
    if (!buyEls.model) return;

    const model = BUYOUT_MODELS[buyEls.model.value];
    const months = buyEls.term();
    const plan = model.plans[months];
    if (!plan) return;

    buyEls.termVal.textContent = months + ' мес.';
    buyEls.payment.textContent = fmt(plan.payment);
    buyEls.paymentLabel.textContent = 'в месяц';
    buyEls.total.textContent = fmt(plan.total);

    if (model.retail != null) {
      const overpay = plan.total - model.retail;
      buyEls.overpay.textContent = (overpay >= 0 ? '+' : '') + fmt(overpay);
      buyEls.retailHint.textContent = 'Розничная цена ' + model.name + ' — ' + fmtShort(model.retail) + ' ₽';
    } else {
      buyEls.overpay.textContent = '—';
      buyEls.retailHint.textContent = model.name + ' — цена в рассрочку по прайсу';
    }

    buyEls.tip.textContent =
      model.name + ': ' + months + ' платежа по ' + fmt(plan.payment) +
      ', итого ' + fmt(plan.total) + '. Без кредитной истории.';

    syncFormFromBuyout();
  }

  if (buyEls.model) {
    buyEls.model.addEventListener('change', updateBuyoutCalc);
    document.getElementById('buyout-term-group')?.addEventListener('click', () => setTimeout(updateBuyoutCalc, 0));
    updateBuyoutCalc();
  }

  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    if (el.dataset.static === 'true') return;
    const num = parseFloat(target);
    if (Number.isNaN(num)) {
      el.textContent = prefix + target + suffix;
      return;
    }
    el.textContent = prefix + (num >= 1000 ? Math.round(num).toLocaleString('ru-RU') : target) + suffix;
    el.classList.add('counted');
  });

  window.NadoVeloCalc = { switchTab: switchTab };
})();
