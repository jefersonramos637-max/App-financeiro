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
  const fmtMoney = (cents) => BRL.format((cents || 0) / 100);
  // No modo "esconder valores" a tela mostra só R$ •••.
  const money = (cents) => (ui.hide ? 'R$ •••' : fmtMoney(cents));
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

  const LOCK_OPTIONS = [0, 60, 300];
  const MAX_CENTS = 1e11;
  const defaultSettings = () => ({ hideValues: false, lockAfter: 60, lastBackupAt: 0 });
  const defaultState = () => ({
    version: 2, transactions: [], budgets: {}, goals: [], demo: false, settings: defaultSettings(),
  });

  const isISO = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const isPosInt = (n) => Number.isInteger(n) && n > 0 && n <= MAX_CENTS;

  // Valida e limpa dados vindos do armazenamento ou de um backup.
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Arquivo inválido');
    const s = defaultState();
    s.demo = !!raw.demo;
    const rs = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    s.settings = {
      hideValues: !!rs.hideValues,
      lockAfter: LOCK_OPTIONS.includes(rs.lockAfter) ? rs.lockAfter : 60,
      lastBackupAt: Number.isFinite(rs.lastBackupAt) ? rs.lastBackupAt : 0,
    };
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
        saved: Number.isInteger(g.saved) && g.saved > 0 ? Math.min(g.saved, MAX_CENTS) : 0,
        deadline: typeof g.deadline === 'string' && /^\d{4}-\d{2}$/.test(g.deadline) ? g.deadline : '',
        createdAt: Number(g.createdAt) || Date.now(),
      }));
    return s;
  }

  // ---------- Criptografia (PIN) ----------
  // Com PIN, os dados ficam gravados cifrados com AES-GCM. A chave sai do PIN via PBKDF2
  // e só existe na memória enquanto o app está desbloqueado.

  const ENC_FORMAT = 'meubolso-enc';
  const PBKDF2_ITERATIONS = 600000;
  const textEnc = new TextEncoder();
  const textDec = new TextDecoder();
  const toB64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  const isEnvelope = (o) => !!o && o.format === ENC_FORMAT && typeof o.data === 'string' && typeof o.iv === 'string';

  let cryptoKey = null;
  let cryptoSalt = null;
  let pinLength = 0;

  async function deriveKey(pin, salt, iterations = PBKDF2_ITERATIONS) {
    const base = await crypto.subtle.importKey('raw', textEnc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    );
  }

  async function encryptText(text, key, salt, len) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEnc.encode(text));
    return { format: ENC_FORMAT, v: 1, iter: PBKDF2_ITERATIONS, len, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
  }

  async function decryptEnvelope(env, key) {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(env.iv) }, key, fromB64(env.data));
    return textDec.decode(plain);
  }

  // Abre um envelope com o PIN. Lança erro se o PIN estiver errado.
  async function openEnvelope(env, pin) {
    const salt = fromB64(env.salt);
    const key = await deriveKey(pin, salt, env.iter || PBKDF2_ITERATIONS);
    return { text: await decryptEnvelope(env, key), key, salt };
  }

  // ---------- Armazenamento ----------

  const parseJSON = (s) => {
    try { return JSON.parse(s); } catch { return null; }
  };
  const readRaw = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  };
  const storedEnvelope = () => {
    const o = parseJSON(readRaw());
    return isEnvelope(o) ? o : null;
  };

  // Lê o estado salvo. Se estiver corrompido, guarda uma cópia antes de recomeçar.
  function parseState(text) {
    if (!text) return defaultState();
    try {
      return normalize(JSON.parse(text));
    } catch {
      try { localStorage.setItem(`${STORAGE_KEY}:corrompido`, text); } catch { /* sem espaço */ }
      return defaultState();
    }
  }

  let saveChain = Promise.resolve();
  let askedPersist = false;
  // Grava em fila, para que salvamentos seguidos nunca cheguem fora de ordem.
  function save() {
    monthIndex = null;
    const text = JSON.stringify(state);
    const [key, salt, len] = [cryptoKey, cryptoSalt, pinLength];
    saveChain = saveChain
      .then(async () => {
        const out = key ? JSON.stringify(await encryptText(text, key, salt, len)) : text;
        localStorage.setItem(STORAGE_KEY, out);
      })
      .catch(() => toast('Não consegui salvar. Libere espaço no aparelho e tente de novo.'));
    // Pede ao navegador para não apagar os dados quando faltar espaço.
    if (!askedPersist && navigator.storage && navigator.storage.persist) {
      askedPersist = true;
      navigator.storage.persist().catch(() => {});
    }
    return saveChain;
  }

  // ----- Pontos de restauração (IndexedDB) -----
  // Uma cópia por dia, tirada na primeira abertura do dia, dos últimos 7 dias.

  const SNAP_KEEP = 7;

  function snapDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB indisponível'));
        return;
      }
      const req = indexedDB.open('meubolso', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('snapshots', { keyPath: 'day' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function snapStore(mode, fn) {
    const db = await snapDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snapshots', mode);
      const req = fn(tx.objectStore('snapshots'));
      tx.oncomplete = () => {
        db.close();
        resolve(req && 'result' in req ? req.result : undefined);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function listSnapshots() {
    const all = (await snapStore('readonly', (s) => s.getAll())) || [];
    return all.sort((a, b) => (a.day < b.day ? 1 : -1));
  }

  async function snapshotToday() {
    const raw = readRaw();
    if (!raw || !state || state.demo || !state.transactions.length) return;
    const day = todayISO();
    const all = await listSnapshots();
    if (all.some((s) => s.day === day)) return;
    await snapStore('readwrite', (s) => s.put({ day, raw, count: state.transactions.length, at: Date.now() }));
    const old = [...all.filter((s) => s.day !== day)].slice(SNAP_KEEP - 1);
    if (old.length) await snapStore('readwrite', (s) => old.forEach((o) => s.delete(o.day)));
  }

  const clearSnapshots = () => snapStore('readwrite', (s) => s.clear()).catch(() => {});

  // Ao criar, trocar ou remover o PIN, recifra os pontos de restauração com a chave nova.
  async function reencodeSnapshots(oldKey, newKey, newSalt, newLen) {
    const all = await listSnapshots().catch(() => []);
    for (const snap of all) {
      try {
        const o = parseJSON(snap.raw);
        const text = isEnvelope(o) ? await decryptEnvelope(o, oldKey) : snap.raw;
        snap.raw = newKey ? JSON.stringify(await encryptText(text, newKey, newSalt, newLen)) : text;
        await snapStore('readwrite', (s) => s.put(snap));
      } catch {
        await snapStore('readwrite', (s) => s.delete(snap.day)).catch(() => {});
      }
    }
  }

  let state = null;
  const ui = {
    tab: 'home', month: currentMonth(), filter: 'all', category: null, query: '', trendSel: null, hide: false,
  };

  // Índice de lançamentos por mês, refeito só quando os dados mudam.
  let monthIndex = null;
  function txOfMonth(ym) {
    if (!monthIndex) {
      monthIndex = new Map();
      for (const t of state.transactions) {
        const k = monthOf(t.date);
        if (!monthIndex.has(k)) monthIndex.set(k, []);
        monthIndex.get(k).push(t);
      }
    }
    return monthIndex.get(ym) || [];
  }
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

  const EYE = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
  const EYE_OFF = '<path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';

  function render() {
    ui.hide = !!state.settings.hideValues;
    const privacy = $('#privacyBtn');
    privacy.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ui.hide ? EYE_OFF : EYE}</svg>`;
    privacy.setAttribute('aria-pressed', String(ui.hide));
    privacy.setAttribute('aria-label', ui.hide ? 'Mostrar valores' : 'Esconder valores');
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
      backupReminder(),
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

  function backupReminder() {
    if (state.demo || state.transactions.length < 10) return '';
    const last = state.settings.lastBackupAt;
    const days = last ? Math.floor((Date.now() - last) / 864e5) : null;
    if (days !== null && days < 30) return '';
    return `<section class="card tip"><div class="tip-icon" aria-hidden="true">💾</div><div>
      <p><strong>${days === null ? 'Você ainda não fez nenhum backup.' : `Seu último backup foi há ${days} dias.`}</strong>
      Se o celular quebrar ou for trocado, é o backup que salva seus dados.</p>
      <button class="link-btn" type="button" data-action="backup-now">Fazer backup agora</button></div></section>`;
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
        <div class="trend-grid" aria-hidden="true"><span class="num">${ui.hide ? '' : BRL_COMPACT.format(top / 100)}</span></div>
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
      input.value = fmtMoney(c);
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
    const removed = state.transactions.filter(predicate);
    state.transactions = state.transactions.filter((t) => !predicate(t));
    save();
    closeSheet();
    render();
    toast(message, {
      label: 'Desfazer',
      run: () => {
        state.transactions.push(...removed);
        save();
        render();
        toast('Lançamento restaurado');
      },
    });
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
              const index = state.goals.indexOf(goal);
              state.goals = state.goals.filter((g) => g.id !== goal.id);
              save();
              closeSheet();
              render();
              toast('Meta excluída', {
                label: 'Desfazer',
                run: () => {
                  state.goals.splice(index, 0, goal);
                  save();
                  render();
                  toast('Meta restaurada');
                },
              });
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

  // ---------- Configurações, segurança e backup ----------

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
  });

  const formatBytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

  // Backup em JSON. Com PIN ativo, sai cifrado com o mesmo PIN.
  async function backupText() {
    const meta = { app: 'meu-bolso', exportedAt: new Date().toISOString() };
    if (cryptoKey) {
      return JSON.stringify({ ...meta, ...(await encryptText(JSON.stringify(state), cryptoKey, cryptoSalt, pinLength)) });
    }
    return JSON.stringify({ ...meta, ...state }, null, 2);
  }

  // Planilha para Excel/Google Planilhas (separador ; e vírgula decimal, padrão brasileiro).
  function csvText() {
    // Textos que começam com = + - @ viram fórmula no Excel; o apóstrofo impede isso.
    const text = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = ['Data;Tipo;Categoria;Descrição;Valor;Repetição'];
    for (const t of sortTx(state.transactions)) {
      const [y, m, d] = t.date.split('-');
      const value = ((t.type === 'income' ? 1 : -1) * t.amount / 100).toFixed(2).replace('.', ',');
      lines.push([
        `${d}/${m}/${y}`,
        t.type === 'income' ? 'Receita' : 'Despesa',
        text(catById(t.type, t.category).name),
        text(t.description),
        value,
        text(t.installment ? `Parcela ${t.installment}` : t.recurring ? 'Fixa mensal' : ''),
      ].join(';'));
    }
    return `﻿${lines.join('\r\n')}`;
  }

  // No iPhone abre o menu Compartilhar (Arquivos, WhatsApp, Drive); nos outros, baixa o arquivo.
  async function deliverFile(name, text, type) {
    const file = new File([text], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        return true;
      } catch (err) {
        if (err && err.name === 'AbortError') return false;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  }

  async function exportBackup() {
    const ok = await deliverFile(`meu-bolso-backup-${todayISO()}.json`, await backupText(), 'application/json');
    if (!ok) return;
    state.settings.lastBackupAt = Date.now();
    save();
    render();
    toast(cryptoKey ? 'Backup protegido salvo' : 'Backup salvo');
  }

  function restoreState(next, message) {
    state = next;
    save();
    closeSheet();
    render();
    toast(message);
  }

  function openSettings() {
    const empty = !state.transactions.length && !state.goals.length;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const last = state.settings.lastBackupAt;
    const lockOpt = (v, label) => `<option value="${v}"${state.settings.lockAfter === v ? ' selected' : ''}>${label}</option>`;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">Configurações</h2>
      ${standalone ? '' : `<p class="eyebrow settings-section">Instalar no celular</p>
      ${installPrompt ? '<button class="btn primary block" type="button" id="installBtn">Instalar o app</button>' : ''}
      <ol class="install-steps">
        <li><strong>iPhone (Safari):</strong> botão Compartilhar → “Adicionar à Tela de Início”.</li>
        <li><strong>Android (Chrome):</strong> menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.</li>
      </ol>`}

      <p class="eyebrow settings-section">Segurança</p>
      <div class="settings-list">
        ${cryptoKey ? `
          <p class="hint">🔒 PIN ativo. Seus dados ficam criptografados neste aparelho.</p>
          <button class="btn" type="button" id="lockNow">Bloquear agora</button>
          <div class="field"><label for="lockAfter">Bloquear automaticamente ao sair do app</label>
            <select id="lockAfter">${lockOpt(0, 'Imediatamente')}${lockOpt(60, 'Depois de 1 minuto')}${lockOpt(300, 'Depois de 5 minutos')}</select></div>
          <button class="btn" type="button" id="changePin">Trocar PIN</button>
          <button class="btn" type="button" id="removePin">Remover PIN</button>` : `
          <button class="btn primary" type="button" id="createPin">🔒 Proteger com PIN</button>
          <p class="hint">O app passa a pedir um PIN ao abrir e os dados ficam criptografados no aparelho.</p>`}
        <label class="check"><input type="checkbox" id="hideValues"${state.settings.hideValues ? ' checked' : ''}>
          <span>Esconder valores na tela (bom para usar em público)</span></label>
      </div>

      <p class="eyebrow settings-section">Backup</p>
      <p class="hint" style="margin-bottom:8px">Último backup: <strong>${last ? new Date(last).toLocaleDateString('pt-BR') : 'nenhum ainda'}</strong>.
        Salve no Arquivos, Drive ou numa conversa sua no WhatsApp.${cryptoKey ? ' O backup sai protegido com o seu PIN.' : ''}</p>
      <div class="settings-list">
        <button class="btn" type="button" id="exportBtn">💾 Salvar backup</button>
        <button class="btn" type="button" id="copyBtn">📋 Copiar backup</button>
        <button class="btn" type="button" id="importBtn">⬆️ Restaurar backup de arquivo</button>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
        <div id="importSlot"></div>
        <button class="btn" type="button" id="csvBtn">📊 Exportar planilha (Excel)</button>
        <p class="hint">A planilha não fica protegida pelo PIN.</p>
      </div>

      <p class="eyebrow settings-section">Pontos de restauração</p>
      <p class="hint" style="margin-bottom:8px">O app guarda sozinho uma cópia por dia dos últimos 7 dias. Use se apagar algo sem querer.</p>
      <div class="settings-list" id="snapList"><p class="hint">Carregando…</p></div>

      <p class="eyebrow settings-section">Dados</p>
      <p class="hint" id="storageInfo" style="margin-bottom:8px"></p>
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

    // Segurança
    const on = (id, fn) => { const el = $(`#${id}`, root); if (el) el.addEventListener('click', fn); };
    on('createPin', () => openPinSheet('create'));
    on('changePin', () => openPinSheet('change'));
    on('removePin', () => openPinSheet('remove'));
    on('lockNow', () => lock());
    const lockAfter = $('#lockAfter', root);
    if (lockAfter) {
      lockAfter.addEventListener('change', () => {
        state.settings.lockAfter = Number(lockAfter.value);
        save();
        toast('Bloqueio automático atualizado');
      });
    }
    $('#hideValues', root).addEventListener('change', (e) => {
      state.settings.hideValues = e.target.checked;
      save();
      render();
    });

    // Backup
    on('exportBtn', exportBackup);
    on('csvBtn', async () => {
      if (await deliverFile(`meu-bolso-${todayISO()}.csv`, csvText(), 'text/csv')) toast('Planilha gerada');
    });
    on('copyBtn', () => {
      const textPromise = backupText();
      const done = () => {
        state.settings.lastBackupAt = Date.now();
        save();
        toast('Backup copiado. Cole num lugar seguro.');
      };
      const fallback = async () => {
        $('#importSlot', root).innerHTML = '<textarea class="backup-text" readonly aria-label="Backup"></textarea>';
        const ta = $('textarea', root);
        ta.value = await textPromise;
        ta.select();
        toast('Selecione e copie o texto abaixo.');
      };
      // O Safari só aceita copiar dentro do toque; o ClipboardItem com promessa resolve isso.
      let copy;
      if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
        copy = navigator.clipboard.write([new ClipboardItem({
          'text/plain': textPromise.then((t) => new Blob([t], { type: 'text/plain' })),
        })]);
      } else if (navigator.clipboard) {
        copy = textPromise.then((t) => navigator.clipboard.writeText(t));
      } else {
        copy = Promise.reject(new Error('sem clipboard'));
      }
      copy.then(done).catch(fallback);
    });

    on('importBtn', () => $('#importFile', root).click());
    $('#importFile', root).addEventListener('change', (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      if (file.size > 10 * 1048576) {
        toast('Arquivo grande demais para ser um backup do Meu Bolso.');
        return;
      }
      const slot = $('#importSlot', root);
      const confirmRestore = (next) => confirmBox(slot,
        `Restaurar ${next.transactions.length} lançamentos e ${next.goals.length} metas? Os dados atuais serão substituídos.`, [
          { label: 'Cancelar', onClick: () => { slot.innerHTML = ''; } },
          { label: 'Restaurar', cls: 'primary', onClick: () => restoreState(next, 'Backup restaurado') },
        ]);
      const reader = new FileReader();
      reader.onload = () => {
        const obj = parseJSON(String(reader.result));
        if (isEnvelope(obj)) {
          slot.innerHTML = `<div class="field"><label for="importPin">Este backup é protegido. Digite o PIN usado nele</label>
            <input id="importPin" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></div>
            <button class="btn primary block" type="button" id="importPinBtn">Abrir backup</button>`;
          $('#importPin', slot).focus();
          $('#importPinBtn', slot).addEventListener('click', async (ev) => {
            ev.target.disabled = true;
            ev.target.textContent = 'Abrindo…';
            try {
              const { text } = await openEnvelope(obj, $('#importPin', slot).value);
              confirmRestore(normalize(JSON.parse(text)));
            } catch {
              ev.target.disabled = false;
              ev.target.textContent = 'Abrir backup';
              toast('PIN incorreto para este backup.');
            }
          });
          return;
        }
        try {
          confirmRestore(normalize(obj));
        } catch {
          toast('Esse arquivo não é um backup válido do Meu Bolso.');
        }
      };
      reader.readAsText(file);
    });

    // Pontos de restauração
    listSnapshots()
      .then((snaps) => {
        const list = $('#snapList', root);
        if (!list) return;
        if (!snaps.length) {
          list.innerHTML = '<p class="hint">Ainda não há pontos. O primeiro é criado quando você tiver lançamentos.</p>';
          return;
        }
        list.innerHTML = snaps.map((s, i) => `<div class="snap-row">
            <span><strong>${esc(dayLabel(s.day))}</strong><br><small>${s.count} lançamentos</small></span>
            <button class="btn" type="button" data-i="${i}">Restaurar</button></div>`).join('') + '<div id="snapSlot"></div>';
        $$('.snap-row button', list).forEach((b) => b.addEventListener('click', () => {
          const snap = snaps[Number(b.dataset.i)];
          confirmBox($('#snapSlot', list), `Voltar os dados para como estavam em ${esc(dayLabel(snap.day).toLowerCase())}? O que foi feito depois será perdido.`, [
            { label: 'Cancelar', onClick: () => { $('#snapSlot', list).innerHTML = ''; } },
            {
              label: 'Restaurar', cls: 'primary', onClick: async () => {
                try {
                  const o = parseJSON(snap.raw);
                  const text = isEnvelope(o) ? await decryptEnvelope(o, cryptoKey) : snap.raw;
                  restoreState(normalize(JSON.parse(text)), 'Dados restaurados');
                } catch {
                  toast('Não consegui abrir esse ponto de restauração.');
                }
              },
            },
          ]);
        }));
      })
      .catch(() => {
        const list = $('#snapList', root);
        if (list) list.innerHTML = '<p class="hint">Este navegador não permite pontos de restauração.</p>';
      });

    // Armazenamento
    (async () => {
      const parts = [`Seus dados ocupam ${formatBytes(new Blob([readRaw() || '']).size)}`];
      try {
        if (await navigator.storage.persisted()) parts.push('protegidos contra limpeza automática do navegador');
      } catch { /* sem suporte */ }
      const el = $('#storageInfo', root);
      if (el) el.textContent = `${parts.join(', ')}.`;
    })();

    const demoBtn = $('#demoBtn', root);
    if (demoBtn) demoBtn.addEventListener('click', () => { loadDemo(); closeSheet(); });

    on('wipeBtn', () => {
      confirmBox($('#wipeSlot', root), 'Apagar todos os lançamentos, limites e metas deste aparelho? Os pontos de restauração continuam guardados.', [
        { label: 'Cancelar', onClick: () => { $('#wipeSlot', root).innerHTML = ''; } },
        {
          label: 'Apagar tudo', cls: 'danger', onClick: () => {
            state = { ...defaultState(), settings: state.settings };
            ui.tab = 'home';
            restoreState(state, 'Dados apagados');
          },
        },
      ]);
    });
  }

  // Criar, trocar ou remover o PIN.
  function openPinSheet(mode) {
    const needCurrent = mode !== 'create';
    const needNew = mode !== 'remove';
    const titles = { create: 'Proteger com PIN', change: 'Trocar PIN', remove: 'Remover PIN' };
    const pinField = (id, label) => `<div class="field"><label for="${id}">${label}</label>
      <input id="${id}" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off"></div>`;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${titles[mode]}</h2>
      <form id="pinForm" class="form" novalidate>
        ${needCurrent ? pinField('pinCurrent', 'PIN atual') : ''}
        ${needNew ? `${pinField('pinNew', 'Novo PIN (4 a 8 números)')}${pinField('pinConfirm', 'Repita o novo PIN')}
          <p class="hint">⚠ Se esquecer o PIN, não tem como recuperar os dados, nem por mim. Mantenha um backup em dia.</p>` : ''}
        <button class="btn primary block" type="submit" id="pinSubmit">${mode === 'remove' ? 'Remover PIN' : 'Salvar PIN'}</button>
      </form>`);
    $('input', root).focus();
    $('#pinForm', root).addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = (id) => ($(`#${id}`, root) ? $(`#${id}`, root).value : '');
      const pin = val('pinNew');
      if (needNew && !/^\d{4,8}$/.test(pin)) {
        toast('O PIN precisa ter de 4 a 8 números.');
        return;
      }
      if (needNew && pin !== val('pinConfirm')) {
        toast('Os dois PINs não são iguais.');
        return;
      }
      const btn = $('#pinSubmit', root);
      btn.disabled = true;
      btn.textContent = 'Aguarde…';
      try {
        if (needCurrent) {
          const env = storedEnvelope();
          try {
            await openEnvelope(env, val('pinCurrent'));
          } catch {
            toast('PIN atual incorreto.');
            return;
          }
        }
        const oldKey = cryptoKey;
        if (needNew) {
          cryptoSalt = crypto.getRandomValues(new Uint8Array(16));
          cryptoKey = await deriveKey(pin, cryptoSalt);
          pinLength = pin.length;
        } else {
          cryptoKey = null;
          cryptoSalt = null;
          pinLength = 0;
        }
        await save();
        await reencodeSnapshots(oldKey, cryptoKey, cryptoSalt, pinLength);
        closeSheet();
        render();
        toast({ create: 'PIN criado. Seus dados estão protegidos 🔒', change: 'PIN trocado', remove: 'PIN removido' }[mode]);
      } finally {
        btn.disabled = false;
        btn.textContent = mode === 'remove' ? 'Remover PIN' : 'Salvar PIN';
      }
    });
  }

  // ---------- Tela de bloqueio ----------

  const THROTTLE_KEY = `${STORAGE_KEY}:tentativas`;
  const readThrottle = () => parseJSON((() => { try { return localStorage.getItem(THROTTLE_KEY); } catch { return null; } })()) || { fails: 0, until: 0 };
  const writeThrottle = (t) => { try { localStorage.setItem(THROTTLE_KEY, JSON.stringify(t)); } catch { /* sem espaço */ } };

  function setLocked(locked) {
    document.body.classList.toggle('locked', locked);
    ['.topbar', '#view', '#fab', '.tabbar', '#sheet', '#toast'].forEach((sel) => {
      const el = $(sel);
      if (el) el.inert = locked;
    });
  }

  function showLock() {
    const env = storedEnvelope();
    if (!env) {
      state = parseState(readRaw());
      start();
      return;
    }
    const len = Number.isInteger(env.len) && env.len >= 4 && env.len <= 8 ? env.len : 0;
    let entry = '';
    let busy = false;
    let el = $('#lock');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lock';
      el.className = 'lock';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', 'App bloqueado');
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="lock-inner">
      <div class="lock-icon" aria-hidden="true">🔒</div>
      <h1 class="lock-title">Meu Bolso</h1>
      <p class="lock-msg" id="lockMsg" aria-live="polite">Digite seu PIN</p>
      <div class="pin-dots" id="pinDots" aria-hidden="true"></div>
      <div class="keypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-key="${n}">${n}</button>`).join('')}
        ${len ? '<span></span>' : '<button type="button" data-key="ok" aria-label="Confirmar">OK</button>'}
        <button type="button" data-key="0">0</button>
        <button type="button" data-key="back" aria-label="Apagar">⌫</button>
      </div>
      <button class="link-btn" type="button" id="forgotPin">Esqueci meu PIN</button>
      <div id="forgotSlot"></div>
    </div>`;
    el.hidden = false;
    setLocked(true);

    const msg = $('#lockMsg', el);
    const dots = () => {
      const total = len || Math.max(4, entry.length);
      $('#pinDots', el).innerHTML = Array.from({ length: total }, (_, i) => `<span class="${i < entry.length ? 'on' : ''}"></span>`).join('');
    };
    dots();

    async function tryUnlock() {
      const th = readThrottle();
      if (th.until > Date.now()) {
        msg.textContent = `Muitas tentativas. Aguarde ${Math.ceil((th.until - Date.now()) / 1000)} s.`;
        entry = '';
        dots();
        return;
      }
      busy = true;
      msg.textContent = 'Abrindo…';
      try {
        const { text, key, salt } = await openEnvelope(env, entry);
        cryptoKey = key;
        cryptoSalt = salt;
        pinLength = entry.length;
        state = parseState(text);
        writeThrottle({ fails: 0, until: 0 });
        el.hidden = true;
        el.innerHTML = '';
        setLocked(false);
        document.removeEventListener('keydown', onKey);
        start();
      } catch {
        const fails = th.fails + 1;
        const until = fails >= 5 ? Date.now() + Math.min(900, 30 * 2 ** (fails - 5)) * 1000 : 0;
        writeThrottle({ fails, until });
        msg.textContent = until ? `PIN incorreto. Aguarde ${Math.ceil((until - Date.now()) / 1000)} s.` : 'PIN incorreto. Tente de novo.';
        $('#pinDots', el).classList.remove('shake');
        void $('#pinDots', el).offsetWidth;
        $('#pinDots', el).classList.add('shake');
        entry = '';
        dots();
      } finally {
        busy = false;
      }
    }

    function press(key) {
      if (busy) return;
      if (key === 'back') entry = entry.slice(0, -1);
      else if (key === 'ok') { if (entry.length >= 4) tryUnlock(); return; }
      else if (entry.length < 8) entry += key;
      dots();
      if (len && entry.length === len) tryUnlock();
    }

    function onKey(e) {
      if (el.hidden) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter') press('ok');
    }
    document.addEventListener('keydown', onKey);
    $('.keypad', el).addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) press(b.dataset.key);
    });

    $('#forgotPin', el).addEventListener('click', () => {
      confirmBox($('#forgotSlot', el),
        'Sem o PIN não dá para abrir os dados, nem eu consigo recuperar. Você pode apagar tudo e começar de novo. Se tiver um backup sem PIN ou souber o PIN dele, restaure depois pela ⚙.', [
          { label: 'Cancelar', onClick: () => { $('#forgotSlot', el).innerHTML = ''; } },
          {
            label: 'Apagar tudo', cls: 'danger', onClick: async () => {
              try { localStorage.removeItem(STORAGE_KEY); } catch { /* nada */ }
              writeThrottle({ fails: 0, until: 0 });
              await clearSnapshots();
              el.hidden = true;
              setLocked(false);
              document.removeEventListener('keydown', onKey);
              state = defaultState();
              start();
            },
          },
        ]);
    });
  }

  async function lock() {
    if (!cryptoKey) return;
    await saveChain;
    closeSheet();
    cryptoKey = null;
    cryptoSalt = null;
    state = null;
    monthIndex = null;
    $('#view').innerHTML = '';
    showLock();
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
    if (state) s.settings = state.settings;
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
  // Aviso rápido; com `action` mostra um botão (ex.: Desfazer) por mais tempo.
  function toast(msg, action) {
    const el = $('#toast');
    el.textContent = '';
    const text = document.createElement('span');
    text.textContent = msg;
    el.appendChild(text);
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'toast-action';
      b.textContent = action.label;
      b.addEventListener('click', () => {
        el.hidden = true;
        action.run();
      });
      el.appendChild(b);
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, action ? 6000 : 2600);
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
    } else if (action === 'backup-now') {
      exportBackup();
    } else if (action === 'clear-demo') {
      state = { ...defaultState(), settings: state.settings };
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

  function changeMonth(n) {
    ui.month = shiftMonth(ui.month, n);
    ui.trendSel = null;
    render();
    const view = $('#view');
    view.classList.remove('slide-next', 'slide-prev');
    void view.offsetWidth;
    view.classList.add(n > 0 ? 'slide-next' : 'slide-prev');
  }

  $('#prevMonth').addEventListener('click', () => changeMonth(-1));
  $('#nextMonth').addEventListener('click', () => changeMonth(1));
  $('#monthLabel').addEventListener('click', () => { ui.month = currentMonth(); ui.trendSel = null; render(); });
  $('#settingsBtn').addEventListener('click', openSettings);
  $('#privacyBtn').addEventListener('click', () => {
    state.settings.hideValues = !state.settings.hideValues;
    save();
    render();
  });
  $('#fab').addEventListener('click', () => openTxSheet());
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  // Arrastar para os lados troca o mês.
  let swipe = null;
  $('#view').addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    swipe = e.touches.length === 1 && t.clientX > 24 && t.clientX < window.innerWidth - 24
      ? { x: t.clientX, y: t.clientY, at: Date.now() } : null;
  }, { passive: true });
  $('#view').addEventListener('touchend', (e) => {
    if (!swipe || ui.tab === 'goals') return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipe.x;
    const dy = t.clientY - swipe.y;
    const quick = Date.now() - swipe.at < 600;
    swipe = null;
    if (quick && Math.abs(dx) > 70 && Math.abs(dy) < 45) changeMonth(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Arrastar o painel para baixo fecha.
  const sheetEl = $('#sheet .sheet');
  let drag = null;
  sheetEl.addEventListener('touchstart', (e) => {
    drag = sheetEl.scrollTop <= 0 && !e.target.closest('input, select, textarea') ? { y: e.touches[0].clientY, dy: 0 } : null;
  }, { passive: true });
  sheetEl.addEventListener('touchmove', (e) => {
    if (!drag) return;
    drag.dy = Math.max(0, e.touches[0].clientY - drag.y);
    if (drag.dy > 6) {
      sheetEl.classList.add('dragging');
      sheetEl.style.transform = `translateY(${drag.dy}px)`;
    }
  }, { passive: true });
  sheetEl.addEventListener('touchend', () => {
    if (!drag) return;
    const shouldClose = drag.dy > 110;
    drag = null;
    sheetEl.classList.remove('dragging');
    sheetEl.style.transform = '';
    if (shouldClose) closeSheet();
  });

  // Bloqueia sozinho depois de um tempo fora do app.
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!state) return;
    if (document.hidden) {
      hiddenAt = Date.now();
      if (cryptoKey && state.settings.lockAfter === 0) lock();
      return;
    }
    if (cryptoKey && hiddenAt && Date.now() - hiddenAt >= state.settings.lockAfter * 1000) {
      lock();
      return;
    }
    snapshotToday().catch(() => {});
    if (swRegistration) swRegistration.update().catch(() => {});
  });

  // Outra aba do navegador alterou os dados.
  window.addEventListener('storage', async (e) => {
    if (e.key !== STORAGE_KEY || !state) return;
    const o = parseJSON(e.newValue);
    if (isEnvelope(o)) {
      try {
        state = parseState(await decryptEnvelope(o, cryptoKey));
      } catch {
        lock();
        return;
      }
    } else if (cryptoKey) {
      cryptoKey = null;
      cryptoSalt = null;
      pinLength = 0;
      state = parseState(e.newValue);
    } else {
      state = parseState(e.newValue);
    }
    monthIndex = null;
    render();
  });

  // Atualização: quando sai versão nova, oferece atualizar na hora.
  let swRegistration = null;
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.MEUBOLSO_PREVIEW) {
    window.addEventListener('load', async () => {
      try {
        swRegistration = await navigator.serviceWorker.register('sw.js');
        const offer = (worker) => toast('Nova versão do app disponível', {
          label: 'Atualizar',
          run: async () => {
            await saveChain;
            worker.postMessage('skipWaiting');
          },
        });
        if (swRegistration.waiting && navigator.serviceWorker.controller) offer(swRegistration.waiting);
        swRegistration.addEventListener('updatefound', () => {
          const worker = swRegistration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
          });
        });
        let reloading = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloading) return;
          reloading = true;
          location.reload();
        });
      } catch { /* sem modo offline */ }
    });
  }

  // ---------- Início ----------

  function start() {
    render();
    snapshotToday().catch(() => {});
  }

  if (isEnvelope(parseJSON(readRaw()))) {
    showLock();
  } else {
    state = parseState(readRaw());
    if (window.MEUBOLSO_PREVIEW && !state.transactions.length && !state.goals.length) loadDemo();
    else start();
  }
})();
