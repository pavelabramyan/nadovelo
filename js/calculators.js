(function () {
  'use strict';

  const fmt = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
  const fmtShort = (n) => Math.round(n).toLocaleString('ru-RU');

  const MODELS = {
    standard: { name: 'Стандарт', daily: 500, batteries: 1, deposit: 3000, hours: '8–10' },
    pro: { name: 'Про (2 АКБ)', daily: 600, batteries: 2, deposit: 3000, hours: '10–12' },
    monthly: { name: 'Месячный', daily: 400, monthly: 12000, batteries: 1, deposit: 5000, hours: '10–12' }
  };

  const BUYOUT_MODELS = {
    standard: { name: 'Стандарт', retail: 55000 },
    pro: { name: 'Про (2 АКБ)', retail: 72000 },
    premium: { name: 'Премиум', retail: 89000 }
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
    periodType: () => document.querySelector('#rent-period-group .calc-toggle.active')?.dataset.value || 'days',
    period: document.getElementById('rent-period'),
    periodDisplay: document.getElementById('rent-period-val'),
    extraBattery: document.getElementById('rent-extra-battery'),
    insurance: document.getElementById('rent-insurance'),
    total: document.getElementById('rent-total'),
    perDay: document.getElementById('rent-per-day'),
    perWeek: document.getElementById('rent-per-week'),
    firstPay: document.getElementById('rent-first-pay'),
    deposit: document.getElementById('rent-deposit-val'),
    breakdown: document.getElementById('rent-breakdown-bar'),
    tip: document.getElementById('rent-tip'),
    earnings: document.getElementById('rent-earnings'),
    orders: document.getElementById('rent-orders'),
    ordersDisplay: document.getElementById('rent-orders-val')
  };

  function getRentDays() {
    const val = parseInt(rentEls.period.value, 10);
    const type = rentEls.periodType();
    if (type === 'weeks') return val * 7;
    if (type === 'months') return val * 30;
    return val;
  }

  function updateRentPeriodLabel() {
    const type = rentEls.periodType();
    const labels = { days: 'дней', weeks: 'нед.', months: 'мес.' };
    rentEls.periodDisplay.textContent = rentEls.period.value + ' ' + labels[type];
    const max = type === 'days' ? 90 : type === 'weeks' ? 12 : 6;
    rentEls.period.max = max;
    if (parseInt(rentEls.period.value, 10) > max) rentEls.period.value = max;
  }

  function syncFormFromRent() {
    if (!window.NadoVeloSite || !rentEls.model) return;
    if (!document.getElementById('calc-rent')?.classList.contains('active')) return;
    const model = MODELS[rentEls.model.value];
    const days = getRentDays();
    const text = 'Аренда: ' + model.name + ', ' + rentEls.periodDisplay.textContent + ', итого ' + rentEls.total.textContent;
    window.NadoVeloSite.updateFormComment(text);
  }

  function updateRentCalc() {
    if (!rentEls.model) return;
    updateRentPeriodLabel();

    const modelKey = rentEls.model.value;
    const model = MODELS[modelKey];
    const days = getRentDays();

    let dailyRate = model.daily;
    if (rentEls.periodType() === 'months' && model.monthly) {
      dailyRate = model.monthly / 30;
    }

    const extraBatteryCost = rentEls.extraBattery.checked ? 150 : 0;
    const insuranceCost = rentEls.insurance.checked ? 50 : 0;
    const effectiveDaily = dailyRate + extraBatteryCost + insuranceCost;

    const rentTotal = effectiveDaily * days;
    const deposit = model.deposit;
    const firstPayment = effectiveDaily + deposit;

    rentEls.total.textContent = fmt(rentTotal);
    rentEls.perDay.textContent = fmt(effectiveDaily);
    rentEls.perWeek.textContent = fmt(effectiveDaily * 7);
    rentEls.firstPay.textContent = fmt(firstPayment);
    rentEls.deposit.textContent = fmt(deposit);

    const totalWithDeposit = rentTotal + deposit;
    const rentPct = (rentTotal / totalWithDeposit) * 100;
    const depPct = 100 - rentPct;
    rentEls.breakdown.innerHTML =
      '<div class="calc-chart-segment rent" style="width:' + rentPct + '%"></div>' +
      '<div class="calc-chart-segment deposit" style="width:' + depPct + '%"></div>';

    const ordersPerDay = parseInt(rentEls.orders.value, 10);
    const avgOrderPay = 180;
    const dailyEarnings = ordersPerDay * avgOrderPay;
    const netDaily = dailyEarnings - effectiveDaily;
    const netTotal = netDaily * days;

    rentEls.ordersDisplay.textContent = ordersPerDay;
    if (netDaily > 0) {
      rentEls.earnings.innerHTML =
        '<span class="calc-disclaimer">Примерная оценка, не гарантия дохода.</span> При ' + ordersPerDay +
        ' заказах/день (~' + fmt(dailyEarnings) + ') чистыми <strong>' + fmt(netDaily) + '/день</strong>, за период — <strong>' + fmt(netTotal) + '</strong>';
    } else {
      rentEls.earnings.innerHTML =
        '<span class="calc-disclaimer">Примерная оценка.</span> Увеличьте количество заказов — при текущем тарифе расходы превышают доход';
    }

    const weekDisc = days >= 7 ? ' Скидка 5% при аренде от 7 дней — уточняйте у менеджера.' : '';
    rentEls.tip.textContent =
      model.name + ': ' + model.batteries + ' АКБ, до ' + model.hours + ' ч работы. Первый день бесплатно для новых клиентов.' + weekDisc;

    syncFormFromRent();
  }

  if (rentEls.model) {
    ['change', 'input'].forEach((ev) => {
      rentEls.model.addEventListener(ev, updateRentCalc);
      rentEls.period.addEventListener(ev, updateRentCalc);
      rentEls.extraBattery.addEventListener(ev, updateRentCalc);
      rentEls.insurance.addEventListener(ev, updateRentCalc);
      rentEls.orders.addEventListener(ev, updateRentCalc);
    });
    document.getElementById('rent-period-group')?.addEventListener('click', () => setTimeout(updateRentCalc, 0));
    updateRentCalc();
  }

  const buyEls = {
    model: document.getElementById('buyout-model'),
    retail: document.getElementById('buyout-retail'),
    retailDisplay: document.getElementById('buyout-retail-val'),
    down: document.getElementById('buyout-down'),
    downDisplay: document.getElementById('buyout-down-val'),
    term: document.getElementById('buyout-term'),
    termDisplay: document.getElementById('buyout-term-val'),
    freq: () => document.querySelector('#buyout-freq-group .calc-toggle.active')?.dataset.value || 'week',
    payment: document.getElementById('buyout-payment'),
    paymentLabel: document.getElementById('buyout-payment-label'),
    total: document.getElementById('buyout-total'),
    overpay: document.getElementById('buyout-overpay'),
    overpayBadge: document.getElementById('buyout-overpay-badge'),
    compareRent: document.getElementById('buyout-compare-rent'),
    breakdown: document.getElementById('buyout-breakdown-bar'),
    tip: document.getElementById('buyout-tip'),
    schedule: document.getElementById('buyout-schedule')
  };

  function syncFormFromBuyout() {
    if (!window.NadoVeloSite || !buyEls.model) return;
    if (!document.getElementById('calc-buyout')?.classList.contains('active')) return;
    const model = BUYOUT_MODELS[buyEls.model.value];
    const text = 'Выкуп: ' + model.name + ', платёж ' + buyEls.payment.textContent + ' ' + buyEls.paymentLabel.textContent;
    window.NadoVeloSite.updateFormComment(text);
  }

  function updateBuyoutCalc() {
    if (!buyEls.model) return;

    const modelKey = buyEls.model.value;
    const model = BUYOUT_MODELS[modelKey];
    const retail = parseInt(buyEls.retail.value, 10);
    const down = parseInt(buyEls.down.value, 10);
    const termMonths = parseInt(buyEls.term.value, 10);
    const isWeekly = buyEls.freq() === 'week';

    buyEls.retailDisplay.textContent = fmtShort(retail) + ' ₽';
    buyEls.downDisplay.textContent = fmtShort(down) + ' ₽';
    buyEls.termDisplay.textContent = termMonths + ' мес.';

    const remaining = Math.max(retail - down, 0);
    const periods = isWeekly ? termMonths * 4 : termMonths;
    const markup = 1.08;
    const totalWithMarkup = remaining * markup;
    const payment = periods > 0 ? totalWithMarkup / periods : 0;
    const grandTotal = down + totalWithMarkup;
    const overpay = grandTotal - retail;
    const overpayPct = retail > 0 ? ((overpay / retail) * 100).toFixed(1) : 0;

    buyEls.payment.textContent = fmt(payment);
    buyEls.paymentLabel.textContent = isWeekly ? 'в неделю' : 'в месяц';
    buyEls.total.textContent = fmt(grandTotal);
    buyEls.overpay.textContent = (overpay >= 0 ? '+' : '') + fmt(overpay) + ' (' + overpayPct + '%)';

    if (overpay <= retail * 0.1) {
      buyEls.overpayBadge.className = 'calc-compare-badge good';
      buyEls.overpayBadge.textContent = 'Выгоднее чистой аренды';
    } else {
      buyEls.overpayBadge.className = 'calc-compare-badge neutral';
      buyEls.overpayBadge.textContent = 'Сопоставимо с долгой арендой';
    }

    const rentDaily = MODELS.pro.daily;
    const rentCost = rentDaily * termMonths * 30;
    const savings = rentCost - grandTotal;
    buyEls.compareRent.textContent =
      savings > 0
        ? 'Экономия ' + fmt(savings) + ' vs аренда ' + termMonths + ' мес. (' + fmt(rentCost) + ')'
        : 'Аренда на ' + termMonths + ' мес. обойдётся в ' + fmt(rentCost);

    const downPct = grandTotal > 0 ? (down / grandTotal) * 100 : 0;
    const payPct = grandTotal > 0 ? (totalWithMarkup / grandTotal) * 100 : 0;
    buyEls.breakdown.innerHTML =
      '<div class="calc-chart-segment deposit" style="width:' + downPct + '%"></div>' +
      '<div class="calc-chart-segment rent" style="width:' + payPct + '%"></div>';

    buyEls.schedule.innerHTML =
      '<div class="calc-row"><span class="label">Сегодня</span><span class="val">' + fmt(down + payment) + '</span></div>' +
      '<div class="calc-row"><span class="label">Далее × ' + (periods - 1) + '</span><span class="val">' + fmt(payment) + '</span></div>' +
      '<div class="calc-row"><span class="label">Велосипед ваш</span><span class="val">через ' + termMonths + ' мес.</span></div>';

    buyEls.tip.textContent =
      model.name + ' — розница ' + fmt(model.retail) + '. Расчёт ориентировочный, точные условия уточняйте у менеджера. Без кредитной истории.';

    syncFormFromBuyout();
  }

  if (buyEls.model) {
    buyEls.model.addEventListener('change', () => {
      const m = BUYOUT_MODELS[buyEls.model.value];
      buyEls.retail.value = m.retail;
      buyEls.down.max = Math.floor(m.retail * 0.5);
      if (parseInt(buyEls.down.value, 10) > buyEls.down.max) {
        buyEls.down.value = Math.floor(m.retail * 0.15);
      }
      updateBuyoutCalc();
    });

    ['input', 'change'].forEach((ev) => {
      buyEls.retail.addEventListener(ev, updateBuyoutCalc);
      buyEls.down.addEventListener(ev, updateBuyoutCalc);
      buyEls.term.addEventListener(ev, updateBuyoutCalc);
    });
    document.getElementById('buyout-freq-group')?.addEventListener('click', () => setTimeout(updateBuyoutCalc, 0));
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
    el.textContent = prefix + target + suffix;
    el.classList.add('counted');
  });

  window.NadoVeloCalc = { switchTab: switchTab };
})();
