'use strict';

(() => {
  const STORAGE_KEY = 'meubolso:v1';

  // ---------- Categorias ----------

  const CATEGORIES = {
    expense: [
      { id: 'moradia', name: 'Moradia', icon: '🏠', group: 'needs' },
      { id: 'contas', name: 'Contas da casa', icon: '💡', group: 'needs' },
      { id: 'mercado', name: 'Mercado', icon: '🛒', group: 'needs' },
      { id: 'transporte', name: 'Transporte', icon: '🚗', group: 'needs' },
      { id: 'saude', name: 'Saúde', icon: '💊', group: 'needs' },
      { id: 'educacao', name: 'Educação', icon: '📚', group: 'needs' },
      { id: 'dividas', name: 'Dívidas e cartão', icon: '💳', group: 'needs' },
      { id: 'restaurante', name: 'Lanches e delivery', icon: '🍔', group: 'wants' },
      { id: 'lazer', name: 'Lazer', icon: '🎉', group: 'wants' },
      { id: 'compras', name: 'Compras', icon: '🛍️', group: 'wants' },
      { id: 'assinaturas', name: 'Assinaturas', icon: '📺', group: 'wants' },
      { id: 'cuidados', name: 'Cuidados pessoais', icon: '💈', group: 'wants' },
      { id: 'investimento', name: 'Investir / guardar', icon: '🐷', group: 'savings' },
      { id: 'outros', name: 'Outros', icon: '📦', group: 'wants' },
    ],
    income: [
      { id: 'salario', name: 'Salário', icon: '💼' },
      { id: 'extra', name: 'Renda extra', icon: '💰' },
      { id: 'comissao', name: 'Comissão / bônus', icon: '🏆' },
      { id: 'rendimentos', name: 'Rendimentos', icon: '📈' },
      { id: 'outros_in', name: 'Outros', icon: '📥' },
    ],
  };

  // Regra 50/30/20: quanto da renda vai para cada grupo de gasto.
  const GROUPS = [
    { id: 'needs', name: 'Necessidades', pct: 50, hint: 'Moradia, contas, mercado, transporte, saúde, dívidas' },
    { id: 'wants', name: 'Desejos', pct: 30, hint: 'Delivery, lazer, compras, assinaturas' },
    { id: 'savings', name: 'Futuro', pct: 20, hint: 'Investir, guardar, reserva de emergência' },
  ];

  const GOAL_ICONS = ['🛡️', '✈️', '🏍️', '🚗', '🏠', '🎓', '💍', '📱', '🎁', '🐷'];

  const catById = (type, id) =>
    CATEGORIES[type].find((c) => c.id === id) || CATEGORIES[type][CATEGORIES[type].length - 1];

  // ---------- Utilidades ----------

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
  });
  const money = (cents) => BRL.format((cents || 0) / 100);
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const monthOf = (iso) => iso.slice(0, 7);
  const currentMonth = () => monthOf(todayISO());
  const parseISO = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  };
  const daysInMonth = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  };
  const shiftMonth = (ym, n) => {
    const [y, m] = ym.split('-').map(Number);
    const t = y * 12 + (m - 1) + n;
    return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
  };
  // Soma meses mantendo o dia (31/01 + 1 mês = 28/02).
  const addMonthsISO = (iso, n) => {
    const ym = shiftMonth(monthOf(iso), n);
    const day = Math.min(Number(iso.slice(8, 10)), daysInMonth(ym));
    return `${ym}-${pad(day)}`;
  };
  const monthsBetween = (fromYM, toYM) => {
    const [a, b] = [fromYM, toYM].map((s) => s.split('-').map(Number));
    return (b[0] - a[0]) * 12 + (b[1] - a[1]);
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthName = (ym, opts = { month: 'long', year: 'numeric' }) =>
    cap(parseISO(`${ym}-01`).toLocaleDateString('pt-BR', opts));
  const monthShort = (ym) => monthName(ym, { month: 'short' }).replace('.', '');
  const dayLabel = (iso) => {
    const today = todayISO();
    if (iso === today) return 'Hoje';
    const y = new Date();
    y.setDate(y.getDate() - 1);
    if (iso === `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`) return 'Ontem';
    return cap(parseISO(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }));
  };
  // Data padrão de um novo lançamento: hoje, ou o mesmo dia no mês que está aberto.
  const defaultDate = () => {
    const today = todayISO();
    if (ui.month === monthOf(today)) return today;
    return `${ui.month}-${pad(Math.min(Number(today.slice(8, 10)), daysInMonth(ui.month)))}`;
  };

  // ---------- Dados ----------

  const defaultState = () => ({ version: 1, transactions: [], budgets: {}, goals: [], demo: false });

  const isISO = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const isPosInt = (n) => Number.isInteger(n) && n > 0;

  // Valida e limpa dados vindos do armazenamento ou de um backup.
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Arquivo inválido');
    const s = defaultState();
    s.demo = !!raw.demo;
    s.transactions = (Array.isArray(raw.transactions) ? raw.transactions : [])
      .filter((t) => t && CATEGORIES[t.type] && isPosInt(t.amount) && isISO(t.date))
      .map((t) => {
        const tx = {
          id: String(t.id || uid()),
          type: t.type,
          amount: t.amount,
          description: String(t.description || '').slice(0, 60),
          category: CATEGORIES[t.type].some((c) => c.id === t.category) ? t.category : catById(t.type, '').id,
          date: t.date,
          createdAt: Number(t.createdAt) || Date.now(),
        };
        if (t.groupId) tx.groupId = String(t.groupId);
        if (t.installment) tx.installment = String(t.installment).slice(0, 10);
        if (t.recurring) tx.recurring = true;
        return tx;
      });
    if (raw.budgets && typeof raw.budgets === 'object') {
      for (const [k, v] of Object.entries(raw.budgets)) {
        if (CATEGORIES.expense.some((c) => c.id === k) && isPosInt(v)) s.budgets[k] = v;
      }
    }
    s.goals = (Array.isArray(raw.goals) ? raw.goals : [])
      .filter((g) => g && typeof g.name === 'string' && isPosInt(g.target))
      .map((g) => ({
        id: String(g.id || uid()),
        name: g.name.slice(0, 40),
        icon: GOAL_ICONS.includes(g.icon) ? g.icon : GOAL_ICONS[0],
        target: g.target,
        saved: Number.isInteger(g.saved) && g.saved > 0 ? g.saved : 0,
        deadline: typeof g.deadline === 'string' && /^\d{4}-\d{2}$/.test(g.deadline) ? g.deadline : '',
        createdAt: Number(g.createdAt) || Date.now(),
      }));
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalize(JSON.parse(raw)) : defaultState();
    } catch {
      return defaultState();
    }
  }

  let askedPersist = false;
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast('Não consegui salvar. Libere espaço no aparelho e tente de novo.');
    }
    // Pede ao navegador para não apagar os dados quando faltar espaço.
    if (!askedPersist && navigator.storage && navigator.storage.persist) {
      askedPersist = true;
      navigator.storage.persist().catch(() => {});
    }
  }

  let state = load();
  const ui = { tab: 'home', month: currentMonth(), filter: 'all', category: null, query: '', trendSel: null };

  const txOfMonth = (ym) => state.transactions.filter((t) => monthOf(t.date) === ym);
  const sortTx = (list) =>
    list.slice().sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));

  function totals(list) {
    let inc = 0;
    let exp = 0;
    for (const t of list) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return { inc, exp, bal: inc - exp };
  }

  function spentByCategory(list) {
    const by = {};
    for (const t of list) if (t.type === 'expense') by[t.category] = (by[t.category] || 0) + t.amount;
    return by;
  }

  function budgetStatus(spent, limit) {
    const pct = limit > 0 ? spent / limit : 0;
    if (pct > 1) return { cls: 'critical', label: '⛔ Estourou', pct };
    if (pct >= 0.8) return { cls: 'warning', label: '⚠ Atenção', pct };
    return { cls: 'good', label: '✓ Tranquilo', pct };
  }

  // Média de gastos mensais (sem contar o que foi guardado) nos 3 meses antes do mês aberto.
  function avgMonthlySpend(category) {
    const months = [1, 2, 3].map((i) => shiftMonth(ui.month, -i));
    const values = months.map((m) =>
      sum(
        txOfMonth(m)
          .filter((t) => t.type === 'expense' && (category ? t.category === category : t.category !== 'investimento'))
          .map((t) => t.amount),
      ),
    );
    const used = values.filter((v) => v > 0);
    return used.length ? Math.round(sum(used) / used.length) : 0;
  }

  // ---------- Telas ----------

  function render() {
    const onGoals = ui.tab === 'goals';
    $('#monthLabel').textContent = onGoals ? 'Minhas metas' : monthName(ui.month);
    $('#monthLabel').disabled = onGoals;
    $('#prevMonth').hidden = onGoals;
    $('#nextMonth').hidden = onGoals;
    $$('.tabbar button').forEach((b) => {
      const active = b.dataset.tab === ui.tab;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    const views = { home: viewHome, transactions: viewTransactions, budget: viewBudget, goals: viewGoals };
    $('#view').innerHTML = views[ui.tab]();
    if (ui.tab === 'transactions') renderTxList();
  }

  function demoBanner() {
    if (!state.demo) return '';
    return `<section class="card tip">
      <div class="tip-icon" aria-hidden="true">🧪</div>
      <div>
        <p><strong>Você está vendo dados de exemplo.</strong> Explore à vontade. Quando quiser usar de verdade, apague o exemplo.</p>
        <button class="link-btn" type="button" data-action="clear-demo">Apagar exemplo e começar do zero</button>
      </div>
    </section>`;
  }

  function viewHome() {
    if (!state.transactions.length && !state.goals.length) return welcome();
    const list = txOfMonth(ui.month);
    const { inc, exp, bal } = totals(list);
    return [
      demoBanner(),
      `<section class="card hero" aria-label="Resumo do mês">
        <p class="eyebrow">Saldo do mês</p>
        <div class="hero-value num">${money(bal)}</div>
        <div class="hero-split">
          <div><span>Receitas</span><strong class="num">${money(inc)}</strong></div>
          <div><span>Despesas</span><strong class="num">${money(exp)}</strong></div>
        </div>
      </section>`,
      dailyTip(inc, exp, bal),
      alertsCard(list),
      categoryChart(list, exp),
      trendChart(),
      recentCard(list),
    ].join('');
  }

  function welcome() {
    return `<section class="card empty">
      <div class="empty-icon" aria-hidden="true">👋</div>
      <h2>Bem-vindo ao Meu Bolso</h2>
      <p>Comece lançando sua renda do mês. Depois registre cada gasto e o app mostra quanto você ainda pode gastar por dia.</p>
      <div class="actions">
        <button class="btn primary block" type="button" data-action="new-income">Lançar minha renda</button>
        <button class="btn block" type="button" data-action="load-demo">Ver com dados de exemplo</button>
      </div>
    </section>
    <section class="card">
      <h2 class="card-title">Como se regrar em 3 passos</h2>
      <ol class="install-steps" style="margin-top:10px">
        <li><strong>Lance a renda e as contas fixas</strong> (aluguel, luz, internet). Use “Fixa mensal” para repetir nos próximos meses.</li>
        <li><strong>Defina limites</strong> para as categorias que mais pesam, na aba Orçamento.</li>
        <li><strong>Registre todo gasto na hora.</strong> Leva 5 segundos e evita surpresa no fim do mês.</li>
      </ol>
    </section>`;
  }

  function dailyTip(inc, exp, bal) {
    const cur = currentMonth();
    let icon = '💡';
    let body;
    if (ui.month === cur) {
      const left = daysInMonth(cur) - new Date().getDate() + 1;
      if (inc === 0) {
        body = `<p>Lance sua renda deste mês (salário, comissão, extras) para eu calcular quanto você pode gastar por dia.</p>
          <button class="link-btn" type="button" data-action="new-income">Lançar renda</button>`;
      } else if (bal > 0) {
        icon = '📅';
        body = `<p>Você pode gastar até <span class="tip-big num">${money(Math.floor(bal / left))} por dia</span>
          nos próximos ${left} ${left === 1 ? 'dia' : 'dias'} e ainda fechar o mês no azul.</p>`;
      } else if (bal === 0) {
        icon = '⚠️';
        body = '<p><strong>Todo o dinheiro do mês já está comprometido.</strong> Evite novos gastos até a próxima renda.</p>';
      } else {
        icon = '🚨';
        body = `<p><strong>Seus gastos passaram a renda em ${money(-bal)}.</strong>
          Corte primeiro os desejos (delivery, lazer, compras) até equilibrar.</p>`;
      }
    } else if (ui.month < cur) {
      if (!inc && !exp) return '';
      icon = bal >= 0 ? '✅' : '📉';
      body = bal >= 0
        ? `<p>Neste mês <strong>sobraram ${money(bal)}</strong>${inc ? ` (${Math.round((bal / inc) * 100)}% da renda)` : ''}.</p>`
        : `<p>Neste mês você gastou <strong>${money(-bal)} a mais</strong> do que ganhou.</p>`;
    } else {
      icon = '🔮';
      body = `<p>Mês futuro: aqui aparecem as contas fixas e parcelas que já estão lançadas.
        <strong>Já comprometido: ${money(exp)}.</strong></p>`;
    }
    return `<section class="card tip"><div class="tip-icon" aria-hidden="true">${icon}</div><div>${body}</div></section>`;
  }

  function alertsCard(list) {
    const by = spentByCategory(list);
    const items = Object.entries(state.budgets)
      .map(([id, limit]) => ({ c: catById('expense', id), limit, spent: by[id] || 0 }))
      .filter((x) => x.spent >= x.limit * 0.8)
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
    if (!items.length) return '';
    return `<section class="card">
      <div class="card-head"><h2 class="card-title">Fique de olho</h2>
        <button class="link-btn" type="button" data-action="go-tab" data-tab="budget">Orçamento</button></div>
      <ul class="alert-list">${items
        .map(({ c, limit, spent }) => {
          const st = budgetStatus(spent, limit);
          const text = spent > limit
            ? `passou ${money(spent - limit)} do limite`
            : `restam ${money(limit - spent)} (${Math.round(st.pct * 100)}% usado)`;
          return `<li class="alert"><span aria-hidden="true">${c.icon}</span>
            <span style="flex:1;min-width:0"><strong>${esc(c.name)}</strong>: ${text}</span>
            <span class="badge ${st.cls}">${st.label}</span></li>`;
        })
        .join('')}</ul>
    </section>`;
  }

  function categoryChart(list, exp) {
    const rows = Object.entries(spentByCategory(list)).sort((a, b) => b[1] - a[1]);
    if (!rows.length) return '';
    const max = rows[0][1];
    return `<section class="card">
      <div class="card-head"><div><h2 class="card-title">Para onde foi o dinheiro</h2>
        <p class="card-sub">Toque numa categoria para ver os gastos</p></div></div>
      <ul class="bars">${rows
        .map(([id, v]) => {
          const c = catById('expense', id);
          const pct = Math.round((v / exp) * 100);
          return `<li><button class="bar-row" type="button" data-action="filter-cat" data-cat="${id}"
              aria-label="${esc(c.name)}: ${money(v)}, ${pct}% das despesas">
            <span class="bar-label">${c.icon} ${esc(c.name)}</span>
            <span class="bar-value num">${money(v)}<small>${pct}%</small></span>
            <span class="bar-track"><span class="bar-fill" style="width:${((v / max) * 100).toFixed(1)}%"></span></span>
          </button></li>`;
        })
        .join('')}</ul>
    </section>`;
  }

  // Arredonda para cima até 1, 2 ou 5 × 10ⁿ reais, para a escala do gráfico.
  function niceCeil(cents) {
    const v = Math.max(cents / 100, 1);
    const p = 10 ** Math.floor(Math.log10(v));
    const f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p * 100;
  }

  const trendMonths = () => [-5, -4, -3, -2, -1, 0].map((i) => shiftMonth(ui.month, i));

  function trendDetail(m) {
    const { inc, exp, bal } = totals(txOfMonth(m));
    return `<strong>${esc(monthName(m))}</strong><br>
      Receitas <strong class="num">${money(inc)}</strong> · Despesas <strong class="num">${money(exp)}</strong> ·
      Saldo <strong class="num ${bal < 0 ? 'neg' : 'pos'}">${money(bal)}</strong>`;
  }

  function trendChart() {
    const months = trendMonths();
    const data = months.map((m) => ({ m, ...totals(txOfMonth(m)) }));
    if (data.filter((d) => d.inc || d.exp).length < 2) return '';
    const top = niceCeil(Math.max(...data.map((d) => Math.max(d.inc, d.exp))));
    const sel = months.includes(ui.trendSel) ? ui.trendSel : ui.month;
    const h = (v) => ((v / top) * 100).toFixed(1);
    return `<section class="card">
      <div class="card-head"><h2 class="card-title">Últimos 6 meses</h2>
        <div class="legend"><span><i class="swatch" style="background:var(--series-1)"></i>Receitas</span>
          <span><i class="swatch" style="background:var(--series-2)"></i>Despesas</span></div></div>
      <div class="trend" role="group" aria-label="Receitas e despesas nos últimos 6 meses">
        <div class="trend-grid" aria-hidden="true"><span class="num">${BRL_COMPACT.format(top / 100)}</span></div>
        ${data
          .map((d) => `<button class="trend-col${d.m === sel ? ' selected' : ''}" type="button" data-action="trend-sel"
              data-month="${d.m}" aria-label="${esc(monthName(d.m))}: receitas ${money(d.inc)}, despesas ${money(d.exp)}">
            <span class="trend-bar inc" style="height:${h(d.inc)}%"></span>
            <span class="trend-bar exp" style="height:${h(d.exp)}%"></span>
          </button>`)
          .join('')}
      </div>
      <div class="trend-labels" aria-hidden="true">${months.map((m) => `<span>${esc(monthShort(m))}</span>`).join('')}</div>
      <p class="trend-detail" id="trendDetail">${trendDetail(sel)}</p>
    </section>`;
  }

  function selectTrend(m) {
    if (ui.trendSel === m) return;
    ui.trendSel = m;
    $$('.trend-col').forEach((b) => b.classList.toggle('selected', b.dataset.month === m));
    const d = $('#trendDetail');
    if (d) d.innerHTML = trendDetail(m);
  }

  function txRow(t) {
    const c = catById(t.type, t.category);
    const meta = [c.name, t.installment && `parcela ${t.installment}`, t.recurring && 'fixa mensal'].filter(Boolean).join(' · ');
    return `<li><button class="tx" type="button" data-action="edit-tx" data-id="${esc(t.id)}">
      <span class="tx-icon" aria-hidden="true">${c.icon}</span>
      <span class="tx-main"><span class="tx-desc">${esc(t.description || c.name)}</span>
        <span class="tx-meta">${esc(meta)}</span></span>
      <span class="tx-amount num ${t.type === 'income' ? 'pos' : ''}">${t.type === 'income' ? '+' : '−'} ${money(t.amount)}</span>
    </button></li>`;
  }

  function recentCard(list) {
    const recent = sortTx(list).slice(0, 5);
    if (!recent.length) {
      return `<section class="card empty"><div class="empty-icon" aria-hidden="true">🗒️</div>
        <h2>Nada lançado neste mês</h2><p>Toque no botão + para registrar uma receita ou despesa.</p></section>`;
    }
    return `<section class="card">
      <div class="card-head"><h2 class="card-title">Últimos lançamentos</h2>
        <button class="link-btn" type="button" data-action="go-tab" data-tab="transactions">Ver todos</button></div>
      <ul class="tx-list">${recent.map(txRow).join('')}</ul>
    </section>`;
  }

  // ----- Lançamentos -----

  function viewTransactions() {
    const chip = (v, label) =>
      `<button class="chip${ui.filter === v ? ' active' : ''}" type="button" data-action="filter-type" data-value="${v}"
        aria-pressed="${ui.filter === v}">${label}</button>`;
    const cat = ui.category ? catById('expense', ui.category) : null;
    return `${demoBanner()}<div class="toolbar">
        <div class="chips">${chip('all', 'Todos')}${chip('expense', 'Despesas')}${chip('income', 'Receitas')}
          ${cat ? `<button class="chip active" type="button" data-action="clear-cat" aria-label="Remover filtro ${esc(cat.name)}">${cat.icon} ${esc(cat.name)} ✕</button>` : ''}
        </div>
        <input id="txSearch" class="search" type="search" placeholder="Buscar por descrição" value="${esc(ui.query)}" autocomplete="off" aria-label="Buscar lançamentos">
      </div>
      <section class="card" id="txSummary"></section>
      <section class="card" id="txList"></section>`;
  }

  function renderTxList() {
    const q = ui.query.trim().toLowerCase();
    const list = sortTx(txOfMonth(ui.month)).filter((t) =>
      (ui.filter === 'all' || t.type === ui.filter) &&
      (!ui.category || t.category === ui.category) &&
      (!q || (t.description || catById(t.type, t.category).name).toLowerCase().includes(q)));
    const { inc, exp, bal } = totals(list);
    $('#txSummary').innerHTML = `<div class="summary-row">
      <div><span>Receitas</span><strong class="num pos">${money(inc)}</strong></div>
      <div><span>Despesas</span><strong class="num neg">${money(exp)}</strong></div>
      <div><span>Saldo</span><strong class="num">${money(bal)}</strong></div></div>`;
    if (!list.length) {
      $('#txList').innerHTML = `<div class="empty"><div class="empty-icon" aria-hidden="true">🔍</div>
        <h2>Nenhum lançamento</h2><p>${q || ui.category || ui.filter !== 'all'
          ? 'Nada encontrado com esses filtros neste mês.'
          : 'Toque no botão + para registrar o primeiro lançamento do mês.'}</p></div>`;
      return;
    }
    const days = [];
    for (const t of list) {
      if (!days.length || days[days.length - 1].date !== t.date) days.push({ date: t.date, items: [] });
      days[days.length - 1].items.push(t);
    }
    $('#txList').innerHTML = days
      .map((d) => {
        const dayBal = totals(d.items).bal;
        return `<h3 class="tx-day"><span>${esc(dayLabel(d.date))}</span>
          <span class="num">${money(dayBal)}</span></h3><ul class="tx-list">${d.items.map(txRow).join('')}</ul>`;
      })
      .join('');
  }

  // ----- Orçamento -----

  function viewBudget() {
    const list = txOfMonth(ui.month);
    const by = spentByCategory(list);
    const { inc } = totals(list);
    const limited = Object.keys(state.budgets);
    const totalLimit = sum(Object.values(state.budgets));
    const limitedSpent = sum(limited.map((id) => by[id] || 0));

    let summary;
    if (totalLimit) {
      const st = budgetStatus(limitedSpent, totalLimit);
      summary = `<section class="card">
        <div class="card-head"><h2 class="card-title">Orçamento do mês</h2><span class="badge ${st.cls}">${st.label}</span></div>
        <div class="progress" style="grid-column:auto"><div class="${st.cls}" style="width:${Math.min(100, st.pct * 100).toFixed(1)}%"></div></div>
        <div class="budget-nums" style="margin-top:8px">
          <span>Gasto <strong class="num">${money(limitedSpent)}</strong> de <span class="num">${money(totalLimit)}</span></span>
          <span class="num">${limitedSpent > totalLimit ? `Passou ${money(limitedSpent - totalLimit)}` : `Resta ${money(totalLimit - limitedSpent)}`}</span>
        </div>
        ${inc && totalLimit > inc ? `<p class="hint" style="margin-top:8px">⚠ Seus limites somam mais que a renda deste mês (${money(inc)}).</p>` : ''}
      </section>`;
    } else {
      summary = `<section class="card tip"><div class="tip-icon" aria-hidden="true">🎯</div><div>
        <p><strong>Defina limites mensais por categoria.</strong> Toque numa categoria abaixo. O app avisa quando você chegar a 80% do limite.</p></div></section>`;
    }

    const rule = inc
      ? `<section class="card">
        <div class="card-head"><div><h2 class="card-title">Regra 50/30/20</h2>
          <p class="card-sub">Sobre a renda de ${money(inc)} deste mês</p></div></div>
        ${GROUPS.map((g) => {
          const ids = CATEGORIES.expense.filter((c) => c.group === g.id).map((c) => c.id);
          const actual = sum(ids.map((id) => by[id] || 0));
          const ideal = Math.round((inc * g.pct) / 100);
          const ratio = ideal ? actual / ideal : 0;
          let badge;
          let cls;
          if (g.id === 'savings') {
            cls = ratio >= 1 ? 'good' : 'neutral';
            badge = ratio >= 1 ? '<span class="badge good">✓ Meta batida</span>' : `<span class="badge warning">Faltam ${money(ideal - actual)}</span>`;
          } else {
            const st = budgetStatus(actual, ideal);
            cls = st.cls;
            badge = `<span class="badge ${st.cls}">${st.label}</span>`;
          }
          return `<div class="rule-row">
            <div class="rule-top"><strong>${g.name} · ${g.pct}%</strong>${badge}</div>
            <span class="rule-hint">${g.hint}</span>
            <div class="progress" style="grid-column:auto"><div class="${cls}" style="width:${Math.min(100, ratio * 100).toFixed(1)}%"></div></div>
            <div class="rule-nums"><span>Real <strong class="num">${money(actual)}</strong> (${Math.round((actual / inc) * 100)}%)</span>
              <span>Ideal <span class="num">${money(ideal)}</span></span></div>
          </div>`;
        }).join('')}
      </section>`
      : '';

    const cats = CATEGORIES.expense.slice().sort((a, b) => (state.budgets[b.id] ? 1 : 0) - (state.budgets[a.id] ? 1 : 0));
    const rows = cats
      .map((c) => {
        const spent = by[c.id] || 0;
        const limit = state.budgets[c.id];
        if (!limit) {
          return `<button class="budget-row" type="button" data-action="edit-budget" data-cat="${c.id}">
            <span class="tx-icon" aria-hidden="true">${c.icon}</span>
            <span class="budget-top"><span class="budget-name">${esc(c.name)}</span><span class="link-btn">Definir limite</span></span>
            <span class="budget-nums"><span>Sem limite · gasto <span class="num">${money(spent)}</span></span></span>
          </button>`;
        }
        const st = budgetStatus(spent, limit);
        return `<button class="budget-row" type="button" data-action="edit-budget" data-cat="${c.id}">
          <span class="tx-icon" aria-hidden="true">${c.icon}</span>
          <span class="budget-top"><span class="budget-name">${esc(c.name)}</span><span class="badge ${st.cls}">${st.label}</span></span>
          <span class="progress"><span class="${st.cls}" style="width:${Math.min(100, st.pct * 100).toFixed(1)}%"></span></span>
          <span class="budget-nums" style="grid-column:2"><span><span class="num">${money(spent)}</span> de <span class="num">${money(limit)}</span></span>
            <span class="num">${spent > limit ? `passou ${money(spent - limit)}` : `resta ${money(limit - spent)}`}</span></span>
        </button>`;
      })
      .join('');

    return `${demoBanner()}${summary}${rule}<section class="card">
      <div class="card-head"><h2 class="card-title">Limites por categoria</h2></div>${rows}</section>`;
  }

  // ----- Metas -----

  function viewGoals() {
    const avg = avgMonthlySpend();
    const reserveTip = avg
      ? `<section class="card tip"><div class="tip-icon" aria-hidden="true">🛡️</div><div>
          <p>Seu custo de vida médio é <strong class="num">${money(avg)}</strong> por mês.
          Uma boa <strong>reserva de emergência</strong> fica entre <strong class="num">${money(avg * 3)}</strong> e
          <strong class="num">${money(avg * 6)}</strong>. Comece por ela.</p></div></section>`
      : '';
    if (!state.goals.length) {
      return `${demoBanner()}<section class="card empty"><div class="empty-icon" aria-hidden="true">🎯</div>
        <h2>Nenhuma meta ainda</h2>
        <p>Guardar fica mais fácil com um objetivo: reserva de emergência, viagem, moto, curso.</p>
        <button class="btn primary" type="button" data-action="new-goal">Criar minha primeira meta</button></section>${reserveTip}`;
    }
    const cur = currentMonth();
    const cards = state.goals
      .map((g) => {
        const pct = Math.min(1, g.saved / g.target);
        const remaining = Math.max(0, g.target - g.saved);
        let plan = '';
        if (!remaining) plan = '<span class="badge good">🎉 Meta alcançada!</span>';
        else if (g.deadline) {
          const months = monthsBetween(cur, g.deadline);
          plan = months > 0
            ? `Guarde <strong class="num">${money(Math.ceil(remaining / months))}</strong> por mês até ${esc(monthName(g.deadline, { month: 'short', year: 'numeric' }).replace('.', ''))}`
            : '<span class="badge warning">⚠ Prazo vencido</span>';
        }
        return `<section class="card goal">
          <div class="goal-head"><span class="tx-icon" aria-hidden="true">${g.icon}</span>
            <div style="min-width:0"><h2 class="goal-name">${esc(g.name)}</h2>
              ${plan ? `<p class="card-sub">${plan}</p>` : ''}</div></div>
          <div class="progress" style="grid-column:auto"><div class="${remaining ? 'neutral' : 'good'}" style="width:${(pct * 100).toFixed(1)}%"></div></div>
          <div class="goal-nums"><span><strong class="num">${money(g.saved)}</strong> de <span class="num">${money(g.target)}</span></span>
            <span>${Math.round(pct * 100)}% · faltam <span class="num">${money(remaining)}</span></span></div>
          <div class="goal-actions">
            <button class="btn primary" type="button" data-action="deposit" data-id="${esc(g.id)}">Guardar</button>
            <button class="btn" type="button" data-action="edit-goal" data-id="${esc(g.id)}">Editar</button>
          </div>
        </section>`;
      })
      .join('');
    return `${demoBanner()}${cards}<button class="btn block" type="button" data-action="new-goal">+ Nova meta</button>${reserveTip}`;
  }

  // ---------- Painel inferior (formulários) ----------

  let lastFocus = null;
  function openSheet(html) {
    lastFocus = document.activeElement;
    $('#sheetContent').innerHTML = html;
    $('#sheet').hidden = false;
    document.body.style.overflow = 'hidden';
    return $('#sheetContent');
  }
  function closeSheet() {
    $('#sheet').hidden = true;
    $('#sheetContent').innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // Campo de valor no estilo app de banco: os dígitos entram pelos centavos.
  function bindMoney(input, cents) {
    const set = (c) => {
      input.dataset.cents = String(c);
      input.value = money(c);
    };
    const toEnd = () => requestAnimationFrame(() => {
      try { input.setSelectionRange(input.value.length, input.value.length); } catch { /* sem suporte */ }
    });
    set(cents || 0);
    input.addEventListener('input', () => {
      set(parseInt(input.value.replace(/\D/g, '').slice(0, 11) || '0', 10));
      toEnd();
    });
    input.addEventListener('focus', toEnd);
  }
  const centsOf = (input) => parseInt(input.dataset.cents || '0', 10);

  function confirmBox(slot, text, buttons) {
    slot.innerHTML = `<div class="confirm-box" role="alertdialog" aria-label="Confirmação"><p>${text}</p>
      <div class="row">${buttons.map((b, i) => `<button type="button" class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('')}</div></div>`;
    $$('button', slot).forEach((el) => el.addEventListener('click', () => buttons[Number(el.dataset.i)].onClick()));
    $('button', slot).focus();
  }

  function openTxSheet(tx, presetType) {
    const isNew = !tx;
    let type = tx ? tx.type : presetType || 'expense';
    let category = tx ? tx.category : type === 'income' ? 'salario' : 'mercado';
    let repeat = 'single';

    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${isNew ? 'Novo lançamento' : 'Editar lançamento'}</h2>
      <form id="txForm" class="form" novalidate>
        <div class="segmented" id="typeSeg">
          <button type="button" data-value="expense">Despesa</button>
          <button type="button" data-value="income">Receita</button>
        </div>
        <div class="field"><label for="txAmount">Valor</label>
          <input id="txAmount" class="money" inputmode="numeric" autocomplete="off" enterkeyhint="next"></div>
        <div class="field"><label for="txDesc">Descrição</label>
          <input id="txDesc" maxlength="60" placeholder="Ex.: Mercado do mês" autocomplete="off" value="${esc(tx ? tx.description : '')}"></div>
        <div class="field"><span class="label" id="catLabel">Categoria</span>
          <div class="cat-grid" id="catGrid" role="radiogroup" aria-labelledby="catLabel"></div></div>
        <div class="field"><label for="txDate">Data</label>
          <input id="txDate" type="date" required value="${tx ? tx.date : defaultDate()}"></div>
        ${isNew ? `<div class="field"><span class="label">Repetição</span>
          <div class="segmented three" id="repeatSeg">
            <button type="button" data-value="single" class="active">Única</button>
            <button type="button" data-value="installments">Parcelada</button>
            <button type="button" data-value="fixed">Fixa mensal</button>
          </div></div>
        <div class="field" id="repeatField" hidden><label for="txRepeat" id="repeatLabel">Número de parcelas</label>
          <input id="txRepeat" type="number" min="2" max="60" value="2" inputmode="numeric">
          <p class="hint" id="repeatHint"></p></div>` : tx.groupId ? `<p class="hint">Este lançamento faz parte de uma série (${tx.installment ? `parcela ${esc(tx.installment)}` : 'fixa mensal'}). Alterações valem só para ele.</p>` : ''}
        <div class="actions">
          <button class="btn primary block" type="submit">Salvar</button>
          ${isNew ? '' : '<button class="btn danger block" type="button" id="delBtn">Excluir</button><div id="confirmSlot"></div>'}
        </div>
      </form>`);

    const amount = $('#txAmount', root);
    bindMoney(amount, tx ? tx.amount : 0);

    const paintType = () => {
      $$('#typeSeg button', root).forEach((b) => {
        b.classList.toggle('active', b.dataset.value === type);
        b.setAttribute('aria-pressed', String(b.dataset.value === type));
      });
      if (!CATEGORIES[type].some((c) => c.id === category)) category = type === 'income' ? 'salario' : 'mercado';
      $('#catGrid', root).innerHTML = CATEGORIES[type]
        .map((c) => `<button type="button" class="cat-btn${c.id === category ? ' active' : ''}" role="radio"
          aria-checked="${c.id === category}" data-id="${c.id}"><span aria-hidden="true">${c.icon}</span><span>${esc(c.name)}</span></button>`)
        .join('');
    };
    paintType();

    $('#typeSeg', root).addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      type = b.dataset.value;
      paintType();
      updateRepeatHint();
    });
    $('#catGrid', root).addEventListener('click', (e) => {
      const b = e.target.closest('.cat-btn');
      if (!b) return;
      category = b.dataset.id;
      $$('.cat-btn', root).forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
    });

    function repeatCount() {
      const n = parseInt($('#txRepeat', root).value, 10);
      return Number.isFinite(n) ? Math.min(60, Math.max(2, n)) : 2;
    }
    function updateRepeatHint() {
      if (!isNew || repeat === 'single') return;
      const n = repeatCount();
      const total = centsOf(amount);
      const last = addMonthsISO($('#txDate', root).value || defaultDate(), n - 1);
      $('#repeatHint', root).textContent = repeat === 'installments'
        ? `${n}× de ${money(Math.floor(total / n))} (valor total dividido), até ${monthName(monthOf(last))}.`
        : `${money(total)} todo mês, por ${n} meses, até ${monthName(monthOf(last))}.`;
    }

    if (isNew) {
      $('#repeatSeg', root).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        repeat = b.dataset.value;
        $$('#repeatSeg button', root).forEach((x) => x.classList.toggle('active', x === b));
        $('#repeatField', root).hidden = repeat === 'single';
        $('#repeatLabel', root).textContent = repeat === 'installments' ? 'Número de parcelas' : 'Repetir por quantos meses';
        if (repeat === 'fixed' && repeatCount() === 2) $('#txRepeat', root).value = '12';
        if (repeat === 'installments' && repeatCount() === 12) $('#txRepeat', root).value = '2';
        updateRepeatHint();
      });
      ['input', 'change'].forEach((ev) => {
        $('#txRepeat', root).addEventListener(ev, updateRepeatHint);
        amount.addEventListener(ev, updateRepeatHint);
        $('#txDate', root).addEventListener(ev, updateRepeatHint);
      });
    }

    $('#txForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const cents = centsOf(amount);
      const date = $('#txDate', root).value;
      const description = $('#txDesc', root).value.trim();
      if (cents <= 0) {
        toast('Digite um valor maior que zero.');
        amount.focus();
        return;
      }
      if (!isISO(date)) {
        toast('Escolha a data do lançamento.');
        $('#txDate', root).focus();
        return;
      }
      const n = repeat === 'single' ? 1 : repeatCount();
      if (!isNew) {
        Object.assign(tx, { type, amount: cents, description, category, date });
      } else if (repeat === 'single') {
        state.transactions.push({ id: uid(), type, amount: cents, description, category, date, createdAt: Date.now() });
      } else {
        const groupId = uid();
        const base = Math.floor(cents / n);
        for (let i = 0; i < n; i++) {
          const t = {
            id: uid(), type, description, category, groupId,
            date: addMonthsISO(date, i),
            createdAt: Date.now() + i,
            amount: repeat === 'installments' ? base + (i === 0 ? cents - base * n : 0) : cents,
          };
          if (repeat === 'installments') t.installment = `${i + 1}/${n}`;
          else t.recurring = true;
          state.transactions.push(t);
        }
      }
      save();
      closeSheet();
      render();
      toast(isNew && n > 1 ? `${n} lançamentos criados` : 'Lançamento salvo');
    });

    if (!isNew) {
      $('#delBtn', root).addEventListener('click', () => {
        const buttons = [
          { label: 'Cancelar', onClick: () => { $('#confirmSlot', root).innerHTML = ''; } },
          { label: 'Excluir', cls: 'danger', onClick: () => removeTx((t) => t.id === tx.id, 'Lançamento excluído') },
        ];
        if (tx.groupId) {
          buttons.push({
            label: 'Este e próximos',
            cls: 'danger',
            onClick: () => removeTx((t) => t.groupId === tx.groupId && t.date >= tx.date, 'Série excluída a partir deste mês'),
          });
        }
        confirmBox($('#confirmSlot', root), tx.groupId
          ? 'Excluir só este lançamento ou este e os próximos da série?'
          : 'Excluir este lançamento? Não dá para desfazer.', buttons);
      });
    }

    if (isNew) amount.focus();
  }

  function removeTx(predicate, message) {
    state.transactions = state.transactions.filter((t) => !predicate(t));
    save();
    closeSheet();
    render();
    toast(message);
  }

  function openBudgetSheet(catId) {
    const c = catById('expense', catId);
    const current = state.budgets[catId] || 0;
    const avg = avgMonthlySpend(catId);
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${c.icon} Limite: ${esc(c.name)}</h2>
      <form id="budgetForm" class="form" novalidate>
        <div class="field"><label for="budgetAmount">Limite por mês</label>
          <input id="budgetAmount" class="money" inputmode="numeric" autocomplete="off"></div>
        ${avg ? `<p class="hint">Sua média nos últimos meses: <strong class="num">${money(avg)}</strong>.
          <button class="link-btn" type="button" id="useAvg">Usar média</button></p>` : ''}
        <p class="hint">O mesmo limite vale para todos os meses. Você recebe um aviso ao chegar a 80%.</p>
        <div class="actions">
          <button class="btn primary block" type="submit">Salvar limite</button>
          ${current ? '<button class="btn danger block" type="button" id="removeBudget">Remover limite</button>' : ''}
        </div>
      </form>`);
    const input = $('#budgetAmount', root);
    bindMoney(input, current);
    const useAvg = $('#useAvg', root);
    if (useAvg) useAvg.addEventListener('click', () => { input.value = String(avg); input.dispatchEvent(new Event('input')); });
    $('#budgetForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const cents = centsOf(input);
      if (cents > 0) state.budgets[catId] = cents;
      else delete state.budgets[catId];
      save();
      closeSheet();
      render();
      toast(cents > 0 ? 'Limite salvo' : 'Limite removido');
    });
    const rm = $('#removeBudget', root);
    if (rm) {
      rm.addEventListener('click', () => {
        delete state.budgets[catId];
        save();
        closeSheet();
        render();
        toast('Limite removido');
      });
    }
    input.focus();
  }

  function openGoalSheet(goal) {
    const isNew = !goal;
    let icon = goal ? goal.icon : GOAL_ICONS[0];
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${isNew ? 'Nova meta' : 'Editar meta'}</h2>
      <form id="goalForm" class="form" novalidate>
        <div class="field"><label for="goalName">Nome da meta</label>
          <input id="goalName" maxlength="40" placeholder="Ex.: Reserva de emergência" value="${esc(goal ? goal.name : '')}" autocomplete="off"></div>
        <div class="field"><span class="label">Ícone</span>
          <div class="emoji-grid" id="iconGrid">${GOAL_ICONS.map((i) => `<button type="button" data-icon="${i}" class="${i === icon ? 'active' : ''}" aria-label="Ícone ${i}">${i}</button>`).join('')}</div></div>
        <div class="field"><label for="goalTarget">Quanto quer juntar</label>
          <input id="goalTarget" class="money" inputmode="numeric" autocomplete="off"></div>
        <div class="field-row">
          <div class="field"><label for="goalSaved">Já tenho guardado</label>
            <input id="goalSaved" inputmode="numeric" autocomplete="off"></div>
          <div class="field"><label for="goalDeadline">Prazo (opcional)</label>
            <input id="goalDeadline" type="month" min="${currentMonth()}" value="${goal ? goal.deadline : ''}"></div>
        </div>
        <div class="actions">
          <button class="btn primary block" type="submit">Salvar meta</button>
          ${isNew ? '' : '<button class="btn danger block" type="button" id="delGoal">Excluir meta</button><div id="confirmSlot"></div>'}
        </div>
      </form>`);
    const target = $('#goalTarget', root);
    const saved = $('#goalSaved', root);
    bindMoney(target, goal ? goal.target : 0);
    bindMoney(saved, goal ? goal.saved : 0);
    $('#iconGrid', root).addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      icon = b.dataset.icon;
      $$('#iconGrid button', root).forEach((x) => x.classList.toggle('active', x === b));
    });
    $('#goalForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#goalName', root).value.trim();
      const deadline = $('#goalDeadline', root).value;
      if (!name) {
        toast('Dê um nome para a meta.');
        $('#goalName', root).focus();
        return;
      }
      if (centsOf(target) <= 0) {
        toast('Digite quanto você quer juntar.');
        target.focus();
        return;
      }
      const data = {
        name, icon,
        target: centsOf(target),
        saved: centsOf(saved),
        deadline: /^\d{4}-\d{2}$/.test(deadline) ? deadline : '',
      };
      if (isNew) state.goals.push({ id: uid(), createdAt: Date.now(), ...data });
      else Object.assign(goal, data);
      save();
      closeSheet();
      render();
      toast('Meta salva');
    });
    if (!isNew) {
      $('#delGoal', root).addEventListener('click', () => {
        confirmBox($('#confirmSlot', root), 'Excluir esta meta? Os lançamentos já feitos continuam.', [
          { label: 'Cancelar', onClick: () => { $('#confirmSlot', root).innerHTML = ''; } },
          {
            label: 'Excluir', cls: 'danger', onClick: () => {
              state.goals = state.goals.filter((g) => g.id !== goal.id);
              save();
              closeSheet();
              render();
              toast('Meta excluída');
            },
          },
        ]);
      });
    }
    if (isNew) $('#goalName', root).focus();
  }

  function openDepositSheet(goal) {
    let mode = 'in';
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${goal.icon} ${esc(goal.name)}</h2>
      <form id="depForm" class="form" novalidate>
        <div class="segmented" id="depSeg">
          <button type="button" data-value="in" class="active">Guardar</button>
          <button type="button" data-value="out">Retirar</button>
        </div>
        <div class="field"><label for="depAmount">Valor</label>
          <input id="depAmount" class="money" inputmode="numeric" autocomplete="off"></div>
        <label class="check"><input type="checkbox" id="depRecord" checked>
          <span id="depRecordLabel">Registrar como despesa em “Investir / guardar”, para sair do saldo do mês</span></label>
        <button class="btn primary block" type="submit" id="depSubmit">Guardar</button>
      </form>`);
    const input = $('#depAmount', root);
    bindMoney(input, 0);
    $('#depSeg', root).addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      mode = b.dataset.value;
      $$('#depSeg button', root).forEach((x) => x.classList.toggle('active', x === b));
      $('#depSubmit', root).textContent = mode === 'in' ? 'Guardar' : 'Retirar';
      $('#depRecordLabel', root).textContent = mode === 'in'
        ? 'Registrar como despesa em “Investir / guardar”, para sair do saldo do mês'
        : 'Registrar como receita, para o valor voltar ao saldo do mês';
    });
    $('#depForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      let cents = centsOf(input);
      if (cents <= 0) {
        toast('Digite um valor maior que zero.');
        input.focus();
        return;
      }
      if (mode === 'out') cents = Math.min(cents, goal.saved);
      if (cents <= 0) {
        toast('Essa meta ainda não tem dinheiro guardado.');
        return;
      }
      goal.saved += mode === 'in' ? cents : -cents;
      if ($('#depRecord', root).checked) {
        state.transactions.push({
          id: uid(),
          type: mode === 'in' ? 'expense' : 'income',
          category: mode === 'in' ? 'investimento' : 'outros_in',
          amount: cents,
          description: `${mode === 'in' ? 'Meta' : 'Resgate'}: ${goal.name}`.slice(0, 60),
          date: defaultDate(),
          createdAt: Date.now(),
        });
      }
      save();
      closeSheet();
      render();
      toast(mode === 'in' ? `${money(cents)} guardados 💪` : `${money(cents)} retirados`);
    });
    input.focus();
  }

  // ---------- Configurações e backup ----------

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
  });

  function backupJSON() {
    return JSON.stringify({ app: 'meu-bolso', exportedAt: new Date().toISOString(), ...state }, null, 2);
  }

  function openSettings() {
    const empty = !state.transactions.length && !state.goals.length;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">Configurações</h2>
      ${standalone ? '' : `<p class="eyebrow settings-section">Instalar no celular</p>
      ${installPrompt ? '<button class="btn primary block" type="button" id="installBtn">Instalar o app</button>' : ''}
      <ol class="install-steps">
        <li><strong>Android (Chrome):</strong> menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.</li>
        <li><strong>iPhone (Safari):</strong> botão Compartilhar → “Adicionar à Tela de Início”.</li>
      </ol>`}
      <p class="eyebrow settings-section">Backup</p>
      <p class="hint" style="margin-bottom:8px">Seus dados ficam só neste aparelho. Faça backup de vez em quando e guarde no Drive ou WhatsApp.</p>
      <div class="settings-list">
        <button class="btn" type="button" id="exportBtn">⬇️ Baixar backup (.json)</button>
        <button class="btn" type="button" id="copyBtn">📋 Copiar backup</button>
        <button class="btn" type="button" id="importBtn">⬆️ Restaurar backup de arquivo</button>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
        <div id="importSlot"></div>
      </div>
      <p class="eyebrow settings-section">Dados</p>
      <div class="settings-list">
        ${empty ? '<button class="btn" type="button" id="demoBtn">🧪 Carregar dados de exemplo</button>' : ''}
        <button class="btn danger" type="button" id="wipeBtn">Apagar todos os dados</button>
        <div id="wipeSlot"></div>
      </div>`);

    const installBtn = $('#installBtn', root);
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        installPrompt.prompt();
        await installPrompt.userChoice.catch(() => {});
        installPrompt = null;
        closeSheet();
      });
    }

    $('#exportBtn', root).addEventListener('click', () => {
      const blob = new Blob([backupJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `meu-bolso-backup-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Backup gerado');
    });

    $('#copyBtn', root).addEventListener('click', () => {
      const text = backupJSON();
      navigator.clipboard.writeText(text)
        .then(() => toast('Backup copiado. Cole num lugar seguro.'))
        .catch(() => {
          $('#importSlot', root).innerHTML = '<textarea class="backup-text" readonly aria-label="Backup"></textarea>';
          const ta = $('textarea', root);
          ta.value = text;
          ta.select();
          toast('Selecione e copie o texto abaixo.');
        });
    });

    $('#importBtn', root).addEventListener('click', () => $('#importFile', root).click());
    $('#importFile', root).addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let next;
        try {
          next = normalize(JSON.parse(String(reader.result)));
        } catch {
          toast('Esse arquivo não é um backup válido do Meu Bolso.');
          return;
        }
        confirmBox($('#importSlot', root),
          `Restaurar ${next.transactions.length} lançamentos e ${next.goals.length} metas? Os dados atuais serão substituídos.`, [
            { label: 'Cancelar', onClick: () => { $('#importSlot', root).innerHTML = ''; } },
            {
              label: 'Restaurar', cls: 'primary', onClick: () => {
                state = next;
                save();
                closeSheet();
                render();
                toast('Backup restaurado');
              },
            },
          ]);
      };
      reader.readAsText(file);
    });

    const demoBtn = $('#demoBtn', root);
    if (demoBtn) demoBtn.addEventListener('click', () => { loadDemo(); closeSheet(); });

    $('#wipeBtn', root).addEventListener('click', () => {
      confirmBox($('#wipeSlot', root), 'Apagar todos os lançamentos, limites e metas deste aparelho? Não dá para desfazer.', [
        { label: 'Cancelar', onClick: () => { $('#wipeSlot', root).innerHTML = ''; } },
        {
          label: 'Apagar tudo', cls: 'danger', onClick: () => {
            state = defaultState();
            save();
            closeSheet();
            ui.tab = 'home';
            render();
            toast('Dados apagados');
          },
        },
      ]);
    });
  }

  // ---------- Dados de exemplo ----------

  function loadDemo() {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const today = todayISO();
    const cur = monthOf(today);
    const s = defaultState();
    s.demo = true;
    const add = (type, category, reais, description, ym, day, extra) => {
      const date = `${ym}-${pad(Math.min(day, daysInMonth(ym)))}`;
      if (date > today) return;
      s.transactions.push({ id: uid(), type, category, amount: Math.round(reais * 100), description, date, createdAt: Date.now(), ...extra });
    };
    for (let i = 5; i >= 0; i--) {
      const m = shiftMonth(cur, -i);
      add('income', 'salario', 3200, 'Salário', m, 5);
      add('income', 'comissao', 300 + Math.round(rand() * 600), 'Comissão de compras', m, 20);
      add('expense', 'moradia', 950, 'Aluguel', m, 10, { recurring: true });
      add('expense', 'contas', 140 + Math.round(rand() * 60), 'Conta de luz', m, 12);
      add('expense', 'contas', 99.9, 'Internet', m, 15, { recurring: true });
      add('expense', 'mercado', 380 + Math.round(rand() * 120), 'Mercado do mês', m, 6);
      add('expense', 'mercado', 90 + Math.round(rand() * 80), 'Feira e padaria', m, 18);
      add('expense', 'transporte', 200 + Math.round(rand() * 80), 'Combustível', m, 8);
      add('expense', 'restaurante', 60 + Math.round(rand() * 90), 'iFood', m, 3);
      add('expense', 'restaurante', 40 + Math.round(rand() * 70), 'Lanche com a galera', m, 22);
      add('expense', 'assinaturas', 55.9, 'Streaming', m, 9, { recurring: true });
      add('expense', 'lazer', 80 + Math.round(rand() * 150), 'Saída de fim de semana', m, 14);
      if (rand() > 0.4) add('expense', 'compras', 120 + Math.round(rand() * 250), 'Roupa', m, 16);
      add('expense', 'investimento', 300, 'Meta: Reserva de emergência', m, 6);
    }
    s.budgets = { mercado: 60000, restaurante: 18000, lazer: 20000, compras: 25000, transporte: 30000 };
    s.goals = [
      { id: uid(), name: 'Reserva de emergência', icon: '🛡️', target: 1200000, saved: 360000, deadline: shiftMonth(cur, 18), createdAt: Date.now() },
      { id: uid(), name: 'Moto nova', icon: '🏍️', target: 1500000, saved: 210000, deadline: shiftMonth(cur, 24), createdAt: Date.now() },
    ];
    state = s;
    save();
    ui.month = cur;
    ui.tab = 'home';
    render();
    toast('Dados de exemplo carregados');
  }

  // ---------- Aviso rápido ----------

  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  // ---------- Eventos ----------

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tabbar button');
    if (tab) {
      ui.tab = tab.dataset.tab;
      render();
      window.scrollTo(0, 0);
      return;
    }
    const el = e.target.closest('[data-action]');
    if (!el || el.closest('#sheet')) return;
    const { action } = el.dataset;
    if (action === 'go-tab') {
      ui.tab = el.dataset.tab;
      render();
      window.scrollTo(0, 0);
    } else if (action === 'filter-cat') {
      ui.category = el.dataset.cat;
      ui.filter = 'expense';
      ui.query = '';
      ui.tab = 'transactions';
      render();
      window.scrollTo(0, 0);
    } else if (action === 'clear-cat') {
      ui.category = null;
      render();
    } else if (action === 'filter-type') {
      ui.filter = el.dataset.value;
      if (ui.filter === 'income') ui.category = null;
      render();
    } else if (action === 'edit-tx') {
      const tx = state.transactions.find((t) => t.id === el.dataset.id);
      if (tx) openTxSheet(tx);
    } else if (action === 'edit-budget') {
      openBudgetSheet(el.dataset.cat);
    } else if (action === 'new-goal') {
      openGoalSheet();
    } else if (action === 'edit-goal' || action === 'deposit') {
      const goal = state.goals.find((g) => g.id === el.dataset.id);
      if (goal) (action === 'deposit' ? openDepositSheet : openGoalSheet)(goal);
    } else if (action === 'trend-sel') {
      selectTrend(el.dataset.month);
    } else if (action === 'new-income') {
      openTxSheet(null, 'income');
    } else if (action === 'load-demo') {
      loadDemo();
    } else if (action === 'clear-demo') {
      state = defaultState();
      save();
      render();
      toast('Tudo limpo. Bora começar!');
    }
  });

  document.addEventListener('pointerover', (e) => {
    const col = e.target.closest('.trend-col');
    if (col && e.pointerType === 'mouse') selectTrend(col.dataset.month);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'txSearch') {
      ui.query = e.target.value;
      renderTxList();
    }
  });

  $('#prevMonth').addEventListener('click', () => { ui.month = shiftMonth(ui.month, -1); ui.trendSel = null; render(); });
  $('#nextMonth').addEventListener('click', () => { ui.month = shiftMonth(ui.month, 1); ui.trendSel = null; render(); });
  $('#monthLabel').addEventListener('click', () => { ui.month = currentMonth(); ui.trendSel = null; render(); });
  $('#settingsBtn').addEventListener('click', openSettings);
  $('#fab').addEventListener('click', () => openTxSheet());
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  // Outra aba do navegador alterou os dados.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      render();
    }
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.MEUBOLSO_PREVIEW) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  if (window.MEUBOLSO_PREVIEW && !state.transactions.length && !state.goals.length) loadDemo();
  else render();
})();
