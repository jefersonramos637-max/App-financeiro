'use strict';

(() => {
  const STORAGE_KEY = 'meubolso:v1';

  // ---------- Aparência ----------
  // Modo (automático, claro, escuro) e cor do app. Fica guardado só neste aparelho, fora dos dados
  // protegidos por PIN, para já valer na tela de bloqueio.

  const THEME_KEY = 'meubolso:tema';
  const ACCENTS = [
    ['verde', 'Verde', '#146c5b'], ['azul', 'Azul', '#1d4ed8'], ['roxo', 'Roxo', '#6d28d9'],
    ['laranja', 'Laranja', '#b45309'], ['rosa', 'Rosa', '#be185d'], ['grafite', 'Grafite', '#334155'],
  ];
  const THEME_MODES = [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']];

  function readTheme() {
    try {
      const o = JSON.parse(localStorage.getItem(THEME_KEY));
      return {
        mode: o && ['auto', 'light', 'dark'].includes(o.mode) ? o.mode : 'auto',
        accent: o && ACCENTS.some((a) => a[0] === o.accent) ? o.accent : 'verde',
      };
    } catch {
      return { mode: 'auto', accent: 'verde' };
    }
  }
  let theme = readTheme();

  // Cor da barra do navegador acompanha o fundo do app.
  function syncThemeColor() {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute('content', bg);
  }
  function applyTheme(t) {
    const root = document.documentElement;
    if (t.mode === 'auto') delete root.dataset.theme; else root.dataset.theme = t.mode;
    if (t.accent === 'verde') delete root.dataset.accent; else root.dataset.accent = t.accent;
    syncThemeColor();
  }
  function saveTheme(t) {
    theme = t;
    applyTheme(t);
    try { localStorage.setItem(THEME_KEY, JSON.stringify(t)); } catch { /* sem armazenamento */ }
  }
  applyTheme(theme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (theme.mode === 'auto') syncThemeColor(); });

  // ---------- Ícones ----------
  // Todos desenhados em grade 24×24, só traço (sem preenchimento), para ficarem iguais entre si.
  // Os emojis que ainda aparecem em textos são trocados por estes ícones automaticamente.

  const ICON_PATHS = {
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    plane: '<path d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M10 13L21 3"/>',
    moto: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l3-6h5l4 6M14 10l-1-3h-3M9 10l3 6"/>',
    car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><path d="M5 12h14"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/>',
    ring: '<circle cx="12" cy="15" r="5"/><path d="M9 6l3-3 3 3-3 3z"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    gift: '<rect x="3" y="9" width="18" height="4"/><path d="M5 13v8h14v-8"/><path d="M12 9v12"/><path d="M12 9c-2 0-4-1-4-3s3-3 4 0c1-3 4-3 4-1s-2 4-4 4"/>',
    piggy: '<path d="M4 12c0-3 3-6 8-6s8 3 8 6-2 5-4 6v2h-3v-1h-2v1H8v-2c-3-1-4-3-4-6z"/><circle cx="16" cy="11" r=".7"/><path d="M10 6V4"/>',
    wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-4v4"/><circle cx="17" cy="14" r="1"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M3 13h18"/>',
    laptop: '<rect x="5" y="5" width="14" height="10" rx="1"/><path d="M2 19h20l-2-4H4z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    gamepad: '<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4"/><circle cx="15.5" cy="12.5" r=".8"/><circle cx="17.5" cy="14.5" r=".8"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 2 4 5"/>',
    paw: '<circle cx="6" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12 11c-3 0-5 3-5 5.5 0 2 2 2.5 3.5 2 1-.4 2.5-.4 3.5 0 1.5.5 3.5 0 3.5-2C17 14 15 11 12 11z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
    leaf: '<path d="M12 21v-8"/><path d="M12 13c-5 0-7-4-7-9 5 0 7 3 7 9z"/><path d="M12 15c4 0 6-3 6-7-4 0-6 2-6 7z"/>',
    umbrella: '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>',
    mountain: '<path d="M3 20l6-11 4 6 3-4 5 9z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    dumbbell: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
    cross: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>',
    tv: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M12 18v3"/>',
    shirt: '<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 0 1-8 0z"/>',
    coffee: '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2M12 3v2"/>',
    utensils: '<path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7M6 6h4"/><path d="M17 21V3c-2 1-3 4-3 7s1 4 3 4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    building: '<path d="M5 21V4h9v17M14 9h5v12M3 21h18"/><path d="M8 8h3M8 12h3M8 16h3"/>',
    rocket: '<path d="M12 3c4 2 6 6 5 11l-3 3h-4l-3-3c-1-5 1-9 5-11z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 18l-3 3M15 18l3 3"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3"/><path d="M12 13v4M8 21h8M10 17h4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3 3 7 3s7-1.3 7-3v-6"/>',
    chart: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h3l2.5 11h9l2-8H7"/>',
    pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    sparkles: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 3v4M17 5h4"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5L20 18M8 16.5L20 6"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 21h18"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    alert: '<path d="M12 3L2 21h20z"/><path d="M12 10v5M12 18v.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    checkcircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    trenddown: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    barchart: '<path d="M5 21V10M12 21V3M19 21v-7"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    pin: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    arrowright: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    arrowup: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowdown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>',
    banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    forward: '<path d="M4 6l8 6-8 6zM12 6l8 6-8 6z"/>',
    handshake: '<path d="M3 12l4-4 4 2 4-2 6 5-5 5-3-2-3 2-3-3z"/>',
  };

  const svgIcon = (id) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[id] || ICON_PATHS.target}</svg>`;

  // Emoji que o app usa nos textos, e o ícone que o substitui.
  const EMOJI_ICON = {
    '🛡': 'shield', '✈': 'plane', '🏍': 'moto', '🚗': 'car', '🏠': 'home', '🎓': 'cap', '💍': 'ring', '📱': 'phone',
    '🎁': 'gift', '🐷': 'piggy', '💼': 'briefcase', '💳': 'card', '💡': 'bulb', '🛒': 'cart', '💊': 'pill', '📚': 'book',
    '📺': 'tv', '🛍': 'bag', '💈': 'scissors', '📦': 'box', '📈': 'chart', '📥': 'inbox', '📄': 'file', '🏦': 'bank',
    '📅': 'calendar', '📆': 'calendar', '🗓': 'calendar', '🔮': 'calendar', '⚠': 'alert', '🚨': 'alert', '👎': 'alert',
    '🔒': 'lock', '💾': 'save', '💬': 'chat', '⏳': 'hourglass', '✅': 'checkcircle', '👍': 'checkcircle', '📉': 'trenddown',
    '🧪': 'flask', '🔍': 'search', '🗒': 'file', '👋': 'sparkles', '⏰': 'clock', '⏱': 'clock', '🎯': 'target',
    '🔄': 'refresh', '⬆': 'arrowup', '⬇': 'arrowdown', '📊': 'barchart', '📋': 'clipboard', '📍': 'pin', '➡': 'arrowright',
    '→': 'arrowright', '🏁': 'flag', '🔥': 'flame', '💵': 'banknote', '💰': 'coins', '💸': 'coins', '⛔': 'ban', '✓': 'check',
    '✕': 'x', '⚙': 'gear', '⏩': 'forward', '🤝': 'handshake', '🎉': 'sparkles', '✨': 'sparkles', '🏆': 'trophy',
    '⭐': 'star', '⚡': 'bolt', '🍔': 'utensils', '💪': 'dumbbell',
  };
  const EMOJI_RE = new RegExp(`(${Object.keys(EMOJI_ICON).join('|')})\\uFE0F?`, 'g');

  // Troca emojis por ícones dentro de um trecho da tela (textos soltos e botões).
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'SVG', 'svg']);
  function iconifyText(node) {
    const text = node.nodeValue;
    if (!text || text.length > 400 || !/[^\x00-\x7F]/.test(text)) return;
    EMOJI_RE.lastIndex = 0;
    if (!EMOJI_RE.test(text)) return;
    EMOJI_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = EMOJI_RE.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const holder = document.createElement('span');
      holder.innerHTML = svgIcon(EMOJI_ICON[m[1]]);
      frag.appendChild(holder.firstChild);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function iconify(root) {
    if (root.nodeType === 3) {
      if (root.parentNode && !SKIP_TAGS.has(root.parentNode.nodeName)) iconifyText(root);
      return;
    }
    if (root.nodeType !== 1 || SKIP_TAGS.has(root.nodeName)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && SKIP_TAGS.has(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(iconifyText);
  }

  // Observa a tela e troca emojis de qualquer conteúdo novo (telas, painéis, avisos).
  const iconObserver = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => { if (n.isConnected) iconify(n); });
    iconObserver.takeRecords();
  });

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

  const GOAL_ICON_LIST = [
    ['shield', 'Reserva'], ['plane', 'Viagem'], ['moto', 'Moto'], ['car', 'Carro'], ['home', 'Casa'], ['cap', 'Estudos'],
    ['ring', 'Casamento'], ['phone', 'Celular'], ['gift', 'Presente'], ['piggy', 'Cofrinho'], ['wallet', 'Carteira'],
    ['briefcase', 'Trabalho'], ['laptop', 'Computador'], ['camera', 'Câmera'], ['gamepad', 'Games'], ['book', 'Livros'],
    ['heart', 'Saúde'], ['users', 'Família'], ['paw', 'Pet'], ['key', 'Imóvel'], ['leaf', 'Sítio'], ['umbrella', 'Férias'],
    ['mountain', 'Aventura'], ['music', 'Música'], ['dumbbell', 'Academia'], ['cross', 'Tratamento'], ['tv', 'TV'],
    ['shirt', 'Roupas'], ['coffee', 'Café'], ['utensils', 'Restaurante'], ['globe', 'Intercâmbio'], ['building', 'Negócio'],
    ['rocket', 'Projeto'], ['star', 'Sonho'], ['trophy', 'Conquista'], ['target', 'Objetivo'], ['coins', 'Investir'],
    ['chart', 'Crescer'], ['bolt', 'Energia'], ['cart', 'Compras'],
  ];
  const GOAL_ICONS = GOAL_ICON_LIST.map((i) => i[0]);
  // Metas antigas guardavam um emoji: converte para o ícone equivalente.
  const toGoalIcon = (v) => {
    if (GOAL_ICONS.includes(v)) return v;
    const id = EMOJI_ICON[String(v || '').replace(/\uFE0F/g, '')];
    return GOAL_ICONS.includes(id) ? id : GOAL_ICONS[0];
  };
  const goalIconHTML = (v) => svgIcon(toGoalIcon(v));

  const DEBT_TYPES = [
    { icon: '🏦', name: 'Empréstimo' },
    { icon: '🚗', name: 'Financiamento' },
    { icon: '💳', name: 'Cartão parcelado' },
    { icon: '🏠', name: 'Casa / imóvel' },
    { icon: '📄', name: 'Outro' },
  ];
  const HELP_TABS = ['transactions', 'debts', 'budget', 'goals'];

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
  const DATE_FMT = {
    long: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }),
    monthOnly: new Intl.DateTimeFormat('pt-BR', { month: 'long' }),
    short: new Intl.DateTimeFormat('pt-BR', { month: 'short' }),
    shortYear: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }),
    day: new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }),
  };
  const nameCache = new Map();
  const memo = (key, make) => {
    let v = nameCache.get(key);
    if (v === undefined) {
      v = make();
      if (nameCache.size > 600) nameCache.clear();
      nameCache.set(key, v);
    }
    return v;
  };
  const fmtKey = (opts) => {
    if (!opts) return 'long';
    if (opts.weekday) return 'day';
    if (opts.year) return opts.month === 'short' ? 'shortYear' : 'long';
    return opts.month === 'short' ? 'short' : 'monthOnly';
  };
  const monthName = (ym, opts) => {
    const k = fmtKey(opts);
    return memo(`m${k}${ym}`, () => cap(DATE_FMT[k].format(parseISO(`${ym}-01`))));
  };
  const monthShort = (ym) => monthName(ym, { month: 'short' }).replace('.', '');
  const dayLabel = (iso) => {
    const today = todayISO();
    if (iso === today) return 'Hoje';
    const y = new Date();
    y.setDate(y.getDate() - 1);
    if (iso === `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`) return 'Ontem';
    return memo(`d${iso}`, () => cap(DATE_FMT.day.format(parseISO(iso))));
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
  const defaultSettings = () => ({
    hideValues: false, lockAfter: 60, lastBackupAt: 0, helpSeen: {}, debtExtra: 0, debtStrategy: '', backupDaily: true, backupSnooze: '', goalRate: 10,
  });
  const defaultState = () => ({
    version: 5, transactions: [], budgets: {}, goals: [], debts: [], cards: [], salary: null, demo: false, settings: defaultSettings(),
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
      helpSeen: Object.fromEntries(HELP_TABS.filter((t) => rs.helpSeen && rs.helpSeen[t] === true).map((t) => [t, true])),
      debtExtra: Number.isInteger(rs.debtExtra) && rs.debtExtra >= 0 && rs.debtExtra <= MAX_CENTS ? rs.debtExtra : 0,
      debtStrategy: ['fast', 'interest'].includes(rs.debtStrategy) ? rs.debtStrategy : '',
      goalRate: Number.isFinite(rs.goalRate) && rs.goalRate >= 0 && rs.goalRate <= 30 ? Math.round(rs.goalRate * 100) / 100 : 10,
      backupDaily: rs.backupDaily !== false,
      backupSnooze: isISO(rs.backupSnooze) ? rs.backupSnooze : '',
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
        if (typeof t.salaryKey === 'string') tx.salaryKey = t.salaryKey.slice(0, 20);
        if (t.bill) tx.bill = true;
        if (isISO(t.paidAt)) tx.paidAt = t.paidAt;
        if (t.type === 'expense' && typeof t.cardId === 'string' && isISO(t.buyDate)) {
          tx.cardId = t.cardId;
          tx.buyDate = t.buyDate;
          tx.cardOffset = Number.isInteger(t.cardOffset) && t.cardOffset >= 0 && t.cardOffset <= 600 ? t.cardOffset : 0;
        }
        if (t.debtId && Number.isInteger(t.debtNo)) {
          tx.debtId = String(t.debtId);
          tx.debtNo = t.debtNo;
        }
        return tx;
      });
    // Dados de antes das contas a pagar: o que já venceu conta como pago.
    if (!(raw.version >= 5)) {
      const today = todayISO();
      for (const t of s.transactions) {
        if (t.type === 'expense' && (t.recurring || t.installment) && t.date < today && !t.paidAt) t.paidAt = t.date;
      }
    }
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
        icon: toGoalIcon(g.icon),
        target: g.target,
        saved: Number.isInteger(g.saved) && g.saved > 0 ? Math.min(g.saved, MAX_CENTS) : 0,
        deadline: typeof g.deadline === 'string' && /^\d{4}-\d{2}$/.test(g.deadline) ? g.deadline : '',
        createdAt: Number(g.createdAt) || Date.now(),
      }));
    const rsal = raw.salary;
    if (rsal && Array.isArray(rsal.paydays)) {
      const paydays = rsal.paydays
        .filter((p) => p && Number.isInteger(p.day) && p.day >= 1 && p.day <= 31
          && Number.isInteger(p.amount) && p.amount >= 0 && p.amount <= MAX_CENTS)
        .slice(0, 2)
        .map((p) => ({ day: p.day, amount: p.amount }));
      const ym = (v) => (typeof v === 'string' && /^\d{4}-\d{2}$/.test(v) ? v : '');
      if (paydays.length) {
        s.salary = {
          paydays, weekendBefore: rsal.weekendBefore !== false,
          generatedUntil: ym(rsal.generatedUntil), startYM: ym(rsal.startYM) || currentMonth(),
        };
      }
    }
    const day = (v) => (Number.isInteger(v) && v >= 1 && v <= 31 ? v : null);
    s.cards = (Array.isArray(raw.cards) ? raw.cards : [])
      .filter((c) => c && typeof c.name === 'string' && day(c.closingDay) && day(c.dueDay))
      .slice(0, 20)
      .map((c) => ({
        id: String(c.id || uid()),
        name: c.name.slice(0, 30),
        closingDay: c.closingDay,
        dueDay: c.dueDay,
        limit: Number.isInteger(c.limit) && c.limit > 0 && c.limit <= MAX_CENTS ? c.limit : 0,
        paid: (Array.isArray(c.paid) ? c.paid : []).filter(isISO).slice(-240),
        createdAt: Number(c.createdAt) || Date.now(),
      }));
    // Compras de cartão que não existe mais viram gasto comum.
    for (const t of s.transactions) {
      if (t.cardId && !s.cards.some((c) => c.id === t.cardId)) {
        delete t.cardId;
        delete t.buyDate;
        delete t.cardOffset;
      }
    }
    s.debts = (Array.isArray(raw.debts) ? raw.debts : [])
      .filter((d) => d && typeof d.name === 'string' && isPosInt(d.amount) && Number.isInteger(d.total)
        && d.total >= 1 && d.total <= 600 && (isISO(d.nextDue) || d.overdue === true))
      .map((d) => {
        const overdue = d.overdue === true;
        const nextDue = isISO(d.nextDue) ? d.nextDue : todayISO();
        const paid = Number.isInteger(d.paid) ? Math.min(Math.max(d.paid, 0), d.total) : 0;
        const debt = {
          overdue,
          id: String(d.id || uid()),
          name: d.name.slice(0, 40),
          icon: DEBT_TYPES.some((t) => t.icon === d.icon) ? d.icon : DEBT_TYPES[0].icon,
          amount: d.amount,
          total: d.total,
          paid,
          advanced: Number.isInteger(d.advanced) && d.advanced > 0 ? Math.min(d.advanced, d.total - paid) : 0,
          rate: Number.isFinite(d.rate) && d.rate > 0 && d.rate <= 30 ? Math.round(d.rate * 100) / 100 : null,
          dueDay: Number.isInteger(d.dueDay) && d.dueDay >= 1 && d.dueDay <= 31 ? d.dueDay : Number(nextDue.slice(8, 10)),
          nextDue,
          linked: overdue ? false : d.linked !== false,
          offers: (Array.isArray(d.offers) ? d.offers : [])
            .filter((o) => o && isPosInt(o.value) && isPosInt(o.remaining) && isISO(o.date))
            .slice(-20)
            .map((o) => ({
              id: String(o.id || uid()), value: o.value, remaining: o.remaining, date: o.date,
              until: isISO(o.until) ? o.until : '', note: String(o.note || '').slice(0, 40),
            })),
          createdAt: Number(d.createdAt) || Date.now(),
        };
        if (d.settled && isPosInt(d.settled.value) && isISO(d.settled.date)) {
          debt.settled = { value: d.settled.value, saved: Number.isInteger(d.settled.saved) ? d.settled.saved : 0, date: d.settled.date };
        }
        return debt;
      });
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

  // ---------- Dívidas ----------
  // Cada dívida guarda quantas parcelas já foram pagas e o próximo vencimento.
  // Quando o vencimento passa, o app conta a parcela como paga sozinho.

  const dueIn = (ym, day) => `${ym}-${pad(Math.min(day, daysInMonth(ym)))}`;
  const daysUntil = (iso) => Math.round((parseISO(iso) - parseISO(todayISO())) / 864e5);
  const shortDate = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const monthYear = (ym) => monthName(ym, { month: 'short', year: 'numeric' }).replace('.', '');

  // Parcelas que faltam: total menos as pagas e as antecipadas.
  const leftOf = (d) => d.total - d.paid - (d.advanced || 0);

  function debtInfo(d) {
    const left = leftOf(d);
    const nextYM = monthOf(d.nextDue);
    const lastYM = left > 0 ? shiftMonth(nextYM, left - 1) : null;
    const firstYM = shiftMonth(nextYM, -d.paid);
    // Dívida em atraso: valor único, sem parcelas, vencimento ou extrato.
    if (d.overdue) {
      return {
        left, done: left <= 0, current: 1, leftAmount: left > 0 ? d.amount : 0, paidAmount: left > 0 ? 0 : d.amount,
        totalAmount: d.amount, lastYM: null, days: 9999, inMonth: () => false,
      };
    }
    return {
      left,
      done: left <= 0,
      current: Math.min(d.paid + 1, d.total),
      leftAmount: left * d.amount,
      paidAmount: (d.total - left) * d.amount,
      totalAmount: d.total * d.amount,
      lastYM,
      days: daysUntil(d.nextDue),
      // Tem parcela vencendo no mês informado?
      inMonth: (ym) => ym >= firstYM && lastYM !== null && ym <= lastYM,
    };
  }

  const dueText = (days, iso) =>
    days === 0 ? 'vence hoje' : days === 1 ? 'vence amanhã' : days < 0 ? `venceu em ${shortDate(iso)}` : `vence em ${days} dias (${shortDate(iso)})`;

  // Coloca as parcelas que faltam no extrato de cada mês (e remove as que não valem mais).
  function syncDebtTx(d) {
    state.transactions = state.transactions.filter((t) => !(t.debtId === d.id && t.debtNo > d.paid));
    if (!d.linked || d.overdue) return;
    let ym = monthOf(d.nextDue);
    for (let k = d.paid + 1; k <= d.total - (d.advanced || 0); k++) {
      state.transactions.push({
        id: uid(), type: 'expense', category: 'dividas', amount: d.amount, description: d.name,
        date: dueIn(ym, d.dueDay), installment: `${k}/${d.total}`, debtId: d.id, debtNo: k, createdAt: Date.now() + k,
      });
      ym = shiftMonth(ym, 1);
    }
  }

  // Conta como pagas as parcelas cujo vencimento já passou.
  function advanceDebts() {
    const today = todayISO();
    let changed = false;
    for (const d of state.debts) {
      while (!d.overdue && leftOf(d) > 0 && d.nextDue < today) {
        d.paid += 1;
        d.nextDue = dueIn(shiftMonth(monthOf(d.nextDue), 1), d.dueDay);
        changed = true;
      }
    }
    if (changed) save();
  }

  // ---------- Salário ----------
  // Dias e valores fixos de pagamento. O app lança o salário sozinho nos próximos 12 meses
  // e calcula quanto dá para gastar por dia até o próximo pagamento.

  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Data do pagamento no mês; se cair no fim de semana e a opção estiver ligada, vai para a sexta.
  function payDate(ym, day, weekendBefore) {
    const iso = dueIn(ym, day);
    if (!weekendBefore) return iso;
    const d = parseISO(iso);
    const wd = d.getDay();
    if (wd === 6) d.setDate(d.getDate() - 1);
    if (wd === 0) d.setDate(d.getDate() - 2);
    return isoOf(d);
  }

  // Pagamentos do mês anterior, do atual e do próximo, em ordem de data.
  function payDatesNear() {
    const sal = state.salary;
    if (!sal) return [];
    const cur = currentMonth();
    const list = [];
    for (const ym of [shiftMonth(cur, -1), cur, shiftMonth(cur, 1), shiftMonth(cur, 2)]) {
      sal.paydays.forEach((p, i) => list.push({ ym, i, day: p.day, amount: p.amount, date: payDate(ym, p.day, sal.weekendBefore) }));
    }
    return list.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function salaryTx(ym, i) {
    const p = state.salary.paydays[i];
    return {
      id: uid(), type: 'income', category: 'salario', amount: p.amount,
      description: state.salary.paydays.length > 1 ? `Salário (dia ${p.day})` : 'Salário',
      date: payDate(ym, p.day, state.salary.weekendBefore), salaryKey: `${ym}#${i}`, createdAt: Date.now() + i,
    };
  }

  function addSalaryMonth(ym, skipBefore) {
    state.salary.paydays.forEach((p, i) => {
      if (!p.amount) return;
      const key = `${ym}#${i}`;
      if (state.transactions.some((t) => t.salaryKey === key)) return;
      const tx = salaryTx(ym, i);
      if (skipBefore && tx.date < skipBefore) return;
      state.transactions.push(tx);
    });
  }

  // Refaz os salários de hoje em diante (usado ao salvar a configuração).
  function rebuildSalary(includePastThisMonth) {
    const today = todayISO();
    const cur = currentMonth();
    state.transactions = state.transactions.filter((t) => !(t.salaryKey && t.date >= today));
    if (!state.salary) return;
    for (let k = 0; k < 12; k++) {
      const ym = shiftMonth(cur, k);
      addSalaryMonth(ym, k === 0 && includePastThisMonth ? null : today);
    }
    state.salary.generatedUntil = shiftMonth(cur, 11);
  }

  // Mantém sempre 12 meses de salário lançados à frente.
  function ensureSalary() {
    const sal = state.salary;
    if (!sal || !sal.generatedUntil) return;
    const target = shiftMonth(currentMonth(), 11);
    let ym = sal.generatedUntil;
    if (ym >= target) return;
    while (ym < target) {
      ym = shiftMonth(ym, 1);
      addSalaryMonth(ym, null);
    }
    sal.generatedUntil = target;
    save();
  }

  // Quanto dá para gastar até o próximo pagamento: o que já entrou desde o mês do último
  // pagamento, menos tudo o que sai antes do próximo (inclusive contas e parcelas futuras).
  function salaryAllowance() {
    const today = todayISO();
    const dates = payDatesNear();
    const next = dates.find((p) => p.date > today);
    if (!next) return null;
    const last = dates.filter((p) => p.date <= today).pop();
    const start = `${last ? monthOf(last.date) : currentMonth()}-01`;
    let inc = 0;
    let exp = 0;
    for (const t of state.transactions) {
      if (t.date < start) continue;
      if (t.type === 'income' && t.date <= today) inc += t.amount;
      else if (t.type === 'expense' && t.date < next.date) exp += t.amount;
    }
    const after = dates.find((p) => p.date > next.date);
    return { next, after, days: daysUntil(next.date), inc, exp, available: inc - exp };
  }

  // Ainda não recebeu nada: mostra como vai ficar a quinzena quando o próximo salário cair.
  function salaryPlan(allow) {
    const { next, after } = allow;
    if (!after) return null;
    const today = todayISO();
    let exp = 0;
    let before = 0;
    for (const t of state.transactions) {
      if (t.type !== 'expense') continue;
      if (t.date >= next.date && t.date < after.date) exp += t.amount;
      // Antes do salário: só o que ainda vai sair (data futura ou conta em aberto).
      else if (t.date < next.date && (t.date > today || (isBill(t) && !billPaid(t)))) before += t.amount;
    }
    const days = Math.max(1, daysUntil(after.date) - daysUntil(next.date));
    const left = next.amount - before - exp;
    return { exp, before, days, left, after };
  }

  const salaryLabel = () => (state.salary ? `dia${state.salary.paydays.length > 1 ? 's' : ''} ${state.salary.paydays.map((p) => p.day).join(' e ')}` : '');

  // ---------- Cartões de crédito ----------
  // A compra no cartão fica gravada na data de vencimento da fatura (quando o dinheiro sai de verdade),
  // com a data da compra em buyDate. Compra no dia do fechamento ou depois vai para a fatura seguinte.

  const cardById = (id) => state.cards.find((c) => c.id === id);

  function invoiceDue(card, buyISO, offset = 0) {
    let closeYM = monthOf(buyISO);
    if (Number(buyISO.slice(8, 10)) >= Math.min(card.closingDay, daysInMonth(closeYM))) closeYM = shiftMonth(closeYM, 1);
    closeYM = shiftMonth(closeYM, offset);
    return dueIn(card.dueDay > card.closingDay ? closeYM : shiftMonth(closeYM, 1), card.dueDay);
  }

  function closingOf(card, dueISO) {
    const dueYM = monthOf(dueISO);
    return dueIn(card.dueDay > card.closingDay ? dueYM : shiftMonth(dueYM, -1), card.closingDay);
  }

  function invoicesOf(card) {
    const map = new Map();
    for (const t of state.transactions) {
      if (t.cardId !== card.id) continue;
      if (!map.has(t.date)) map.set(t.date, { due: t.date, close: closingOf(card, t.date), total: 0, items: [], paid: card.paid.includes(t.date) });
      const inv = map.get(t.date);
      inv.total += t.amount;
      inv.items.push(t);
    }
    return [...map.values()].sort((a, b) => (a.due < b.due ? -1 : 1));
  }

  // Limite em uso: tudo o que está em faturas ainda não pagas (inclusive parcelas futuras).
  const cardUsed = (card) => sum(invoicesOf(card).filter((i) => !i.paid).map((i) => i.total));

  // Fatura para mostrar agora: a mais antiga em aberto; se não houver, a que está aberta para compras.
  function currentInvoice(card) {
    const open = invoicesOf(card).find((i) => !i.paid && i.total > 0);
    if (open) return open;
    const due = invoiceDue(card, todayISO());
    return invoicesOf(card).find((i) => i.due === due) || { due, close: closingOf(card, due), total: 0, items: [], paid: false };
  }

  function invoiceStatus(card, inv) {
    const today = todayISO();
    if (inv.paid) return { cls: 'good', text: '✓ Paga' };
    if (inv.close > today) return { cls: '', text: `Aberta · fecha ${shortDate(inv.close)}` };
    if (inv.due >= today) return { cls: 'warning', text: `Fechada · vence ${shortDate(inv.due)}` };
    return { cls: 'critical', text: `Atrasada desde ${shortDate(inv.due)}` };
  }

  // Ao mudar os dias do cartão, refaz as datas das faturas ainda não pagas.
  function recomputeCardTx(card) {
    for (const t of state.transactions) {
      if (t.cardId === card.id && !card.paid.includes(t.date)) t.date = invoiceDue(card, t.buyDate, t.cardOffset || 0);
    }
  }

  // ---------- Contas a pagar ----------
  // Conta = gasto que ainda vai sair: fixa mensal, parcela, parcela de dívida ou marcada como "ainda não paguei".

  const isBill = (t) => t.type === 'expense' && !t.cardId && !!(t.bill || t.recurring || t.installment || t.debtId);

  function billPaid(t) {
    if (t.paidAt) return true;
    if (t.debtId) {
      const d = state.debts.find((x) => x.id === t.debtId);
      return !d || t.debtNo <= d.paid || t.debtNo > d.total - (d.advanced || 0);
    }
    return false;
  }

  // Contas em aberto até a data informada (as atrasadas sempre entram).
  function pendingBills(until) {
    const items = [];
    for (const t of state.transactions) {
      if (t.date <= until && isBill(t) && !billPaid(t)) {
        const c = catById('expense', t.category);
        items.push({ key: t.id, kind: 'tx', t, date: t.date, amount: t.amount, name: t.description || c.name, icon: c.icon });
      }
    }
    for (const c of state.cards) {
      for (const inv of invoicesOf(c)) {
        if (!inv.paid && inv.total > 0 && inv.due <= until) {
          items.push({ key: `${c.id}|${inv.due}`, kind: 'invoice', date: inv.due, amount: inv.total, name: `Fatura ${c.name}`, icon: '💳' });
        }
      }
    }
    return items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : b.amount - a.amount));
  }

  function billWhen(date) {
    const days = daysUntil(date);
    if (days < 0) return { cls: 'critical', text: `Atrasada desde ${shortDate(date)}` };
    if (days === 0) return { cls: 'critical', text: 'Vence hoje' };
    if (days === 1) return { cls: 'warning', text: 'Vence amanhã' };
    if (days <= 3) return { cls: 'warning', text: `Em ${days} dias · ${shortDate(date)}` };
    return { cls: '', text: `${shortDate(date)} · em ${days} dias` };
  }

  function billRow(b) {
    const w = billWhen(b.date);
    return `<li class="bill ${w.cls}">
      <span class="tx-icon" aria-hidden="true">${b.icon}</span>
      <span class="tx-main"><span class="tx-desc">${esc(b.name)}</span>
        <span class="bill-when ${w.cls}">${esc(w.text)}${b.t && b.t.installment ? ` · parcela ${esc(b.t.installment)}` : ''}</span></span>
      <span class="bill-side"><strong class="num">${money(b.amount)}</strong>
        <button class="btn bill-pay" type="button" data-action="pay-bill" data-kind="${b.kind}" data-key="${esc(b.key)}">✓ Paguei</button></span>
    </li>`;
  }

  // Até quando mostrar na tela inicial: o próximo salário, ou os próximos 15 dias.
  function billsHorizon() {
    const allow = state.salary ? salaryAllowance() : null;
    if (allow) return { until: isoOf(new Date(parseISO(allow.next.date).getTime() - 864e5)), label: `até o salário do dia ${allow.next.day}` };
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return { until: isoOf(d), label: 'nos próximos 15 dias' };
  }

  const BILLS_HOME_MAX = 5;
  const BILLS_SHEET_MAX = 40;

  function billsCard() {
    if (ui.month !== currentMonth()) return '';
    const hasBills = state.transactions.some((t) => (isBill(t) || t.cardId) && t.date >= todayISO()) || pendingBills(todayISO()).length;
    if (!hasBills) return '';
    const h = billsHorizon();
    const items = pendingBills(h.until);
    const late = items.filter((b) => b.date < todayISO());
    const total = sum(items.map((b) => b.amount));
    return `<section class="card bills">
      <div class="card-head"><div><h2 class="card-title">📅 Contas a pagar</h2>
        <p class="card-sub">${esc(h.label)}${items.length ? ` · total <strong class="num">${money(total)}</strong>` : ''}</p></div>
        ${late.length ? `<span class="badge critical">⚠ ${late.length} ${late.length === 1 ? 'atrasada' : 'atrasadas'}</span>` : ''}</div>
      ${items.length ? `<ul class="bill-list">${items.slice(0, BILLS_HOME_MAX).map(billRow).join('')}</ul>
        ${items.length > BILLS_HOME_MAX ? `<button class="bills-more" type="button" data-action="all-bills">+ ${items.length - BILLS_HOME_MAX} ${items.length - BILLS_HOME_MAX === 1 ? 'outra conta' : 'outras contas'} · ver todas</button>` : ''}`
        : `<p class="bills-empty">🎉 Nenhuma conta em aberto ${esc(h.label)}.</p>`}
      <div class="bills-actions">
        <button class="link-btn" type="button" data-action="all-bills">Ver próximas contas</button>
        <button class="link-btn" type="button" data-action="bills-calendar">📅 Lembretes no calendário</button>
      </div>
    </section>`;
  }

  function openBillsSheet() {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    const all = pendingBills(isoOf(d));
    const items = all.slice(0, BILLS_SHEET_MAX);
    const groups = [];
    for (const b of items) {
      const label = b.date < todayISO() ? 'Atrasadas' : monthName(monthOf(b.date));
      if (!groups.length || groups[groups.length - 1].label !== label) groups.push({ label, items: [] });
      groups[groups.length - 1].items.push(b);
    }
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">📅 Próximas contas</h2>
      <p class="hint">Contas em aberto nos próximos 60 dias. Toque em “✓ Paguei” quando pagar.${all.length > items.length ? ` Mostrando as ${items.length} primeiras de ${all.length}.` : ''}</p>
      ${groups.length ? groups.map((g) => `<h3 class="tx-day"><span>${esc(g.label)}</span>
        <span class="num">${money(sum(g.items.map((b) => b.amount)))}</span></h3><ul class="bill-list">${g.items.map(billRow).join('')}</ul>`).join('')
        : '<p class="bills-empty">🎉 Nenhuma conta em aberto nos próximos 60 dias.</p>'}
      <div class="actions" style="margin-top:14px">
        <button class="btn primary block" type="button" id="calBtn">📅 Pôr lembretes no calendário do celular</button>
        <p class="hint">Cada conta vira um lembrete no calendário, com alarme às 9h do dia anterior ao vencimento.</p>
      </div>`);
    $('#calBtn', root).addEventListener('click', exportBillsCalendar);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-action="pay-bill"]');
      if (!b) return;
      payBill(b.dataset.kind, b.dataset.key);
      b.closest('li').remove();
    });
  }

  function payBill(kind, key) {
    if (kind === 'invoice') {
      const [cardId, due] = key.split('|');
      const card = cardById(cardId);
      if (card) payInvoice(card, due);
      return;
    }
    if (kind === 'tx') {
      const t = state.transactions.find((x) => x.id === key);
      if (!t) return;
      if (t.debtId) {
        const d = state.debts.find((x) => x.id === t.debtId);
        if (d && t.debtNo === d.paid + 1) payDebt(d);
        else if (d) toast(`Pague primeiro a parcela ${d.paid + 1} de ${d.name}.`);
        return;
      }
      t.paidAt = todayISO();
      save();
      render();
      toast(`${t.description || 'Conta'} paga ✓`, {
        label: 'Desfazer',
        run: () => {
          delete t.paidAt;
          save();
          render();
        },
      });
    }
  }

  // Lembretes no calendário (.ics) para as contas dos próximos 60 dias.
  function billsICS() {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    const today = todayISO();
    const items = pendingBills(isoOf(d)).filter((b) => b.date >= today);
    const icsEsc = (s) => String(s).replace(/[\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Meu Bolso//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Contas - Meu Bolso'];
    for (const b of items) {
      const next = new Date(parseISO(b.date).getTime() + 864e5);
      const title = `💸 Pagar ${b.name}: ${fmtMoney(b.amount)}`;
      lines.push('BEGIN:VEVENT', `UID:${b.key}-${b.date}@meubolso`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${b.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${isoOf(next).replace(/-/g, '')}`,
        `SUMMARY:${icsEsc(title)}`, `DESCRIPTION:${icsEsc('Lembrete do app Meu Bolso. Depois de pagar, marque como paga no app.')}`,
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(title)}`, 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return { text: lines.join('\r\n'), count: items.length };
  }

  async function exportBillsCalendar() {
    const { text, count } = billsICS();
    if (!count) {
      toast('Nenhuma conta futura para pôr no calendário.');
      return;
    }
    // No iPhone, abrir o arquivo do calendário mostra “Adicionar todos” direto no app Calendário.
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(text)}`;
      return;
    }
    if (await deliverFile(`contas-meu-bolso-${todayISO()}.ics`, text, 'text/calendar')) {
      toast(`${count} ${count === 1 ? 'lembrete criado' : 'lembretes criados'}. Abra o arquivo para pôr no calendário.`);
    }
  }

  // ---------- Telas ----------

  const EYE = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
  const EYE_OFF = '<path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';

  const fixedTitleFor = () => ({ goals: 'Minhas metas', debts: 'Minhas dívidas' }[ui.tab]);

  // Realce da aba imediato (resposta ao toque); o conteúdo vem no quadro seguinte.
  let renderQueued = 0;
  function goTab(tab) {
    ui.tab = tab;
    $$('.tabbar button').forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    renderSoon();
    window.scrollTo(0, 0);
  }
  function renderSoon() {
    if (renderQueued) return;
    renderQueued = requestAnimationFrame(() => {
      renderQueued = 0;
      render();
    });
  }

  function render() {
    ui.hide = !!state.settings.hideValues;
    const privacy = $('#privacyBtn');
    privacy.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ui.hide ? EYE_OFF : EYE}</svg>`;
    privacy.setAttribute('aria-pressed', String(ui.hide));
    privacy.setAttribute('aria-label', ui.hide ? 'Mostrar valores' : 'Esconder valores');
    const fab = { debts: ['Nova dívida', 'Cadastrar dívida'], goals: ['Nova meta', 'Criar meta'] }[ui.tab] || ['Adicionar', 'Adicionar gasto ou ganho'];
    $('#fab span').textContent = fab[0];
    $('#fab').setAttribute('aria-label', fab[1]);
    const fixedTitle = fixedTitleFor();
    $('#monthLabel').textContent = fixedTitle || monthName(ui.month);
    $('#monthLabel').disabled = !!fixedTitle;
    $('#prevMonth').hidden = !!fixedTitle;
    $('#nextMonth').hidden = !!fixedTitle;
    $$('.tabbar button').forEach((b) => {
      const active = b.dataset.tab === ui.tab;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    const views = { home: viewHome, transactions: viewTransactions, debts: viewDebts, budget: viewBudget, goals: viewGoals };
    const view = $('#view');
    view.innerHTML = views[ui.tab]();
    if (ui.tab === 'transactions') renderTxList();
    if (ui.tab === 'debts') bindPlan();
    // Ao trocar de aba, os cartões entram em sequência.
    // As animações começam sozinhas nos elementos novos: não precisa forçar layout.
    const motion = ui.motion;
    ui.motion = '';
    if (motion || ui.lastTab !== ui.tab) {
      ui.lastTab = ui.tab;
      view.classList.remove('enter', 'slide-next', 'slide-prev');
      view.classList.add(motion || 'enter');
      clearTimeout(ui.enterTimer);
      ui.enterTimer = setTimeout(() => view.classList.remove('enter', 'slide-next', 'slide-prev'), 450);
    }
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
    if (!state.transactions.length && !state.goals.length && !state.debts.length && !state.salary && !state.cards.length) return welcome();
    const list = txOfMonth(ui.month);
    const { inc, exp, bal } = totals(list);
    return [
      demoBanner(),
      backupReminder(),
      `<section class="card hero" aria-label="Resumo do mês">
        <p class="eyebrow">Saldo do mês</p>
        <div class="hero-value num">${money(bal)}</div>
        <div class="hero-split">
          <div><span>⬆ Entrou</span><strong class="num">${money(inc)}</strong></div>
          <div><span>⬇ Saiu</span><strong class="num">${money(exp)}</strong></div>
        </div>
      </section>`,
      dailyTip(inc, exp, bal),
      billsCard(),
      cardsCard(),
      debtsHomeCard(),
      alertsCard(list),
      categoryChart(list, exp),
      trendChart(),
      recentCard(list),
    ].join('');
  }

  // Quando foi o último backup, em palavras.
  function lastBackupText() {
    const last = state.settings.lastBackupAt;
    if (!last) return 'nenhum ainda';
    const d = new Date(last);
    const days = daysUntil(todayISO()) - daysUntil(isoOf(d));
    const hour = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (days === 0) return `hoje às ${hour} ✓`;
    if (days === 1) return `ontem às ${hour}`;
    return `há ${days} dias (${d.toLocaleDateString('pt-BR')})`;
  }

  // Lembrete diário: aparece na primeira abertura do dia até o backup ser feito (ou "Hoje não").
  function backupReminder() {
    const st = state.settings;
    const hasData = state.transactions.length || state.debts.length || state.goals.length || state.cards.length;
    if (state.demo || !hasData) return '';
    const today = todayISO();
    const last = st.lastBackupAt ? isoOf(new Date(st.lastBackupAt)) : '';
    const days = last ? daysUntil(today) - daysUntil(last) : null;
    if (last === today) return '';
    // Com o lembrete diário desligado, ainda avisa depois de 30 dias sem backup.
    if (!st.backupDaily && days !== null && days < 30) return '';
    if (st.backupSnooze === today) return '';
    const first = !st.lastBackupAt;
    return `<section class="card backup-card">
      <div class="backup-head"><div class="tip-icon" aria-hidden="true">💾</div><div>
        <strong>${first ? 'Faça seu primeiro backup' : 'Backup de hoje'}</strong>
        <span>Último backup: ${esc(lastBackupText())}</span></div></div>
      ${first ? `<ol class="install-steps">
        <li>Toque em <strong>Salvar backup</strong>.</li>
        <li>Escolha <strong>Salvar em Arquivos</strong>.</li>
        <li>Abra o <strong>iCloud Drive</strong>, crie a pasta <strong>Meu Bolso</strong> e toque em <strong>Salvar</strong>.</li>
      </ol>
      <p class="hint">Nas próximas vezes, o iPhone já sugere a mesma pasta, e o iCloud guarda tudo na nuvem sozinho.</p>`
        : '<p class="hint">2 toques: Salvar backup → Salvar em Arquivos. Se o celular quebrar ou for trocado, é ele que salva seus dados.</p>'}
      <div class="backup-actions">
        <button class="btn" type="button" data-action="backup-snooze">Hoje não</button>
        <button class="btn primary" type="button" data-action="backup-now">💾 Salvar backup</button>
      </div>
    </section>`;
  }

  function welcome() {
    return `<section class="card empty">
      <div class="empty-icon" aria-hidden="true">👋</div>
      <h2>Bem-vindo ao Meu Bolso</h2>
      <p>Comece pelo seu salário. Depois registre cada gasto e o app mostra quanto você ainda pode gastar por dia até o próximo pagamento.</p>
      <div class="actions">
        <button class="btn primary block" type="button" data-action="setup-code">📥 Colar código do assistente</button>
        <button class="btn block" type="button" data-action="salary">💼 Configurar meu salário</button>
        <button class="btn block" type="button" data-action="new-debt">Cadastrar uma dívida</button>
        <button class="btn block" type="button" data-action="load-demo">Ver com dados de exemplo</button>
      </div>
    </section>
    <section class="card">
      <h2 class="card-title">Como se regrar em 4 passos</h2>
      <ol class="install-steps" style="margin-top:10px">
        <li><strong>Configure seu salário</strong> (dias e valores) e lance as contas fixas, como aluguel e internet, marcando “Todo mês”.</li>
        <li><strong>Cadastre suas dívidas</strong> na aba Dívidas. O app conta sozinho quantas parcelas faltam.</li>
        <li><strong>Defina limites</strong> para as categorias que mais pesam, na aba Limites.</li>
        <li><strong>Registre todo gasto na hora.</strong> Leva 5 segundos e evita surpresa no fim do mês.</li>
      </ol>
    </section>`;
  }

  function dailyTip(inc, exp, bal) {
    const cur = currentMonth();
    let icon = '💡';
    let body;
    const allow = ui.month === cur && state.salary ? salaryAllowance() : null;
    if (allow) {
      const when = allow.days === 1 ? 'amanhã' : `daqui a ${allow.days} dias, em ${shortDate(allow.next.date)}`;
      const plan = allow.inc === 0 ? salaryPlan(allow) : null;
      if (allow.inc === 0 && (!allow.next.amount || !plan)) {
        icon = '⏳';
        body = `<p>Seu próximo salário (dia ${allow.next.day}) cai ${when}.
          Coloque o valor em <strong>Meu salário</strong> para eu planejar a quinzena.</p>
          <button class="link-btn" type="button" data-action="salary">Colocar o valor</button>`;
      } else if (allow.inc === 0) {
        icon = '🗓️';
        const before = plan.before ? `<p class="tip-small">⚠ Antes do salário ainda vencem <strong class="num">${money(plan.before)}</strong> em contas. Já estão descontadas na conta acima.</p>` : '';
        body = plan.left > 0
          ? `<p>Seu salário do dia ${allow.next.day} cai ${when} (<strong class="num">${money(allow.next.amount)}</strong>).
            Depois das contas até o dia ${plan.after.day}, vão sobrar <strong class="num">${money(plan.left)}</strong>:</p>
            <span class="tip-big num">${money(Math.floor(plan.left / plan.days))} por dia</span>
            <p class="tip-small">É quanto você vai poder gastar por dia nessa quinzena (${plan.days} dias).</p>${before}`
          : `<p>Seu salário do dia ${allow.next.day} cai ${when} (<strong class="num">${money(allow.next.amount)}</strong>).
            <strong>As contas até o dia ${plan.after.day} somam ${money(plan.before + plan.exp)}</strong>, ou seja, faltam
            <strong class="num">${money(-plan.left)}</strong>. Veja o que dá para adiar ou cortar.</p>`;
      } else if (allow.available > 0) {
        icon = '📅';
        body = `<p>Você pode gastar até <span class="tip-big num">${money(Math.floor(allow.available / allow.days))} por dia</span>
          até o salário do dia ${allow.next.day} (${when}).</p>
          <p class="tip-small">Disponível agora: <strong class="num">${money(allow.available)}</strong>, já descontando as contas e parcelas que vencem antes.</p>`;
      } else {
        icon = '🚨';
        body = `<p><strong>Até o salário do dia ${allow.next.day} faltam ${money(-allow.available)}</strong> para cobrir as contas que vencem antes dele.
          Evite gastos novos até lá.</p>`;
      }
    } else if (ui.month === cur) {
      const left = daysInMonth(cur) - new Date().getDate() + 1;
      if (inc === 0) {
        body = `<p>Configure os dias em que você recebe o salário para eu calcular quanto pode gastar por dia até o próximo pagamento.</p>
          <button class="link-btn" type="button" data-action="salary">Configurar meu salário</button>`;
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
        <button class="link-btn" type="button" data-action="go-tab" data-tab="budget">Ver limites</button></div>
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
        <p class="card-sub">Toque numa categoria para ver cada gasto</p></div></div>
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
      Entrou <strong class="num">${money(inc)}</strong> · Saiu <strong class="num">${money(exp)}</strong> ·
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
        <div class="legend"><span><i class="swatch" style="background:var(--series-1)"></i>Entrou</span>
          <span><i class="swatch" style="background:var(--series-2)"></i>Saiu</span></div></div>
      <div class="trend" role="group" aria-label="Quanto entrou e saiu nos últimos 6 meses">
        <div class="trend-grid" aria-hidden="true"><span class="num">${ui.hide ? '' : BRL_COMPACT.format(top / 100)}</span></div>
        ${data
          .map((d) => `<button class="trend-col${d.m === sel ? ' selected' : ''}" type="button" data-action="trend-sel"
              data-month="${d.m}" aria-label="${esc(monthName(d.m))}: entrou ${money(d.inc)}, saiu ${money(d.exp)}">
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
    const card = t.cardId ? cardById(t.cardId) : null;
    const meta = [c.name, card && `💳 ${card.name} · compra ${shortDate(t.buyDate)}`, t.installment && `parcela ${t.installment}`,
      t.recurring && 'todo mês', t.salaryKey && 'automático'].filter(Boolean).join(' · ');
    return `<li><button class="tx" type="button" data-action="edit-tx" data-id="${esc(t.id)}">
      <span class="tx-icon" aria-hidden="true">${c.icon}</span>
      <span class="tx-main"><span class="tx-desc">${esc(t.description || c.name)}</span>
        <span class="tx-meta">${esc(meta)}</span></span>
      <span class="tx-side"><span class="tx-amount num ${t.type === 'income' ? 'pos' : ''}">${t.type === 'income' ? '+' : '−'} ${money(t.amount)}</span>
        ${isBill(t) && !billPaid(t) ? `<span class="badge ${t.date < todayISO() ? 'critical' : 'warning'}">${t.date < todayISO() ? 'Atrasada' : 'A pagar'}</span>` : ''}</span>
    </button></li>`;
  }

  function recentCard(list) {
    const recent = sortTx(list).slice(0, 5);
    if (!recent.length) {
      return `<section class="card empty"><div class="empty-icon" aria-hidden="true">🗒️</div>
        <h2>Nada lançado neste mês</h2><p>Toque em “Adicionar” para registrar um gasto ou um ganho.</p></section>`;
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
    return `${demoBanner()}${helpCard('transactions', 'Aqui fica tudo o que entrou e saiu no mês, como o extrato do banco. Toque num item para corrigir ou apagar.')}<div class="toolbar">
        <div class="chips">${chip('all', 'Tudo')}${chip('expense', 'Gastos')}${chip('income', 'Ganhos')}
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
      <div><span>Entrou</span><strong class="num pos">${money(inc)}</strong></div>
      <div><span>Saiu</span><strong class="num neg">${money(exp)}</strong></div>
      <div><span>Saldo</span><strong class="num">${money(bal)}</strong></div></div>`;
    if (!list.length) {
      $('#txList').innerHTML = `<div class="empty"><div class="empty-icon" aria-hidden="true">🔍</div>
        <h2>Nada por aqui</h2><p>${q || ui.category || ui.filter !== 'all'
          ? 'Nada encontrado com esses filtros neste mês.'
          : 'Toque em “Adicionar” para registrar o primeiro gasto ou ganho do mês.'}</p></div>`;
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
        <div class="card-head"><h2 class="card-title">Limites do mês</h2><span class="badge ${st.cls}">${st.label}</span></div>
        <div class="progress" style="grid-column:auto"><div class="${st.cls}" style="width:${Math.min(100, st.pct * 100).toFixed(1)}%"></div></div>
        <div class="budget-nums" style="margin-top:8px">
          <span>Gasto <strong class="num">${money(limitedSpent)}</strong> de <span class="num">${money(totalLimit)}</span></span>
          <span class="num">${limitedSpent > totalLimit ? `Passou ${money(limitedSpent - totalLimit)}` : `Resta ${money(totalLimit - limitedSpent)}`}</span>
        </div>
        ${inc && totalLimit > inc ? `<p class="hint" style="margin-top:8px">⚠ Seus limites somam mais que a renda deste mês (${money(inc)}).</p>` : ''}
      </section>`;
    } else {
      summary = `<section class="card tip"><div class="tip-icon" aria-hidden="true">🎯</div><div>
        <p><strong>Escolha quanto quer gastar no máximo</strong> em cada categoria. Toque numa delas abaixo. O app avisa quando chegar perto.</p></div></section>`;
    }

    const rule = inc
      ? `<section class="card">
        <div class="card-head"><div><h2 class="card-title">Regra 50/30/20</h2>
          <p class="card-sub">Jeito simples de dividir a renda de ${money(inc)}: metade nas contas, 30% nos desejos e 20% guardado</p></div></div>
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

    return `${demoBanner()}${helpCard('budget', 'Defina quanto quer gastar no máximo por mês em cada categoria, como mercado e delivery. O app avisa quando chegar a 80% e quando passar.')}${summary}${rule}<section class="card">
      <div class="card-head"><h2 class="card-title">Limites por categoria</h2></div>${rows}</section>`;
  }

  function cardsCard() {
    if (ui.month !== currentMonth() || !state.cards.length) return '';
    return `<section class="card cards">
      <div class="card-head"><h2 class="card-title">💳 Cartões de crédito</h2></div>
      ${state.cards.map((c) => {
        const inv = currentInvoice(c);
        const st = invoiceStatus(c, inv);
        const used = cardUsed(c);
        const pct = c.limit ? Math.min(1, used / c.limit) : 0;
        return `<div class="cc">
          <div class="cc-top"><strong>${esc(c.name)}</strong><span class="badge ${st.cls}">${esc(st.text)}</span></div>
          <div class="cc-inv"><span>Fatura de ${esc(monthName(monthOf(inv.due), { month: 'long' }))} · vence ${shortDate(inv.due)}</span>
            <strong class="num">${money(inv.total)}</strong></div>
          ${c.limit ? `<div class="progress" style="grid-column:auto"><div class="${pct >= 0.9 ? 'critical' : pct >= 0.7 ? 'warning' : 'neutral'}" style="width:${(pct * 100).toFixed(1)}%"></div></div>
            <div class="cc-limit"><span>Limite disponível <strong class="num">${money(Math.max(0, c.limit - used))}</strong></span><span class="num">de ${money(c.limit)}</span></div>` : ''}
          <button class="link-btn" type="button" data-action="see-invoice" data-card="${esc(c.id)}" data-due="${inv.due}">Ver fatura</button>
        </div>`;
      }).join('')}
    </section>`;
  }

  function openInvoiceSheet(card, due) {
    const list = invoicesOf(card);
    const openDue = invoiceDue(card, todayISO());
    if (!list.some((i) => i.due === openDue)) list.push({ due: openDue, close: closingOf(card, openDue), total: 0, items: [], paid: false });
    list.sort((a, b) => (a.due < b.due ? -1 : 1));
    let idx = Math.max(0, list.findIndex((i) => i.due === due));
    const root = openSheet('<div id="invBox"></div>');
    const paint = () => {
      const inv = list[idx];
      inv.paid = card.paid.includes(inv.due);
      const st = invoiceStatus(card, inv);
      const items = inv.items.slice().sort((a, b) => (a.buyDate < b.buyDate ? 1 : -1));
      $('#invBox', root).innerHTML = `<div class="inv-nav">
          <button class="icon-btn" type="button" data-nav="-1" aria-label="Fatura anterior"${idx === 0 ? ' disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
          <div><h2 class="sheet-title" id="sheetTitle" style="margin:0">💳 ${esc(card.name)}</h2>
            <p class="card-sub">Fatura de ${esc(monthName(monthOf(inv.due)))}</p></div>
          <button class="icon-btn" type="button" data-nav="1" aria-label="Próxima fatura"${idx === list.length - 1 ? ' disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
        <div class="inv-total"><span class="badge ${st.cls}">${esc(st.text)}</span>
          <strong class="num">${fmtMoney(inv.total)}</strong>
          <small>Fecha ${shortDate(inv.close)} · vence ${shortDate(inv.due)}</small></div>
        ${items.length ? `<ul class="tx-list">${items.map((t) => `<li class="inv-item"><span>${shortDate(t.buyDate)}</span>
          <span class="tx-main"><span class="tx-desc">${esc(t.description || catById('expense', t.category).name)}</span>
          <span class="tx-meta">${esc(catById('expense', t.category).name)}${t.installment ? ` · parcela ${esc(t.installment)}` : ''}</span></span>
          <strong class="num">${fmtMoney(t.amount)}</strong></li>`).join('')}</ul>`
          : '<p class="bills-empty">Nenhuma compra nesta fatura ainda.</p>'}
        <div class="actions" style="margin-top:12px">
          ${inv.total && !inv.paid ? '<button class="btn primary block" type="button" id="payInv">✓ Paguei esta fatura</button>' : ''}
          ${inv.paid ? '<button class="btn block" type="button" id="unpayInv">Desfazer pagamento da fatura</button>' : ''}
        </div>`;
      const pay = $('#payInv', root);
      if (pay) pay.addEventListener('click', () => { payInvoice(card, inv.due); paint(); });
      const unpay = $('#unpayInv', root);
      if (unpay) unpay.addEventListener('click', () => {
        card.paid = card.paid.filter((d) => d !== inv.due);
        save();
        render();
        paint();
      });
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]');
      if (!b || b.disabled) return;
      idx = Math.min(list.length - 1, Math.max(0, idx + Number(b.dataset.nav)));
      paint();
    });
    paint();
  }

  function payInvoice(card, due) {
    if (!card.paid.includes(due)) card.paid.push(due);
    save();
    render();
    toast(`Fatura ${card.name} paga ✓`, {
      label: 'Desfazer',
      run: () => {
        card.paid = card.paid.filter((d) => d !== due);
        save();
        render();
      },
    });
  }

  function openCardSheet(card) {
    const isNew = !card;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">💳 ${isNew ? 'Novo cartão' : 'Editar cartão'}</h2>
      <form id="cardForm" class="form" novalidate>
        <div class="field"><label for="cardName">Nome do cartão</label>
          <input id="cardName" maxlength="30" placeholder="Ex.: Nubank" autocomplete="off" value="${esc(card ? card.name : '')}"></div>
        <div class="field-row">
          <div class="field"><label for="cardClose">Dia que a fatura fecha</label>
            <input id="cardClose" type="number" min="1" max="31" inputmode="numeric" value="${card ? card.closingDay : ''}" placeholder="Ex.: 3"></div>
          <div class="field"><label for="cardDue">Dia do vencimento</label>
            <input id="cardDue" type="number" min="1" max="31" inputmode="numeric" value="${card ? card.dueDay : ''}" placeholder="Ex.: 10"></div>
        </div>
        <p class="hint" id="closeHint" hidden>Sugerimos o fechamento 7 dias antes do vencimento, como no Nubank e em vários bancos. Confira na fatura do app do banco.</p>
        <div class="field"><label for="cardLimit">Limite total (opcional)</label>
          <input id="cardLimit" class="money" inputmode="numeric" autocomplete="off"></div>
        ${isNew ? `<div class="field"><label for="cardOpen">Valor da fatura que já está aberta (opcional)</label>
          <input id="cardOpen" class="money" inputmode="numeric" autocomplete="off">
          <p class="hint">Entra como uma compra só, na fatura atual. Depois é só lançar as compras novas.</p></div>` : ''}
        <div class="debt-preview" id="cardPreview" aria-live="polite"></div>
        <p class="hint">Os dias aparecem no app do banco, na fatura. Compras parceladas no cartão: lance pelo botão Adicionar escolhendo o cartão. Use a aba Dívidas só para dívida renegociada ou fatura parcelada.</p>
        <div class="actions">
          <button class="btn primary block" type="submit">Salvar cartão</button>
          ${isNew ? '' : '<button class="btn danger block" type="button" id="delCard">Excluir cartão</button><div id="confirmSlot"></div>'}
        </div>
      </form>`);
    const limit = $('#cardLimit', root);
    bindMoney(limit, card ? card.limit : 0);
    const openAmt = $('#cardOpen', root);
    if (openAmt) bindMoney(openAmt, 0);
    // Sugere o fechamento 7 dias antes do vencimento enquanto a pessoa não mexer nele.
    let closeAuto = isNew;
    $('#cardClose', root).addEventListener('input', () => {
      closeAuto = false;
      $('#closeHint', root).hidden = true;
    });
    $('#cardDue', root).addEventListener('input', () => {
      const due = parseInt($('#cardDue', root).value, 10);
      if (!closeAuto || !(due >= 1 && due <= 31)) return;
      $('#cardClose', root).value = String(((due - 8 + 31) % 31) + 1);
      $('#closeHint', root).hidden = false;
    });
    const day = (id) => {
      const v = parseInt($(`#${id}`, root).value, 10);
      return v >= 1 && v <= 31 ? v : null;
    };
    const preview = () => {
      const close = day('cardClose');
      const due = day('cardDue');
      const box = $('#cardPreview', root);
      if (!close || !due) {
        box.innerHTML = '<p>Informe o dia de fechamento e o dia de vencimento da fatura.</p>';
        return;
      }
      if (close === due) {
        box.innerHTML = '<p>⚠ O fechamento e o vencimento costumam ser em dias diferentes. Confira na fatura.</p>';
        return;
      }
      const tmp = { closingDay: close, dueDay: due };
      const today = todayISO();
      box.innerHTML = `<p>🛒 Comprando hoje (${shortDate(today)}), a compra entra na fatura que vence em <strong>${shortDate(invoiceDue(tmp, today))}</strong>.</p>
        <p>⭐ <strong>Melhor dia para comprar: dia ${close}</strong>. Comprando no dia do fechamento, você só paga na fatura do mês seguinte.</p>`;
    };
    preview();
    ['input', 'change'].forEach((ev) => ['cardClose', 'cardDue'].forEach((id) => $(`#${id}`, root).addEventListener(ev, preview)));
    $('#cardForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#cardName', root).value.trim();
      const close = day('cardClose');
      const due = day('cardDue');
      if (!name) {
        toast('Dê um nome para o cartão, ex.: Nubank.');
        $('#cardName', root).focus();
        return;
      }
      if (!close || !due) {
        toast('Informe os dias de fechamento e de vencimento (1 a 31).');
        return;
      }
      if (close === due) {
        toast('O fechamento e o vencimento precisam ser em dias diferentes.');
        return;
      }
      const data = { name, closingDay: close, dueDay: due, limit: centsOf(limit) };
      if (isNew) {
        const c = { id: uid(), paid: [], createdAt: Date.now(), ...data };
        state.cards.push(c);
        const open = openAmt ? centsOf(openAmt) : 0;
        if (open) addOpenInvoice(c, open);
      } else {
        Object.assign(card, data);
        recomputeCardTx(card);
      }
      save();
      closeSheet();
      render();
      toast(isNew ? 'Cartão cadastrado 💳' : 'Cartão atualizado');
    });
    if (!isNew) {
      $('#delCard', root).addEventListener('click', () => confirmBox($('#confirmSlot', root),
        'Excluir este cartão? As compras dele continuam no extrato como gasto comum.', [
          { label: 'Cancelar', onClick: () => { $('#confirmSlot', root).innerHTML = ''; } },
          {
            label: 'Excluir', cls: 'danger', onClick: () => {
              for (const t of state.transactions) {
                if (t.cardId !== card.id) continue;
                delete t.cardId;
                delete t.buyDate;
                delete t.cardOffset;
                if (card.paid.includes(t.date)) t.paidAt = t.date;
                else t.bill = true;
              }
              state.cards = state.cards.filter((c) => c.id !== card.id);
              save();
              closeSheet();
              render();
              toast('Cartão excluído');
            },
          },
        ]));
    }
    if (isNew) $('#cardName', root).focus();
  }

  // ----- Dívidas -----

  // Quanto se paga hoje por uma dívida: a melhor proposta válida ou o valor cheio.
  const payNow = (d) => { const o = bestOffer(d); return o ? o.value : leftOf(d) * d.amount; };

  function debtsHomeCard() {
    const all = state.debts.filter((d) => leftOf(d) > 0);
    if (!all.length) return '';
    const normal = all.filter((d) => !d.overdue);
    const late = all.filter((d) => d.overdue);
    let html = '';
    if (normal.length) {
      const next = normal.slice().sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1))[0];
      const days = daysUntil(next.nextDue);
      const left = sum(normal.map((d) => debtInfo(d).leftAmount));
      html += `<p>Você ainda deve <strong class="num">${money(left)}</strong> em ${normal.length} ${normal.length === 1 ? 'dívida parcelada' : 'dívidas parceladas'}.
        Próxima parcela: <strong class="num">${money(next.amount)}</strong> (${esc(next.name)}), ${dueText(days, next.nextDue)}.</p>
        ${days <= 3 ? '<span class="badge warning">⚠ Separe o dinheiro</span> ' : ''}`;
    }
    if (late.length) {
      const full = sum(late.map((d) => d.amount));
      const best = sum(late.map(payNow));
      html += `<p>⚠️ <strong>${late.length} ${late.length === 1 ? 'dívida em atraso' : 'dívidas em atraso'}</strong>: <strong class="num">${money(full)}</strong>.
        ${best < full ? `Pagando as propostas de desconto: <strong class="num">${money(best)}</strong> (economia de <strong class="num">${money(full - best)}</strong>).` : ''}</p>`;
    }
    return `<section class="card tip"><div class="tip-icon" aria-hidden="true">🏦</div><div>${html}
      <button class="link-btn" type="button" data-action="go-tab" data-tab="debts">Ver minhas dívidas</button></div></section>`;
  }

  // Cartão da dívida em atraso (negativada): valor único e propostas de desconto.
  function overdueCard(d) {
    const done = leftOf(d) <= 0;
    const best = bestOffer(d);
    const pct = best ? offerPct(best) : 0;
    return `<section class="card debt">
      <div class="goal-head">
        <span class="tx-icon" aria-hidden="true">${d.icon}</span>
        <div style="min-width:0;flex:1"><h2 class="goal-name">${esc(d.name)}</h2>
          <p class="card-sub">${done ? (d.settled ? 'Quitada com proposta' : 'Quitada') : 'Dívida em atraso · valor único'}${d.rate && !done ? ` · juros ${rateText(d.rate)}` : ''}</p></div>
        <span class="badge ${done ? 'good' : 'critical'}">${done ? '🎉 Quitada' : '⚠ Em atraso'}</span>
      </div>
      ${done ? '' : `<div class="debt-big"><span>Valor da dívida hoje</span><strong class="num">${money(d.amount)}</strong></div>
      ${best ? `<div class="debt-stats" style="grid-template-columns:1fr 1fr">
        <div><dt>Melhor proposta</dt><dd class="num">${money(best.value)}</dd></div>
        <div><dt>Economia</dt><dd class="num pos">${money(best.remaining - best.value)} (${pct}%)</dd></div></div>` : '<p class="hint">Sem proposta cadastrada. Veja no Serasa ou no app do banco e toque em “💬 Proposta”.</p>'}`}
      ${d.settled ? `<p class="settled">🎉 Quitada em ${shortDate(d.settled.date)} pagando <strong class="num">${money(d.settled.value)}</strong>${d.settled.saved ? ` · economia de <strong class="num">${money(d.settled.saved)}</strong>` : ''}</p>` : ''}
      ${offersBlock(d)}
      ${done ? `<div class="goal-actions"><button class="btn" type="button" data-action="edit-debt" data-id="${esc(d.id)}">Editar</button></div>`
        : `<div class="goal-actions">
        <button class="btn primary" type="button" data-action="new-offer" data-id="${esc(d.id)}">💬 Nova proposta</button>
        <button class="btn" type="button" data-action="edit-debt" data-id="${esc(d.id)}">Editar</button></div>
      <div class="goal-actions"><button class="btn" type="button" data-action="settle-debt" data-id="${esc(d.id)}">✓ Quitei esta dívida</button></div>`}
    </section>`;
  }

  function debtCard(d) {
    if (d.overdue) return overdueCard(d);
    const i = debtInfo(d);
    let badge = '<span class="badge good">✓ Em dia</span>';
    if (i.done) badge = '<span class="badge good">🎉 Quitada</span>';
    else if (i.days <= 0) badge = '<span class="badge critical">⚠ Vence hoje</span>';
    else if (i.days <= 5) badge = `<span class="badge warning">⏰ ${i.days === 1 ? 'Amanhã' : `Em ${i.days} dias`}</span>`;
    const pct = (d.total - i.left) / d.total;
    return `<section class="card debt">
      <div class="goal-head">
        <span class="tx-icon" aria-hidden="true">${d.icon}</span>
        <div style="min-width:0;flex:1"><h2 class="goal-name">${esc(d.name)}</h2>
          <p class="card-sub">${i.done ? (d.settled ? 'Quitada com proposta' : `${d.total} parcelas pagas`) : `Próxima: parcela <strong>${i.current} de ${d.total}</strong>`}${d.rate && !i.done ? ` · juros ${rateText(d.rate)}` : ''}</p></div>
        ${badge}
      </div>
      ${i.done ? '' : `<div class="debt-big"><span>Falta pagar</span><strong class="num">${money(i.leftAmount)}</strong></div>
      <dl class="debt-stats">
        <div><dt>Faltam</dt><dd>${i.left} ${i.left === 1 ? 'parcela' : 'parcelas'}</dd></div>
        <div><dt>Cada parcela</dt><dd class="num">${money(d.amount)}</dd></div>
        <div><dt>Próximo vencimento</dt><dd>${shortDate(d.nextDue)}${i.days > 0 ? ` <small>(${i.days === 1 ? 'amanhã' : `em ${i.days} dias`})</small>` : ' <small>(hoje)</small>'}</dd></div>
        <div><dt>Última parcela</dt><dd>${esc(monthYear(i.lastYM))}</dd></div>
      </dl>`}
      <div class="progress" style="grid-column:auto"><div class="${i.done ? 'good' : 'neutral'}" style="width:${(pct * 100).toFixed(1)}%"></div></div>
      ${d.settled ? `<p class="settled">🎉 Quitada em ${shortDate(d.settled.date)} pagando <strong class="num">${money(d.settled.value)}</strong>${d.settled.saved ? ` · economia de <strong class="num">${money(d.settled.saved)}</strong>` : ''}</p>`
        : `<div class="goal-nums"><span>${d.total - i.left} de ${d.total} pagas${d.advanced ? ` (${d.advanced} antecipadas)` : ''} · <span class="num">${money(i.paidAmount)}</span></span>
        <span>Total <span class="num">${money(i.totalAmount)}</span></span></div>`}
      ${offersBlock(d)}
      <div class="goal-actions">
        ${i.done ? '' : `<button class="btn primary" type="button" data-action="pay-debt" data-id="${esc(d.id)}">✓ Paguei esta parcela</button>`}
        <button class="btn" type="button" data-action="edit-debt" data-id="${esc(d.id)}">Editar</button>
      </div>
      ${i.done ? '' : `<div class="goal-actions">
        <button class="btn" type="button" data-action="advance-debt" data-id="${esc(d.id)}">⏩ Antecipar</button>
        <button class="btn" type="button" data-action="new-offer" data-id="${esc(d.id)}">💬 Proposta</button>
      </div>`}
    </section>`;
  }

  // ----- Plano para quitar -----
  // Simula mês a mês: paga as parcelas normais e coloca o extra na primeira dívida da fila.
  // Quando uma dívida acaba, a parcela dela passa a reforçar a próxima ("bola de neve").

  const rateText = (r) => `${String(r).replace('.', ',')}% ao mês`;

  function planStrategy() {
    const chosen = state.settings.debtStrategy;
    if (chosen === 'fast' || chosen === 'interest') return chosen;
    return state.debts.some((d) => leftOf(d) > 0 && d.rate) ? 'interest' : 'fast';
  }

  function payoffPlan(extra, strategy) {
    // Dívida em atraso não tem parcela: só avança com o valor extra e conta pela melhor proposta.
    const items = state.debts.filter((d) => leftOf(d) > 0).map((d) => ({
      d, rem: d.overdue ? payNow(d) : leftOf(d) * d.amount, need: d.overdue ? payNow(d) : leftOf(d) * d.amount, inst: d.overdue ? 0 : d.amount,
      start: d.overdue ? currentMonth() : monthOf(d.nextDue), end: null, baseEnd: d.overdue ? null : debtInfo(d).lastYM,
    }));
    const byRem = (a, b) => a.rem - b.rem;
    const byRate = (a, b) => (b.d.rate || 0) - (a.d.rate || 0);
    items.sort(strategy === 'interest' ? (a, b) => byRate(a, b) || byRem(a, b) : (a, b) => byRem(a, b) || byRate(a, b));
    const cur = currentMonth();
    let rollover = 0;
    for (let m = 0; m < 600 && items.some((x) => x.rem > 0); m++) {
      const ym = shiftMonth(cur, m);
      for (const x of items) {
        if (x.rem > 0 && ym >= x.start) {
          x.rem -= Math.min(x.inst, x.rem);
          if (x.rem <= 0) x.end = ym;
        }
      }
      let pool = extra + rollover;
      for (const x of items) {
        if (pool <= 0) break;
        if (x.rem > 0) {
          const pay = Math.min(pool, x.rem);
          x.rem -= pay;
          pool -= pay;
          if (x.rem <= 0) x.end = ym;
        }
      }
      rollover = sum(items.filter((x) => x.rem <= 0).map((x) => x.inst));
    }
    const unresolved = items.some((x) => x.rem > 0);
    const freeYM = unresolved ? '' : items.reduce((m, x) => (x.end && x.end > m ? x.end : m), '');
    const baseYM = items.reduce((m, x) => (x.baseEnd && x.baseEnd > m ? x.baseEnd : m), '');
    const hasOverdue = items.some((x) => x.d.overdue);
    return { items, freeYM, baseYM, unresolved, saved: freeYM && baseYM && !hasOverdue ? monthsBetween(freeYM, baseYM) : 0 };
  }

  function planCard(active) {
    const strategy = planStrategy();
    const anyRate = active.some((d) => d.rate);
    return `<section class="card plan">
      <div><h2 class="card-title">🎯 Plano para quitar</h2>
        <p class="card-sub">O app escolhe por onde começar e calcula quando você fica livre</p></div>
      <div class="field"><label for="planExtra">Quanto a mais por mês você consegue colocar nas dívidas?</label>
        <input id="planExtra" class="money" inputmode="numeric" autocomplete="off"></div>
      <div class="chips" id="planChips">${[5000, 10000, 20000, 50000].map((c) => `<button class="chip" type="button" data-cents="${c}">${fmtMoney(c).replace(',00', '')}</button>`).join('')}</div>
      ${active.length > 1 ? `<div class="segmented" id="planStrategy">
        <button type="button" data-value="fast" class="${strategy === 'fast' ? 'active' : ''}">⚡ Menor dívida primeiro</button>
        <button type="button" data-value="interest" class="${strategy === 'interest' ? 'active' : ''}">💸 Maior juros primeiro</button>
      </div>
      ${anyRate ? '' : '<p class="hint">💡 Sabe os juros de cada dívida? Coloque em Editar → “Juros ao mês”. Com eles, o app consegue mostrar onde você economiza mais.</p>'}` : ''}
      <div id="planResult" aria-live="polite"></div>
    </section>`;
  }

  function renderPlanResult() {
    const box = $('#planResult');
    if (!box) return;
    const extra = state.settings.debtExtra || 0;
    const strategy = planStrategy();
    const plan = payoffPlan(extra, strategy);
    if (!plan.items.length) {
      box.innerHTML = '';
      return;
    }
    const first = plan.items[0];
    const firstBest = bestOffer(first.d);
    const reason = first.d.overdue
      ? (firstBest
        ? `Está em atraso e tem proposta de <strong>${offerPct(firstBest)}% de desconto</strong>: você paga <strong>${money(firstBest.value)}</strong> em vez de ${money(firstBest.remaining)} e limpa o nome.`
        : `Está em atraso (<strong>${money(first.d.amount)}</strong>). Procure uma proposta de desconto e cadastre em “💬 Proposta”.`)
      : strategy === 'interest' && first.d.rate
      ? `Tem os <strong>maiores juros (${rateText(first.d.rate)})</strong>. Cada real antecipado nela é o que mais economiza.`
      : `É a <strong>menor dívida</strong> (falta ${money(leftOf(first.d) * first.d.amount)}). Quitando primeiro, você se livra da parcela de ${money(first.inst)} mais rápido e usa esse dinheiro na próxima.`;
    const offer = state.debts.filter((d) => !d.overdue).map((d) => ({ d, o: bestOffer(d) })).filter((x) => x.o && offerPct(x.o) >= 30)
      .sort((a, b) => offerPct(b.o) - offerPct(a.o))[0];
    box.innerHTML = `<div class="plan-first">
        <span class="eyebrow">Comece por</span>
        <strong>${first.d.icon} ${esc(first.d.name)}</strong>
        <p>${reason}</p>
        ${extra ? (first.d.overdue
          ? `<p>Separe <strong class="num">${money(extra)}</strong> por mês. Quando juntar <strong class="num">${money(first.need)}</strong>, pague ${bestOffer(first.d) ? 'a proposta' : 'a dívida'} à vista.</p>`
          : `<p>Todo mês: pague as parcelas normais e use <strong class="num">${money(extra)}</strong> para <strong>antecipar parcelas</strong> desta dívida (botão ⏩ Antecipar).</p>`) : ''}
      </div>
      <p class="plan-label">Quando cada dívida acaba:</p>
      <ol class="plan-steps">${plan.items.slice().sort((a, b) => (a.end && b.end ? (a.end < b.end ? -1 : 1) : a.end ? -1 : b.end ? 1 : 0)).map((x, k) => {
        const diff = x.end && x.baseEnd ? monthsBetween(x.end, x.baseEnd) : 0;
        const ob = x.d.overdue ? bestOffer(x.d) : null;
        return `<li><span class="plan-n">${k + 1}</span><div><strong>${esc(x.d.name)}</strong>
          <small>${x.end ? `Quitada em ${esc(monthYear(x.end))}` : 'Sem previsão: informe um valor extra por mês acima'}${diff > 0 ? ` · <b>${diff} ${diff === 1 ? 'mês' : 'meses'} antes</b>` : ''}${ob ? ` · com proposta de ${money(ob.value)}` : ''}</small></div></li>`;
      }).join('')}</ol>
      <div class="plan-free">${plan.freeYM
        ? `🏁 Livre de todas as dívidas em <strong>${esc(monthYear(plan.freeYM))}</strong>${plan.saved > 0
          ? `: <b>${plan.saved} ${plan.saved === 1 ? 'mês' : 'meses'} antes</b> do previsto (${esc(monthYear(plan.baseYM))}) 🎉` : ''}`
        : '🏁 Coloque um valor a mais por mês acima para ver quando você fica livre das dívidas.'}</div>
      ${offer ? `<p class="plan-offer">💬 <strong>${esc(offer.d.name)}</strong> tem proposta de quitação com <strong>${offerPct(offer.o)}% de desconto</strong>. Se você tiver o dinheiro à vista, pode valer mais a pena começar por ela.</p>` : ''}
      <p class="hint">Quando uma dívida acaba, o valor da parcela dela vai para a próxima da lista. Na vida real, antecipar costuma dar desconto de juros, então você termina antes ou pagando menos que o cálculo.</p>`;
  }

  // Liga os controles do plano depois que a aba Dívidas é desenhada.
  let planSaveTimer = 0;
  function bindPlan() {
    const input = $('#planExtra');
    if (!input) return;
    bindMoney(input, state.settings.debtExtra || 0);
    input.addEventListener('input', () => {
      state.settings.debtExtra = centsOf(input);
      renderPlanResult();
      clearTimeout(planSaveTimer);
      planSaveTimer = setTimeout(save, 600);
    });
    $('#planChips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cents]');
      if (!b) return;
      input.value = b.dataset.cents;
      input.dispatchEvent(new Event('input'));
    });
    const seg = $('#planStrategy');
    if (seg) {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        state.settings.debtStrategy = b.dataset.value;
        $$('button', seg).forEach((x) => x.classList.toggle('active', x === b));
        save();
        renderPlanResult();
      });
    }
    renderPlanResult();
  }

  // ----- Propostas de quitação -----

  // Desconto arredondado para baixo, como o Serasa mostra: nunca promete mais do que existe.
  const offerPct = (o) => (o.remaining > o.value ? Math.floor(((o.remaining - o.value) / o.remaining) * 100) : 0);
  const offerValid = (o) => !o.until || o.until >= todayISO();
  const bestOffer = (d) => (leftOf(d) > 0 ? (d.offers || []).filter(offerValid).sort((a, b) => offerPct(b) - offerPct(a))[0] : null);
  function offerGrade(pct) {
    if (pct >= 50) return { cls: 'good', label: '🔥 Ótima proposta' };
    if (pct >= 30) return { cls: 'good', label: '👍 Boa proposta' };
    if (pct >= 10) return { cls: 'warning', label: '🤝 Dá para negociar mais' };
    return { cls: 'critical', label: '👎 Desconto fraco' };
  }

  function offersBlock(d) {
    if (!d.offers || !d.offers.length || leftOf(d) <= 0) return '';
    const best = bestOffer(d);
    return `<div class="offers"><p class="offers-title">💬 Propostas de quitação</p>${d.offers.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((o) => {
      const pct = offerPct(o);
      const g = offerGrade(pct);
      const valid = offerValid(o);
      return `<div class="offer${o === best ? ' best' : ''}${valid ? '' : ' expired'}">
        <div class="offer-main"><strong class="num">${money(o.value)}</strong>
          <span class="badge ${valid ? g.cls : ''}">${valid ? `−${pct}%` : 'Vencida'}</span>
          <small>Economia de ${money(Math.max(0, o.remaining - o.value))} · ${shortDate(o.date)}${o.note ? ` · ${esc(o.note)}` : ''}${o.until ? ` · válida até ${shortDate(o.until)}` : ''}</small></div>
        <div class="offer-actions">
          ${valid ? `<button class="btn primary" type="button" data-action="accept-offer" data-id="${esc(d.id)}" data-offer="${esc(o.id)}">Aceitar</button>` : ''}
          <button class="btn" type="button" data-action="del-offer" data-id="${esc(d.id)}" data-offer="${esc(o.id)}" aria-label="Excluir proposta">✕</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function viewDebts() {
    const help = helpCard('debts', 'Cadastre empréstimos, financiamentos e compras parceladas: o app conta sozinho quantas parcelas faltam. Dívidas em atraso (negativadas) entram com o valor total e as propostas de desconto.');
    if (!state.debts.length) {
      return `${demoBanner()}${help}<section class="card empty"><div class="empty-icon" aria-hidden="true">🏦</div>
        <h2>Nenhuma dívida cadastrada</h2>
        <p>Tem empréstimo, financiamento ou compra parcelada? Cadastre aqui e acompanhe quanto falta.</p>
        <button class="btn primary" type="button" data-action="new-debt">Cadastrar dívida</button></section>`;
    }
    const cur = currentMonth();
    const active = state.debts.filter((d) => leftOf(d) > 0);
    const infos = active.map(debtInfo);
    const leftTotal = sum(infos.map((i) => i.leftAmount));
    const thisMonth = sum(active.map((d, k) => (infos[k].inMonth(cur) ? d.amount : 0)));
    const freeYM = infos.reduce((m, i) => (i.lastYM && i.lastYM > m ? i.lastYM : m), '');
    const lateTotal = sum(active.filter((d) => d.overdue).map((d) => d.amount));
    const rank = (d) => (leftOf(d) <= 0 ? 2 : d.overdue ? 1 : 0);
    const sorted = state.debts.slice().sort((a, b) => {
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return a.overdue ? b.amount - a.amount : a.nextDue < b.nextDue ? -1 : 1;
    });
    const summary = active.length
      ? `<section class="card hero" aria-label="Resumo das dívidas">
          <p class="eyebrow">Total que falta pagar</p>
          <div class="hero-value num">${money(leftTotal)}</div>
          <div class="hero-split">
            <div><span>Parcelas deste mês</span><strong class="num">${money(thisMonth)}</strong></div>
            ${lateTotal ? `<div><span>Em atraso</span><strong class="num">${money(lateTotal)}</strong></div>`
              : `<div><span>Livre das dívidas em</span><strong>${freeYM ? esc(monthYear(freeYM)) : '—'}</strong></div>`}
          </div>
        </section>`
      : `<section class="card tip"><div class="tip-icon" aria-hidden="true">🎉</div><div>
          <p><strong>Parabéns! Todas as dívidas estão quitadas.</strong> Que tal usar o valor das parcelas para guardar dinheiro numa meta?</p></div></section>`;
    return `${demoBanner()}${help}${summary}${active.length ? planCard(active) : ''}${sorted.map(debtCard).join('')}
      <button class="btn block" type="button" data-action="new-debt">+ Cadastrar dívida</button>`;
  }

  // Caixa de explicação no topo de cada aba; some quando a pessoa toca em "Entendi".
  function helpCard(tab, text) {
    if (state.settings.helpSeen[tab]) return '';
    return `<section class="card help"><p>💬 ${text}</p>
      <button class="link-btn" type="button" data-action="help-ok" data-tab="${tab}">Entendi</button></section>`;
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
      return `${demoBanner()}${helpCard('goals', 'Junte dinheiro para um objetivo, como uma reserva ou uma moto. O app diz quanto guardar por mês para chegar lá no prazo.')}<section class="card empty"><div class="empty-icon" aria-hidden="true">🎯</div>
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
          <div class="goal-head"><span class="tx-icon" aria-hidden="true">${goalIconHTML(g.icon)}</span>
            <div style="min-width:0"><h2 class="goal-name">${esc(g.name)}</h2>
              ${plan ? `<p class="card-sub">${plan}</p>` : ''}</div></div>
          <div class="progress" style="grid-column:auto"><div class="${remaining ? 'neutral' : 'good'}" style="width:${(pct * 100).toFixed(1)}%"></div></div>
          <div class="goal-nums"><span><strong class="num">${money(g.saved)}</strong> de <span class="num">${money(g.target)}</span></span>
            <span>${Math.round(pct * 100)}% · faltam <span class="num">${money(remaining)}</span></span></div>
          <div class="goal-actions">
            <button class="btn primary" type="button" data-action="deposit" data-id="${esc(g.id)}">Guardar</button>
            <button class="btn" type="button" data-action="edit-goal" data-id="${esc(g.id)}">Editar</button>
          </div>
          <button class="btn block" type="button" data-action="goal-plan" data-id="${esc(g.id)}">📈 Como chegar lá</button>
        </section>`;
      })
      .join('');
    return `${demoBanner()}${helpCard('goals', 'Junte dinheiro para um objetivo, como uma reserva ou uma moto. O app diz quanto guardar por mês para chegar lá no prazo.')}${cards}<button class="btn block" type="button" data-action="new-goal">+ Nova meta</button>${reserveTip}`;
  }

  // ----- Como chegar na meta: simulador e guia de onde guardar -----
  // Depósito no fim de cada mês, rendimento líquido anual informado pela pessoa (já descontado o IR).

  const monthlyRate = (annualPct) => (1 + annualPct / 100) ** (1 / 12) - 1;

  // Quanto tempo leva para chegar na meta guardando `monthly` por mês.
  function monthsToGoal(g, monthly, annualPct) {
    const i = monthlyRate(annualPct);
    let bal = g.saved;
    let months = 0;
    while (bal < g.target && months < 600) {
      bal = bal * (1 + i) + monthly;
      months += 1;
      if (monthly <= 0 && i <= 0) return null;
    }
    return bal >= g.target ? { months, final: bal, deposited: monthly * months } : null;
  }

  // Quanto guardar por mês para chegar em `months` meses.
  function monthlyNeeded(g, months, annualPct) {
    const i = monthlyRate(annualPct);
    const grow = (1 + i) ** months;
    const need = g.target - g.saved * grow;
    if (need <= 0) return 0;
    return i === 0 ? need / months : (need * i) / (grow - 1);
  }

  const roundUp = (cents, step = 1000) => Math.max(step, Math.ceil(cents / step) * step);

  function timeText(months) {
    if (months === null) return 'mais de 50 anos';
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (!y) return `${m} ${m === 1 ? 'mês' : 'meses'}`;
    return `${y} ${y === 1 ? 'ano' : 'anos'}${m ? ` e ${m} ${m === 1 ? 'mês' : 'meses'}` : ''}`;
  }

  // Quanto dá para guardar por mês sem apertar: 20% da renda (regra 50/30/20).
  function suggestedSaving() {
    const incomes = state.salary ? sum(state.salary.paydays.map((p) => p.amount)) : 0;
    if (incomes) return { value: Math.floor((incomes * 0.2) / 1000) * 1000, source: 'do seu salário' };
    const months = [1, 2, 3].map((k) => shiftMonth(currentMonth(), -k));
    const vals = months.map((m) => totals(txOfMonth(m)).inc).filter((v) => v > 0);
    if (!vals.length) return null;
    return { value: Math.floor((sum(vals) / vals.length) * 0.2 / 1000) * 1000, source: 'da sua renda média' };
  }

  const GUIDE = {
    short: {
      title: 'Para até 1 ano (ou reserva de emergência)',
      items: [
        ['Tesouro Selic', 'Título do governo, o mais seguro do país. Pode resgatar quando quiser (cai no dia seguinte) e rende perto da Selic. Comece a partir de uns R$ 30.'],
        ['CDB com liquidez diária (100% do CDI ou mais)', 'Banco paga e o FGC garante até R$ 250 mil por CPF em cada instituição. Resgate a qualquer dia. Procure “100% do CDI” ou mais.'],
        ['Conta remunerada (100% do CDI)', 'Mais prática: o dinheiro rende na própria conta. Confira se é 100% do CDI e se tem garantia do FGC.'],
      ],
    },
    mid: {
      title: 'Para 1 a 3 anos',
      items: [
        ['CDB com vencimento (pós-fixado)', 'Rende mais que o de liquidez diária se você deixar até a data. Escolha vencimento perto da data da sua meta.'],
        ['LCI ou LCA', 'Não pagam Imposto de Renda e têm FGC. Costumam ter carência de 90 dias ou mais. Compare a taxa com um CDB, já descontando o imposto dele.'],
        ['Tesouro Prefixado', 'Você sabe quanto vai receber se levar até o fim. Se vender antes, o preço pode cair, então só use se não precisar do dinheiro antes.'],
      ],
    },
    long: {
      title: 'Para mais de 3 anos',
      items: [
        ['Tesouro IPCA+', 'Rende a inflação mais uma taxa fixa, então o dinheiro não perde poder de compra. Se vender antes do vencimento, o preço oscila.'],
        ['CDB, LCI ou LCA com vencimento longo', 'Pagam mais por prazos maiores. Cuidado com o limite do FGC e escolha bancos conhecidos.'],
      ],
    },
  };

  function guideHTML(months, emergency) {
    const key = emergency || (months !== null && months <= 12) ? 'short' : months !== null && months <= 36 ? 'mid' : 'long';
    const g = GUIDE[key];
    return `<h3 class="guide-title">📍 ${esc(g.title)}</h3>
      <ul class="guide-list">${g.items.map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('')}</ul>
      <p class="hint">${key === 'short' ? 'Para o que você pode precisar a qualquer momento, o importante é poder resgatar sem perder dinheiro.' : 'Quanto mais longo o prazo, melhor o rendimento, mas o dinheiro fica preso. Case o vencimento com a data da meta.'}</p>`;
  }

  function guideExtras() {
    const late = state.debts.filter((d) => d.overdue && leftOf(d) > 0);
    return `${late.length ? `<div class="debt-preview"><p>⚠️ <strong>Você tem ${late.length} ${late.length === 1 ? 'dívida em atraso' : 'dívidas em atraso'}.</strong> Quitar com 50% ou mais de desconto rende muito mais do que qualquer investimento. Faça uma reserva pequena (1 mês de gastos) e priorize quitar.</p></div>` : ''}
      <details class="guide-more"><summary>Imposto de Renda nos investimentos de renda fixa</summary>
        <p>Incide só sobre o lucro, em tabela que diminui com o tempo: <strong>22,5%</strong> até 180 dias, <strong>20%</strong> de 181 a 360, <strong>17,5%</strong> de 361 a 720 e <strong>15%</strong> acima de 720 dias. LCI e LCA não pagam. Resgate nos primeiros 30 dias tem também IOF.</p></details>
      <details class="guide-more"><summary>O que evitar</summary>
        <p>Poupança (rende menos que CDB e Tesouro Selic hoje) · promessas de “2% ao mês garantido” ou de dobrar o dinheiro · criptomoedas e ações para dinheiro que você vai precisar logo · qualquer coisa que peça dinheiro por WhatsApp ou PIX para um “gerente”.</p></details>
      <p class="hint">Referência de ago/2026: o Copom levou a Selic a 14% ao ano e o mercado espera queda, para cerca de 12% em 2027. Confira a taxa atual no site do Banco Central. Informação educativa, não é recomendação de investimento.</p>`;
  }

  function openGoalPlanSheet(g) {
    const remaining = Math.max(0, g.target - g.saved);
    const rate0 = state.settings.goalRate;
    const sug = suggestedSaving();
    const cur = currentMonth();
    const deadlineMonths = g.deadline ? monthsBetween(cur, g.deadline) : 0;
    const emergency = /reserva|emerg/i.test(g.name);
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${goalIconHTML(g.icon)} Como chegar lá</h2>
      <p class="hint"><strong>${esc(g.name)}</strong>: faltam <strong class="num">${fmtMoney(remaining)}</strong> de ${fmtMoney(g.target)}${g.saved ? ` (já tem ${fmtMoney(g.saved)})` : ''}.</p>
      ${remaining ? `<div class="field"><label for="goalRate">Rendimento estimado ao ano, já descontado o imposto</label>
        <input id="goalRate" inputmode="decimal" autocomplete="off" value="${String(rate0).replace('.', ',')}">
        <div class="chips" id="rateChips">
          <button class="chip" type="button" data-rate="0">0% (só guardando)</button>
          <button class="chip" type="button" data-rate="6">6% poupança</button>
          <button class="chip" type="button" data-rate="10">10% conservador</button>
          <button class="chip" type="button" data-rate="12">12% CDI atual</button></div>
        <p class="hint">O padrão de 10% fica abaixo do CDI de hoje de propósito, porque a Selic deve cair. O rendimento real pode ser maior ou menor.</p></div>
        <div id="scenarios" aria-live="polite"></div>
        <div class="field"><label for="goalMonthly">Simule: quanto posso guardar por mês?</label>
          <input id="goalMonthly" class="money" inputmode="numeric" autocomplete="off"></div>
        <div class="debt-preview" id="goalSim" aria-live="polite"></div>
        ${sug ? `<p class="hint">💡 Pela regra 50/30/20, <strong>20% ${sug.source}</strong> seria cerca de <strong class="num">${fmtMoney(sug.value)}</strong> por mês, somando todas as suas metas.</p>` : ''}`
        : '<div class="debt-preview"><p>🎉 Esta meta já foi alcançada!</p></div>'}
      <div id="guideBox"></div>
      ${guideExtras()}`);
    if (!remaining) return;
    const rateEl = $('#goalRate', root);
    const monthlyEl = $('#goalMonthly', root);
    bindMoney(monthlyEl, 0);
    const readRate = () => {
      const v = Number(rateEl.value.replace('%', '').replace(',', '.'));
      return Number.isFinite(v) && v >= 0 && v <= 30 ? v : rate0;
    };
    const dateOf = (months) => monthName(shiftMonth(cur, months), { month: 'short', year: 'numeric' }).replace('.', '');

    function scenarios() {
      const rate = readRate();
      const base = deadlineMonths > 0 ? roundUp(monthlyNeeded(g, deadlineMonths, rate)) : roundUp(monthlyNeeded(g, 24, rate));
      const opts = deadlineMonths > 0
        ? [{ label: `No prazo (${dateOf(deadlineMonths)})`, v: base }, { label: 'Mais folgado', v: roundUp(base * 0.7) }, { label: 'Mais rápido', v: roundUp(base * 1.5) }]
        : [{ label: 'Tranquilo', v: roundUp(monthlyNeeded(g, 48, rate)) }, { label: 'Equilibrado', v: base }, { label: 'Rápido', v: roundUp(monthlyNeeded(g, 12, rate)) }];
      const rows = opts.map((o) => {
        const r = monthsToGoal(g, o.v, rate);
        const r0 = monthsToGoal(g, o.v, 0);
        const gain = r ? r.final - g.saved - r.deposited : 0;
        return `<div class="scen"><div class="scen-top"><span>${esc(o.label)}</span><strong class="num">${fmtMoney(o.v)}<small>/mês</small></strong></div>
          <div class="scen-body"><span>⏱ <strong>${esc(timeText(r && r.months))}</strong>${r ? ` · ${esc(dateOf(r.months))}` : ''}${deadlineMonths > 0 && (!r || r.months > deadlineMonths) ? ' · ⚠ passa do prazo' : ''}</span>
            <span>📈 rendimento ≈ ${fmtMoney(Math.max(0, gain))}${r0 && r && r0.months > r.months ? ` · ${r0.months - r.months} ${r0.months - r.months === 1 ? 'mês' : 'meses'} mais rápido que sem render` : ''}</span></div></div>`;
      }).join('');
      $('#scenarios', root).innerHTML = `<p class="guide-title">Quanto guardar por mês</p>${rows}`;
      const first = monthsToGoal(g, opts[opts.length === 3 ? 1 : 0].v, rate);
      $('#guideBox', root).innerHTML = guideHTML(deadlineMonths > 0 ? deadlineMonths : (first ? first.months : null), emergency);
    }
    function simulate() {
      const v = centsOf(monthlyEl);
      const box = $('#goalSim', root);
      if (!v) {
        box.innerHTML = '<p>Digite um valor para ver em quanto tempo você chega lá.</p>';
        return;
      }
      const rate = readRate();
      const r = monthsToGoal(g, v, rate);
      const r0 = monthsToGoal(g, v, 0);
      if (!r) {
        box.innerHTML = '<p>Com esse valor a meta leva mais de 50 anos. Tente um valor maior.</p>';
        return;
      }
      const gain = r.final - g.saved - r.deposited;
      box.innerHTML = `<p>⏱ Guardando <strong>${fmtMoney(v)}</strong> por mês você chega em <strong>${esc(timeText(r.months))}</strong> (${esc(dateOf(r.months))}).</p>
        <p>💰 Você deposita ${fmtMoney(r.deposited)} e o rendimento soma cerca de <strong>${fmtMoney(Math.max(0, gain))}</strong>.</p>
        ${r0 && r0.months > r.months ? `<p>📈 Sem rendimento levaria ${esc(timeText(r0.months))}.</p>` : ''}
        ${deadlineMonths > 0 ? (r.months <= deadlineMonths ? '<p>✅ Dentro do seu prazo.</p>' : `<p>⚠ Passa do prazo (${esc(dateOf(deadlineMonths))}) em ${r.months - deadlineMonths} ${r.months - deadlineMonths === 1 ? 'mês' : 'meses'}.</p>`) : ''}`;
    }
    let saveTimer = 0;
    const onRate = () => {
      scenarios();
      simulate();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { state.settings.goalRate = readRate(); save(); }, 600);
    };
    rateEl.addEventListener('input', onRate);
    $('#rateChips', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-rate]');
      if (!b) return;
      rateEl.value = b.dataset.rate;
      onRate();
    });
    monthlyEl.addEventListener('input', simulate);
    scenarios();
    simulate();
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
    const MAX = 99999999999;
    const toEnd = () => requestAnimationFrame(() => {
      try { input.setSelectionRange(input.value.length, input.value.length); } catch { /* sem suporte */ }
    });
    const set = (c) => {
      const v = Math.min(MAX, Math.max(0, c));
      input.dataset.cents = String(v);
      input.value = fmtMoney(v);
      if (document.activeElement === input) toEnd();
    };
    set(cents || 0);
    // Avisa quem acompanha o campo (prévias), já que o evento padrão foi cancelado.
    const changed = (c) => {
      set(c);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    // Cada número entra pelo fim, não importa onde está o cursor (como nos apps de banco).
    input.addEventListener('beforeinput', (e) => {
      const type = e.inputType || '';
      const all = input.value && input.selectionStart === 0 && input.selectionEnd === input.value.length;
      const cur = all ? 0 : centsOf(input);
      if (type === 'insertFromPaste' || type === 'insertFromDrop') {
        e.preventDefault();
        const digits = String(e.data ?? (e.dataTransfer && e.dataTransfer.getData('text')) ?? '').replace(/\D/g, '');
        if (digits) changed(parseInt(digits.slice(0, 11), 10));
      } else if (type.startsWith('insert')) {
        e.preventDefault();
        const digits = String(e.data ?? '').replace(/\D/g, '');
        let c = cur;
        for (const d of digits) c = c * 10 + Number(d);
        if (digits && c <= MAX) changed(c);
      } else if (type.startsWith('delete')) {
        e.preventDefault();
        changed(all ? 0 : Math.floor(cur / 10));
      }
    });
    // Navegadores sem beforeinput (e valores colocados pelo próprio app).
    input.addEventListener('input', () => set(parseInt(input.value.replace(/\D/g, '').slice(0, 11) || '0', 10)));
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
    let payCard = tx && tx.cardId && cardById(tx.cardId) ? tx.cardId : '';

    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${isNew ? 'Adicionar' : 'Editar'}</h2>
      <form id="txForm" class="form" novalidate>
        <div class="segmented" id="typeSeg">
          <button type="button" data-value="expense">💸 Gastei</button>
          <button type="button" data-value="income">💰 Recebi</button>
        </div>
        <div class="field"><label for="txAmount">Valor</label>
          <input id="txAmount" class="money" inputmode="numeric" autocomplete="off" enterkeyhint="next"></div>
        <div class="field"><label for="txDesc">Descrição</label>
          <input id="txDesc" maxlength="60" placeholder="Ex.: Mercado do mês (opcional)" autocomplete="off" value="${esc(tx ? tx.description : '')}"></div>
        <div class="field"><span class="label" id="catLabel">Categoria</span>
          <div class="cat-grid" id="catGrid" role="radiogroup" aria-labelledby="catLabel"></div></div>
        ${state.cards.length ? `<div class="field" id="payField"><span class="label">Como pagou?</span>
          <div class="chips" id="payChips"><button class="chip" type="button" data-card="">💵 Pix, débito ou dinheiro</button>
            ${state.cards.map((c) => `<button class="chip" type="button" data-card="${esc(c.id)}">💳 ${esc(c.name)}</button>`).join('')}</div></div>` : ''}
        <div class="field"><label for="txDate" id="txDateLabel">Data</label>
          <input id="txDate" type="date" required value="${tx ? (tx.cardId ? tx.buyDate : tx.date) : defaultDate()}">
          <p class="hint" id="payHint"></p></div>
        <label class="check" id="billField"><input type="checkbox" id="txUnpaid"${tx ? (isBill(tx) && !billPaid(tx) ? ' checked' : '') : ''}>
          <span id="txUnpaidLabel">Ainda não paguei (é uma conta a pagar, como boleto ou conta de luz)</span></label>
        ${isNew ? `<div class="field"><span class="label">Isso se repete?</span>
          <div class="segmented three" id="repeatSeg">
            <button type="button" data-value="single" class="active">Só uma vez</button>
            <button type="button" data-value="installments">Parcelado</button>
            <button type="button" data-value="fixed">Todo mês</button>
          </div></div>
        <div class="field" id="repeatField" hidden><label for="txRepeat" id="repeatLabel">Número de parcelas</label>
          <input id="txRepeat" type="number" min="2" max="60" value="2" inputmode="numeric">
          <p class="hint" id="repeatHint"></p></div>` : tx.debtId ? '<p class="hint">Esta é uma parcela de dívida. Para mudar todas as parcelas, edite a dívida na aba Dívidas.</p>'
          : tx.groupId ? `<p class="hint">Este lançamento faz parte de uma série (${tx.installment ? `parcela ${esc(tx.installment)}` : 'todo mês'}). Alterações valem só para ele.</p>` : ''}
        <div class="actions">
          <button class="btn primary block" type="submit">Salvar</button>
          ${isNew ? '' : '<button class="btn danger block" type="button" id="delBtn">Excluir</button><div id="confirmSlot"></div>'}
        </div>
      </form>`);

    const amount = $('#txAmount', root);
    bindMoney(amount, tx ? tx.amount : 0);
    const unpaid = $('#txUnpaid', root);
    let unpaidTouched = !isNew;
    unpaid.addEventListener('change', () => { unpaidTouched = true; });
    // Data futura sugere "ainda não paguei"; parcela de dívida é controlada pela aba Dívidas.
    const paintBill = () => {
      $('#billField', root).hidden = type !== 'expense' || !!(tx && tx.debtId) || !!payCard;
      if (!unpaidTouched) unpaid.checked = ($('#txDate', root).value || '') > todayISO();
      const payField = $('#payField', root);
      if (payField) {
        payField.hidden = type !== 'expense' || !!(tx && (tx.debtId || tx.salaryKey));
        $$('#payChips .chip', root).forEach((c) => c.classList.toggle('active', c.dataset.card === payCard));
      }
      const card = type === 'expense' && payCard ? cardById(payCard) : null;
      $('#txDateLabel', root).textContent = card ? 'Data da compra' : 'Data';
      const buy = $('#txDate', root).value;
      const hint = $('#payHint', root);
      if (!card || !isISO(buy)) {
        hint.textContent = '';
        return;
      }
      const n = isNew && repeat === 'installments' ? repeatCount() : 1;
      const first = invoiceDue(card, buy, tx ? tx.cardOffset || 0 : 0);
      hint.textContent = n > 1
        ? `💳 ${n} parcelas nas faturas de ${monthYear(monthOf(first))} a ${monthYear(monthOf(invoiceDue(card, buy, n - 1)))}. O dinheiro sai no vencimento de cada fatura.`
        : `💳 Entra na fatura que vence em ${shortDate(first)} (fecha ${shortDate(closingOf(card, first))}). O dinheiro só sai nesse dia.`;
    };
    const payChips = $('#payChips', root);
    if (payChips) {
      payChips.addEventListener('click', (e) => {
        const c = e.target.closest('.chip');
        if (!c) return;
        payCard = c.dataset.card;
        paintBill();
      });
    }

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
      if (type !== 'expense') payCard = '';
      paintType();
      paintBill();
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

    paintBill();
    $('#txDate', root).addEventListener('change', paintBill);
    $('#txDate', root).addEventListener('input', paintBill);

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
        paintBill();
      });
      ['input', 'change'].forEach((ev) => {
        $('#txRepeat', root).addEventListener(ev, () => { updateRepeatHint(); paintBill(); });
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
      const card = type === 'expense' && payCard ? cardById(payCard) : null;
      const isUnpaid = type === 'expense' && unpaid.checked && !(tx && tx.debtId) && !card;
      // No cartão, a data gravada é o vencimento da fatura; a data da compra fica em buyDate.
      const toCard = (t, buy, offset) => {
        t.cardId = card.id;
        t.buyDate = buy;
        t.cardOffset = offset;
        t.date = invoiceDue(card, buy, offset);
        delete t.bill;
        delete t.paidAt;
      };
      const fromCard = (t) => {
        delete t.cardId;
        delete t.buyDate;
        delete t.cardOffset;
      };
      // Marca de pago: a primeira ocorrência segue a caixinha; as seguintes ficam a pagar.
      const markPaid = (t, first) => {
        delete t.paidAt;
        if (t.type !== 'expense' || t.debtId) return;
        if (first && !isUnpaid && (isBill(t) || t.date > todayISO())) t.paidAt = t.date <= todayISO() ? t.date : todayISO();
      };
      if (!isNew) {
        Object.assign(tx, { type, amount: cents, description, category, date });
        if (card) toCard(tx, date, tx.cardId === card.id ? tx.cardOffset || 0 : 0);
        else {
          fromCard(tx);
          if (isUnpaid) tx.bill = true;
          if (!tx.debtId) markPaid(tx, true);
        }
      } else if (repeat === 'single') {
        const t = { id: uid(), type, amount: cents, description, category, date, createdAt: Date.now() };
        if (card) toCard(t, date, 0);
        else if (isUnpaid) t.bill = true;
        state.transactions.push(t);
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
          // Parcelado no cartão: mesma compra em faturas seguidas. Todo mês no cartão: uma compra por mês.
          if (card) toCard(t, repeat === 'installments' ? date : addMonthsISO(date, i), repeat === 'installments' ? i : 0);
          else if (type === 'expense') markPaid(t, i === 0);
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
          : 'Excluir este lançamento?', buttons);
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
    let icon = goal ? toGoalIcon(goal.icon) : GOAL_ICONS[0];
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${isNew ? 'Nova meta' : 'Editar meta'}</h2>
      <form id="goalForm" class="form" novalidate>
        <div class="field"><label for="goalName">Nome da meta</label>
          <input id="goalName" maxlength="40" placeholder="Ex.: Reserva de emergência" value="${esc(goal ? goal.name : '')}" autocomplete="off"></div>
        <div class="field"><span class="label">Ícone</span>
          <div class="icon-grid" id="iconGrid" role="radiogroup" aria-label="Ícone da meta">${GOAL_ICON_LIST.map(([id, label]) => `<button type="button" role="radio" aria-checked="${id === icon}" data-icon="${id}" title="${label}" aria-label="${label}" class="${id === icon ? 'active' : ''}">${svgIcon(id)}<span>${label}</span></button>`).join('')}</div></div>
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
      $$('#iconGrid button', root).forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
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

  function openDebtSheet(debt) {
    const isNew = !debt;
    let icon = debt ? debt.icon : DEBT_TYPES[0].icon;
    let overdue = debt ? !!debt.overdue : false;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${isNew ? 'Cadastrar dívida' : 'Editar dívida'}</h2>
      <form id="debtForm" class="form" novalidate>
        ${isNew ? `<div class="segmented" id="debtKind">
          <button type="button" data-value="inst" class="active">📆 Parcelada</button>
          <button type="button" data-value="late">⚠️ Em atraso</button></div>` : ''}
        <div class="field"><span class="label" id="debtTypeLabel">Tipo</span>
          <div class="cat-grid" id="debtType" role="radiogroup" aria-labelledby="debtTypeLabel">${DEBT_TYPES.map((t) => `
            <button type="button" class="cat-btn${t.icon === icon ? ' active' : ''}" role="radio" aria-checked="${t.icon === icon}"
              data-icon="${t.icon}"><span aria-hidden="true">${t.icon}</span><span>${t.name}</span></button>`).join('')}</div></div>
        <div class="field"><label for="debtName">Nome (de quem é a dívida)</label>
          <input id="debtName" maxlength="40" placeholder="Ex.: Empréstimo Banco do Brasil" autocomplete="off" value="${esc(debt ? debt.name : '')}"></div>
        <div class="field"><label for="debtAmount" id="debtAmountLabel">Valor de cada parcela</label>
          <input id="debtAmount" class="money" inputmode="numeric" autocomplete="off"></div>
        <div class="field-row" data-inst>
          <div class="field"><label for="debtTotal">Total de parcelas</label>
            <input id="debtTotal" type="number" min="1" max="600" inputmode="numeric" placeholder="Ex.: 24" value="${debt ? debt.total : ''}"></div>
          <div class="field"><label for="debtPaid">Quantas já paguei</label>
            <input id="debtPaid" type="number" min="0" max="600" inputmode="numeric" value="${debt ? debt.paid : 0}"></div>
        </div>
        <div class="field"><label for="debtRate">Juros ao mês (opcional)</label>
          <input id="debtRate" inputmode="decimal" placeholder="Ex.: 2,99" autocomplete="off" value="${debt && debt.rate ? String(debt.rate).replace('.', ',') : ''}">
          <p class="hint">Veja no contrato ou no app do banco (“taxa de juros mensal”). Ajuda o plano a escolher por onde começar.</p></div>
        <div class="field" data-inst><label for="debtDue">Vencimento da próxima parcela</label>
          <input id="debtDue" type="date" value="${debt ? debt.nextDue : todayISO()}"></div>
        <div class="debt-preview" id="debtPreview" aria-live="polite" data-inst></div>
        <label class="check" data-inst><input type="checkbox" id="debtLinked"${!debt || debt.linked ? ' checked' : ''}>
          <span>Colocar as parcelas no extrato de cada mês (assim elas entram no “quanto posso gastar por dia”)</span></label>
        <p class="hint" data-inst>No dia do vencimento, o app conta a parcela como paga. Se pagar antes, toque em “Paguei esta parcela”.</p>
        <p class="hint" data-late hidden>Informe o valor total que você deve hoje, como aparece no Serasa ou no app do banco. Depois cadastre as propostas de desconto em “💬 Proposta”.</p>
        <div class="actions">
          <button class="btn primary block" type="submit">Salvar dívida</button>
          ${isNew ? '' : '<button class="btn danger block" type="button" id="delDebt">Excluir dívida</button><div id="confirmSlot"></div>'}
        </div>
      </form>`);

    const amount = $('#debtAmount', root);
    bindMoney(amount, debt ? debt.amount : 0);
    const num = (id) => parseInt($(`#${id}`, root).value, 10);

    // Parcelada x em atraso: esconde o que não vale para cada tipo.
    function applyKind() {
      $$('[data-inst]', root).forEach((el) => { el.hidden = overdue; });
      $$('[data-late]', root).forEach((el) => { el.hidden = !overdue; });
      $('#debtAmountLabel', root).textContent = overdue ? 'Valor total que você deve hoje' : 'Valor de cada parcela';
      if (overdue) $('#debtName', root).placeholder = 'Ex.: Banco do Brasil';
      else $('#debtName', root).placeholder = 'Ex.: Empréstimo Banco do Brasil';
    }
    const kindSeg = $('#debtKind', root);
    if (kindSeg) {
      kindSeg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        overdue = b.dataset.value === 'late';
        $$('#debtKind button', root).forEach((x) => x.classList.toggle('active', x === b));
        applyKind();
      });
    }

    function preview() {
      if (overdue) return;
      const a = centsOf(amount);
      const total = num('debtTotal');
      const paid = num('debtPaid') || 0;
      const due = $('#debtDue', root).value;
      const box = $('#debtPreview', root);
      if (!a || !total || total < 1) {
        box.innerHTML = '<p>Preencha o valor da parcela e o total de parcelas para ver a conta.</p>';
        return;
      }
      if (paid > total) {
        box.innerHTML = '<p>⚠ Você pagou mais parcelas do que o total. Confira os números.</p>';
        return;
      }
      const left = total - paid;
      const lines = [
        `📋 <strong>${total} parcelas de ${fmtMoney(a)}</strong> = ${fmtMoney(a * total)} no total`,
        `✅ Já pago: ${paid} ${paid === 1 ? 'parcela' : 'parcelas'} (${fmtMoney(a * paid)})`,
        left ? `⏳ <strong>Faltam ${left} ${left === 1 ? 'parcela' : 'parcelas'}: ${fmtMoney(a * left)}</strong>` : '🎉 <strong>Dívida quitada!</strong>',
      ];
      if (left && isISO(due)) {
        lines.push(`➡️ Próxima: parcela ${paid + 1} de ${total}, em ${shortDate(due)}`);
        lines.push(`🏁 Última parcela em ${monthYear(shiftMonth(monthOf(due), left - 1))}`);
      }
      box.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    }
    preview();
    applyKind();
    ['input', 'change'].forEach((ev) => {
      ['debtTotal', 'debtPaid', 'debtDue'].forEach((id) => $(`#${id}`, root).addEventListener(ev, preview));
      amount.addEventListener(ev, preview);
    });

    $('#debtType', root).addEventListener('click', (e) => {
      const b = e.target.closest('.cat-btn');
      if (!b) return;
      icon = b.dataset.icon;
      $$('#debtType .cat-btn', root).forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
    });

    $('#debtForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#debtName', root).value.trim();
      const a = centsOf(amount);
      const total = num('debtTotal');
      const paid = num('debtPaid') || 0;
      const due = $('#debtDue', root).value;
      const fail = (msg, id) => { toast(msg); $(`#${id}`, root).focus(); };
      if (!name) return fail('Dê um nome para a dívida, ex.: Empréstimo Nubank.', 'debtName');
      if (a <= 0) return fail(overdue ? 'Digite o valor total que você deve.' : 'Digite o valor de cada parcela.', 'debtAmount');
      if (overdue) {
        const today = todayISO();
        const late = { name, icon, amount: a, total: 1, paid: 0, rate: null, nextDue: today, dueDay: Number(today.slice(8, 10)), linked: false, overdue: true };
        if (isNew) state.debts.push({ id: uid(), createdAt: Date.now(), advanced: 0, offers: [], ...late });
        else Object.assign(debt, { name, icon, amount: a });
        syncDebtTx(isNew ? state.debts[state.debts.length - 1] : debt);
        save();
        closeSheet();
        render();
        toast(isNew ? 'Dívida em atraso cadastrada' : 'Dívida atualizada');
        return;
      }
      if (!total || total < 1 || total > 600) return fail('Digite o total de parcelas (de 1 a 600).', 'debtTotal');
      if (paid < 0 || paid > total) return fail('As parcelas pagas não podem passar do total.', 'debtPaid');
      if (!isISO(due)) return fail('Escolha a data de vencimento da próxima parcela.', 'debtDue');
      const rateRaw = $('#debtRate', root).value.trim().replace('%', '').replace(',', '.');
      const rate = rateRaw ? Number(rateRaw) : null;
      if (rateRaw && !(rate > 0 && rate <= 30)) return fail('Juros ao mês: use um número como 2,99 (entre 0 e 30).', 'debtRate');
      const data = {
        name, icon, amount: a, total, paid, rate: rate ? Math.round(rate * 100) / 100 : null,
        nextDue: due, dueDay: Number(due.slice(8, 10)), linked: $('#debtLinked', root).checked,
      };
      let d = debt;
      if (isNew) {
        d = { id: uid(), createdAt: Date.now(), advanced: 0, offers: [], ...data };
        state.debts.push(d);
      } else {
        Object.assign(d, data);
        d.advanced = Math.min(d.advanced || 0, d.total - d.paid);
      }
      syncDebtTx(d);
      advanceDebts();
      save();
      closeSheet();
      render();
      toast(isNew ? 'Dívida cadastrada' : 'Dívida atualizada');
    });

    if (!isNew) {
      $('#delDebt', root).addEventListener('click', () => {
        confirmBox($('#confirmSlot', root), 'Excluir esta dívida? As parcelas que ainda não venceram saem do extrato. As já pagas continuam lá.', [
          { label: 'Cancelar', onClick: () => { $('#confirmSlot', root).innerHTML = ''; } },
          {
            label: 'Excluir', cls: 'danger', onClick: () => {
              const before = { debts: state.debts.slice(), transactions: state.transactions.slice() };
              state.debts = state.debts.filter((x) => x.id !== debt.id);
              state.transactions = state.transactions.filter((t) => !(t.debtId === debt.id && t.debtNo > debt.paid));
              save();
              closeSheet();
              render();
              toast('Dívida excluída', {
                label: 'Desfazer',
                run: () => {
                  Object.assign(state, before);
                  save();
                  render();
                  toast('Dívida restaurada');
                },
              });
            },
          },
        ]);
      });
    }
    if (isNew) $('#debtName', root).focus();
  }

  function openOfferSheet(d) {
    const remaining = leftOf(d) * d.amount;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">💬 Proposta de quitação</h2>
      <form id="offerForm" class="form" novalidate>
        <p class="hint"><strong>${esc(d.name)}</strong>: hoje falta pagar <strong class="num">${fmtMoney(remaining)}</strong> (${leftOf(d)} ${leftOf(d) === 1 ? 'parcela' : 'parcelas'} de ${fmtMoney(d.amount)}).</p>
        <div class="field"><label for="offerValue">Valor da proposta para quitar à vista</label>
          <input id="offerValue" class="money" inputmode="numeric" autocomplete="off"></div>
        <div class="field-row">
          <div class="field"><label for="offerUntil">Válida até (opcional)</label>
            <input id="offerUntil" type="date" min="${todayISO()}"></div>
          <div class="field"><label for="offerNote">De onde veio</label>
            <input id="offerNote" maxlength="40" placeholder="Ex.: app do banco" autocomplete="off"></div>
        </div>
        <div class="debt-preview" id="offerPreview" aria-live="polite"></div>
        <p class="hint">⚠ <strong>Cuidado com golpes:</strong> só aceite propostas pelos canais oficiais (app ou site do banco, Serasa Limpa Nome). Nunca pague boleto recebido por WhatsApp ou SMS sem conferir no app do banco.</p>
        <button class="btn primary block" type="submit">Salvar proposta</button>
      </form>`);
    const input = $('#offerValue', root);
    bindMoney(input, 0);
    const preview = () => {
      const v = centsOf(input);
      const box = $('#offerPreview', root);
      if (!v) {
        box.innerHTML = '<p>Digite o valor que o banco ofereceu para quitar.</p>';
        return;
      }
      if (v >= remaining) {
        box.innerHTML = `<p>⚠ Essa proposta não tem desconto: é igual ou maior que o que falta (${fmtMoney(remaining)}).</p>`;
        return;
      }
      const pct = Math.floor(((remaining - v) / remaining) * 100);
      const g = offerGrade(pct);
      box.innerHTML = `<p>Sem a proposta: <strong>${fmtMoney(remaining)}</strong></p>
        <p>Com a proposta: <strong>${fmtMoney(v)}</strong> à vista</p>
        <p>💰 Você economiza <strong>${fmtMoney(remaining - v)} (${pct}%)</strong> <span class="badge ${g.cls}">${g.label}</span></p>`;
    };
    preview();
    input.addEventListener('input', preview);
    $('#offerForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const value = centsOf(input);
      if (!value) {
        toast('Digite o valor da proposta.');
        input.focus();
        return;
      }
      const until = $('#offerUntil', root).value;
      if (!d.offers) d.offers = [];
      d.offers.push({ id: uid(), value, remaining, date: todayISO(), until: isISO(until) ? until : '', note: $('#offerNote', root).value.trim() });
      save();
      closeSheet();
      render();
      toast('Proposta salva');
    });
    input.focus();
  }

  function openAcceptOffer(d, o) {
    const remaining = leftOf(d) * d.amount;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">✓ Quitar ${esc(d.name)}</h2>
      <div class="debt-preview">
        <p>Você paga <strong>${fmtMoney(o.value)}</strong> à vista e a dívida fica quitada.</p>
        <p>💰 Economia de <strong>${fmtMoney(Math.max(0, remaining - o.value))}</strong> sobre o que faltava (${fmtMoney(remaining)}).</p>
      </div>
      <p class="hint">As parcelas futuras saem do extrato e o pagamento de ${fmtMoney(o.value)} entra hoje como despesa. Guarde o comprovante e o termo de quitação do banco.</p>
      <div class="actions">
        <button class="btn primary block" type="button" id="acceptYes">✓ Paguei, quitar a dívida</button>
        <button class="btn block" type="button" id="acceptNo">Ainda não</button>
      </div>`);
    $('#acceptNo', root).addEventListener('click', closeSheet);
    $('#acceptYes', root).addEventListener('click', () => {
      const before = { debt: JSON.parse(JSON.stringify(d)), transactions: state.transactions.slice() };
      d.settled = { value: o.value, saved: Math.max(0, remaining - o.value), date: todayISO() };
      d.advanced = d.total - d.paid;
      syncDebtTx(d);
      state.transactions.push({
        id: uid(), type: 'expense', category: 'dividas', amount: o.value, description: `Quitação: ${d.name}`.slice(0, 60),
        date: todayISO(), createdAt: Date.now(),
      });
      save();
      closeSheet();
      render();
      confetti();
      toast('Dívida quitada! 🎉', {
        label: 'Desfazer',
        run: () => {
          Object.assign(d, before.debt);
          delete d.settled;
          if (before.debt.settled) d.settled = before.debt.settled;
          state.transactions = before.transactions;
          save();
          render();
          toast('Quitação desfeita');
        },
      });
    });
  }

  // Antecipar: o banco tira as últimas parcelas; registra o valor pago hoje.
  function openAdvanceSheet(d) {
    const left = leftOf(d);
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">⏩ Antecipar parcelas</h2>
      <form id="advForm" class="form" novalidate>
        <p class="hint"><strong>${esc(d.name)}</strong>: faltam ${left} ${left === 1 ? 'parcela' : 'parcelas'} de ${fmtMoney(d.amount)}.</p>
        <div class="field-row">
          <div class="field"><label for="advCount">Quantas parcelas antecipei</label>
            <input id="advCount" type="number" min="1" max="${left}" inputmode="numeric" value="1"></div>
          <div class="field"><label for="advValue">Quanto paguei</label>
            <input id="advValue" class="money" inputmode="numeric" autocomplete="off"></div>
        </div>
        <div class="debt-preview" id="advPreview" aria-live="polite"></div>
        <p class="hint">Peça a antecipação pelo app ou site oficial do banco. Normalmente ele tira as últimas parcelas e dá desconto dos juros: coloque em “Quanto paguei” o valor com desconto.</p>
        <button class="btn primary block" type="submit">Registrar antecipação</button>
      </form>`);
    const countEl = $('#advCount', root);
    const valueEl = $('#advValue', root);
    const count = () => Math.min(left, Math.max(1, parseInt(countEl.value, 10) || 1));
    bindMoney(valueEl, d.amount);
    let touched = false;
    valueEl.addEventListener('beforeinput', () => { touched = true; });
    const preview = () => {
      const n = count();
      if (!touched) {
        valueEl.dataset.cents = String(n * d.amount);
        valueEl.value = fmtMoney(n * d.amount);
      }
      const v = centsOf(valueEl);
      const rest = left - n;
      const disc = n * d.amount - v;
      $('#advPreview', root).innerHTML = `<p>Depois disso faltam <strong>${rest} ${rest === 1 ? 'parcela' : 'parcelas'}</strong>${rest
        ? ` e a última fica para <strong>${monthYear(shiftMonth(monthOf(d.nextDue), rest - 1))}</strong>` : ': <strong>dívida quitada! 🎉</strong>'}.</p>
        ${disc > 0 ? `<p>💰 Desconto de <strong>${fmtMoney(disc)}</strong> nos juros.</p>` : ''}`;
    };
    preview();
    countEl.addEventListener('input', preview);
    valueEl.addEventListener('input', preview);
    $('#advForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const n = count();
      const v = centsOf(valueEl);
      if (!v) {
        toast('Digite quanto você pagou.');
        valueEl.focus();
        return;
      }
      const before = { advanced: d.advanced };
      const txId = uid();
      d.advanced += n;
      syncDebtTx(d);
      state.transactions.push({
        id: txId, type: 'expense', category: 'dividas', amount: v,
        description: `Antecipação: ${d.name} (${n} ${n === 1 ? 'parcela' : 'parcelas'})`.slice(0, 60), date: todayISO(), createdAt: Date.now(),
      });
      save();
      closeSheet();
      render();
      if (leftOf(d) <= 0) confetti();
      toast(leftOf(d) ? `${n} ${n === 1 ? 'parcela antecipada' : 'parcelas antecipadas'}. Faltam ${leftOf(d)}.` : 'Dívida quitada! 🎉', {
        label: 'Desfazer',
        run: () => {
          d.advanced = before.advanced;
          state.transactions = state.transactions.filter((t) => t.id !== txId);
          syncDebtTx(d);
          save();
          render();
          toast('Antecipação desfeita');
        },
      });
    });
  }

  // "Paguei esta parcela": conta a parcela como paga e, se ela estava no extrato
  // com data futura, traz o lançamento para hoje.
  function payDebt(d) {
    const before = { paid: d.paid, nextDue: d.nextDue };
    const tx = state.transactions.find((t) => t.debtId === d.id && t.debtNo === d.paid + 1);
    const txDate = tx ? tx.date : null;
    if (tx && tx.date > todayISO()) tx.date = todayISO();
    d.paid += 1;
    d.nextDue = dueIn(shiftMonth(monthOf(d.nextDue), 1), d.dueDay);
    save();
    render();
    const left = leftOf(d);
    toast(left ? `Parcela ${d.paid} de ${d.total} paga. Faltam ${left}.` : 'Última parcela paga. Dívida quitada! 🎉', {
      label: 'Desfazer',
      run: () => {
        Object.assign(d, before);
        if (tx) tx.date = txDate;
        save();
        render();
        toast('Pagamento desfeito');
      },
    });
  }

  function openSalarySheet() {
    const sal = state.salary;
    const isNew = !sal;
    const p1 = sal ? sal.paydays[0] : { day: 15, amount: 0 };
    const p2 = sal ? sal.paydays[1] || { day: '', amount: 0 } : { day: 30, amount: 0 };
    const today = todayISO();
    const cur = currentMonth();
    const manual = sum(txOfMonth(cur).filter((t) => t.type === 'income' && t.category === 'salario' && !t.salaryKey).map((t) => t.amount));
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">💼 Meu salário</h2>
      <form id="salaryForm" class="form" novalidate>
        <p class="hint">Informe os dias em que você recebe. O app lança o salário sozinho todo mês e mostra quanto você pode gastar por dia até o próximo pagamento.</p>
        <div class="pay-box">
          <p class="pay-title">1º pagamento</p>
          <div class="field-row">
            <div class="field"><label for="payDay1">Dia</label>
              <input id="payDay1" type="number" min="1" max="31" inputmode="numeric" value="${p1.day}"></div>
            <div class="field"><label for="payAmt1">Valor</label>
              <input id="payAmt1" inputmode="numeric" autocomplete="off"></div>
          </div>
        </div>
        <div class="pay-box">
          <p class="pay-title">2º pagamento <small>(deixe o dia vazio se recebe só uma vez)</small></p>
          <div class="field-row">
            <div class="field"><label for="payDay2">Dia</label>
              <input id="payDay2" type="number" min="1" max="31" inputmode="numeric" value="${p2.day}"></div>
            <div class="field"><label for="payAmt2">Valor</label>
              <input id="payAmt2" inputmode="numeric" autocomplete="off"></div>
          </div>
        </div>
        <p class="hint">Não sabe o valor exato ainda? Pode deixar R$ 0,00: o app usa só as datas e você lança o valor quando receber.</p>
        <label class="check"><input type="checkbox" id="payWeekend"${!sal || sal.weekendBefore ? ' checked' : ''}>
          <span>Se o dia cair no sábado ou domingo, recebo na sexta antes</span></label>
        ${isNew ? `<label class="check"><input type="checkbox" id="payPast"${manual ? '' : ' checked'}>
          <span>Lançar também os pagamentos deste mês que já caíram</span></label>
          ${manual ? `<p class="hint">⚠ Você já lançou ${fmtMoney(manual)} de salário neste mês. Deixe a opção acima desmarcada para não contar duas vezes.</p>` : ''}` : ''}
        <div class="debt-preview" id="salaryPreview" aria-live="polite"></div>
        <div class="actions">
          <button class="btn primary block" type="submit">Salvar</button>
          ${isNew ? '' : '<button class="btn danger block" type="button" id="removeSalary">Parar de lançar o salário</button><div id="confirmSlot"></div>'}
        </div>
      </form>`);
    const a1 = $('#payAmt1', root);
    const a2 = $('#payAmt2', root);
    bindMoney(a1, p1.amount);
    bindMoney(a2, p2.amount);
    const dayOf = (id) => {
      const v = parseInt($(`#${id}`, root).value, 10);
      return v >= 1 && v <= 31 ? v : null;
    };
    const read = () => {
      const paydays = [];
      if (dayOf('payDay1')) paydays.push({ day: dayOf('payDay1'), amount: centsOf(a1) });
      if (dayOf('payDay2')) paydays.push({ day: dayOf('payDay2'), amount: centsOf(a2) });
      return paydays.sort((x, y) => x.day - y.day);
    };
    function preview() {
      const paydays = read();
      const box = $('#salaryPreview', root);
      if (!paydays.length) {
        box.innerHTML = '<p>Informe pelo menos um dia de pagamento.</p>';
        return;
      }
      const weekend = $('#payWeekend', root).checked;
      const total = sum(paydays.map((p) => p.amount));
      const lines = paydays.map((p) => {
        const d = payDate(cur, p.day, weekend);
        const nd = d > today ? d : payDate(shiftMonth(cur, 1), p.day, weekend);
        return `📅 Dia ${p.day}${p.amount ? `: <strong>${fmtMoney(p.amount)}</strong>` : ''} · próximo em ${shortDate(nd)}`;
      });
      if (total) lines.push(`💰 Total por mês: <strong>${fmtMoney(total)}</strong>`);
      box.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    }
    preview();
    ['input', 'change'].forEach((ev) => ['payDay1', 'payDay2', 'payAmt1', 'payAmt2', 'payWeekend']
      .forEach((id) => $(`#${id}`, root).addEventListener(ev, preview)));

    $('#salaryForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const paydays = read();
      if (!paydays.length) {
        toast('Informe pelo menos um dia de pagamento (1 a 31).');
        $('#payDay1', root).focus();
        return;
      }
      if (paydays.length === 2 && paydays[0].day === paydays[1].day) {
        toast('Os dois pagamentos estão no mesmo dia. Junte os valores num só.');
        return;
      }
      const past = $('#payPast', root);
      state.salary = {
        paydays,
        weekendBefore: $('#payWeekend', root).checked,
        generatedUntil: '',
        startYM: sal ? sal.startYM : cur,
      };
      rebuildSalary(isNew && past ? past.checked : false);
      save();
      closeSheet();
      render();
      toast(isNew ? 'Salário configurado 💼' : 'Salário atualizado');
    });

    const rm = $('#removeSalary', root);
    if (rm) {
      rm.addEventListener('click', () => confirmBox($('#confirmSlot', root),
        'Parar de lançar o salário automaticamente? Os pagamentos que já caíram continuam no extrato.', [
          { label: 'Cancelar', onClick: () => { $('#confirmSlot', root).innerHTML = ''; } },
          {
            label: 'Parar', cls: 'danger', onClick: () => {
              state.salary = null;
              rebuildSalary(false);
              save();
              closeSheet();
              render();
              toast('Salário automático desligado');
            },
          },
        ]));
    }
  }

  function openDepositSheet(goal) {
    let mode = 'in';
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">${goalIconHTML(goal.icon)} ${esc(goal.name)}</h2>
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
    const empty = !state.transactions.length && !state.goals.length && !state.debts.length && !state.salary && !state.cards.length;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const lockOpt = (v, label) => `<option value="${v}"${state.settings.lockAfter === v ? ' selected' : ''}>${label}</option>`;
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">Configurações</h2>
      ${standalone ? '' : `<p class="eyebrow settings-section">Instalar no celular</p>
      ${installPrompt ? '<button class="btn primary block" type="button" id="installBtn">Instalar o app</button>' : ''}
      <ol class="install-steps">
        <li><strong>iPhone (Safari):</strong> botão Compartilhar → “Adicionar à Tela de Início”.</li>
        <li><strong>Android (Chrome):</strong> menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”.</li>
      </ol>`}

      <div class="settings-list">
        <button class="btn primary" type="button" id="setupBtn">📥 Colar código do assistente</button>
      </div>

      <p class="eyebrow settings-section">Meu salário</p>
      <div class="settings-list">
        <button class="btn" type="button" id="salaryBtn">💼 ${state.salary ? `Recebo nos ${esc(salaryLabel())} · Editar` : 'Configurar meu salário'}</button>
      </div>

      <p class="eyebrow settings-section">Aparência</p>
      <div class="settings-list">
        <div class="segmented three" id="themeMode" role="radiogroup" aria-label="Modo">${THEME_MODES.map(([id, label]) =>
          `<button type="button" role="radio" aria-checked="${theme.mode === id}" data-mode="${id}" class="${theme.mode === id ? 'active' : ''}">${label}</button>`).join('')}</div>
        <div class="field"><span class="label" id="accentLabel">Cor do app</span>
          <div class="swatches" id="themeAccent" role="radiogroup" aria-labelledby="accentLabel">${ACCENTS.map(([id, label, color]) =>
            `<button type="button" role="radio" aria-checked="${theme.accent === id}" aria-label="${label}" title="${label}" data-accent="${id}" class="${theme.accent === id ? 'active' : ''}" style="--sw:${color}"><span></span></button>`).join('')}</div></div>
        <p class="hint">“Automático” segue o modo do iPhone. A aparência vale só neste aparelho.</p>
      </div>

      <p class="eyebrow settings-section">Cartões de crédito</p>
      <div class="settings-list">
        ${state.cards.map((c) => `<button class="btn" type="button" data-card-edit="${esc(c.id)}">💳 ${esc(c.name)} · fecha dia ${c.closingDay}, vence dia ${c.dueDay}</button>`).join('')}
        <button class="btn" type="button" id="addCard">+ Adicionar cartão</button>
      </div>

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
      <p class="hint" style="margin-bottom:8px">Último backup: <strong>${esc(lastBackupText())}</strong>.
        No iPhone, escolha “Salvar em Arquivos” → iCloud Drive: o iCloud guarda na nuvem sozinho.${cryptoKey ? ' O backup sai protegido com o seu PIN.' : ''}</p>
      <label class="check" style="margin-bottom:8px"><input type="checkbox" id="backupDaily"${state.settings.backupDaily ? ' checked' : ''}>
        <span>Lembrar todo dia de fazer backup</span></label>
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

      <p class="eyebrow settings-section">Sobre o app</p>
      <p class="hint" style="margin-bottom:8px">Meu Bolso ${currentInfo ? `versão <strong>${esc(currentInfo.version)}</strong>` : ''}.
        Dica: puxe a tela para baixo para procurar atualização.</p>
      <div class="settings-list">
        <button class="btn" type="button" id="checkUpdate">🔄 Procurar atualização</button>
        ${currentInfo && currentInfo.notes ? '<button class="btn" type="button" id="seeNews">✨ Ver novidades desta versão</button>' : ''}
      </div>

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
    on('salaryBtn', openSalarySheet);
    $('#themeMode', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      saveTheme({ ...theme, mode: b.dataset.mode });
      $$('#themeMode button', root).forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
    });
    $('#themeAccent', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-accent]');
      if (!b) return;
      saveTheme({ ...theme, accent: b.dataset.accent });
      $$('#themeAccent button', root).forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
    });
    on('setupBtn', openSetupSheet);
    on('addCard', () => openCardSheet());
    $$('[data-card-edit]', root).forEach((b) => b.addEventListener('click', () => openCardSheet(cardById(b.dataset.cardEdit))));
    on('checkUpdate', () => {
      closeSheet();
      checkForUpdate();
    });
    on('seeNews', () => showWhatsNew(currentInfo, false));
    on('createPin', () => openPinSheet('create'));
    on('changePin', () => openPinSheet('change'));
    on('removePin', () => openPinSheet('remove'));
    on('lockNow', () => lock());
    $('#backupDaily', root).addEventListener('change', (e) => {
      state.settings.backupDaily = e.target.checked;
      save();
      render();
    });
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

  // ---------- Código do assistente ----------
  // Texto em JSON que o assistente monta com o que a pessoa contou no chat.
  // Só adiciona ou atualiza dados; nunca apaga nada. Tudo passa pela mesma validação do app.

  const OPEN_INVOICE_DESC = 'Fatura em aberto (compras anteriores)';

  // Lança o valor da fatura que já estava aberta como uma compra só, na fatura que vence primeiro a partir de hoje.
  function addOpenInvoice(c, amount) {
    const today = todayISO();
    let invDue = invoiceDue(c, today, -1);
    if (invDue < today) invDue = invoiceDue(c, today, 0);
    const close = closingOf(c, invDue);
    const buy = today < close ? today : isoOf(new Date(parseISO(close).getTime() - 864e5));
    state.transactions.push({
      id: uid(), type: 'expense', category: 'outros', amount, description: OPEN_INVOICE_DESC,
      cardId: c.id, buyDate: buy, cardOffset: 0, date: invoiceDue(c, buy, 0), createdAt: Date.now(),
    });
  }

  function parseSetupCode(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const o = start >= 0 && end > start ? parseJSON(text.slice(start, end + 1)) : null;
    if (!o || o.meubolso !== 'add') throw new Error('código inválido');
    const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
    const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
    const items = [];
    for (const c of (Array.isArray(o.cards) ? o.cards : []).slice(0, 5)) {
      const name = str(c && c.name, 30);
      const dueDay = int(c && c.dueDay, 1, 31);
      const closingDay = int(c && c.closingDay, 1, 31) || (dueDay ? ((dueDay - 8 + 31) % 31) + 1 : null);
      if (!name || !dueDay || closingDay === dueDay) continue;
      items.push({ kind: 'card', name, dueDay, closingDay, limit: int(c.limit, 0, MAX_CENTS) || 0, openInvoice: int(c.openInvoice, 0, MAX_CENTS) || 0 });
    }
    if (o.salary && Array.isArray(o.salary.paydays)) {
      const paydays = o.salary.paydays.slice(0, 2)
        .map((p) => ({ day: int(p && p.day, 1, 31), amount: int(p && p.amount, 0, MAX_CENTS) || 0 }))
        .filter((p) => p.day).sort((a, b) => a.day - b.day);
      if (paydays.length) items.push({ kind: 'salary', paydays, weekendBefore: o.salary.weekendBefore !== false, includePast: !!o.salary.includePast });
    }
    for (const d of (Array.isArray(o.debts) ? o.debts : []).slice(0, 20)) {
      const name = str(d && d.name, 40);
      const amount = int(d && d.amount, 1, MAX_CENTS);
      const overdue = !!(d && d.overdue === true);
      const total = overdue ? 1 : int(d && d.total, 1, 600);
      if (!name || !amount || !total || (!overdue && !isISO(d.nextDue))) continue;
      const rate = Number.isFinite(d.rate) && d.rate > 0 && d.rate <= 30 ? Math.round(d.rate * 100) / 100 : null;
      const offers = (Array.isArray(d.offers) ? d.offers : []).slice(0, 5).map((o) => ({
        value: int(o && o.value, 1, MAX_CENTS), remaining: int(o && o.remaining, 1, MAX_CENTS) || amount,
        until: o && isISO(o.until) ? o.until : '', note: str(o && o.note, 40),
      })).filter((o) => o.value);
      items.push({
        kind: 'debt', name, amount, total, overdue, offers, paid: overdue ? 0 : Math.min(int(d.paid, 0, 600) || 0, total),
        nextDue: isISO(d.nextDue) ? d.nextDue : todayISO(), rate,
        icon: DEBT_TYPES.some((t) => t.icon === d.icon) ? d.icon : DEBT_TYPES[0].icon,
      });
    }
    for (const b of (Array.isArray(o.bills) ? o.bills : []).slice(0, 30)) {
      const name = str(b && b.name, 60);
      const amount = int(b && b.amount, 1, MAX_CENTS);
      const day = int(b && b.day, 1, 31);
      if (!name || !amount || !day) continue;
      items.push({ kind: 'bill', name, amount, day, category: CATEGORIES.expense.some((c) => c.id === b.category) ? b.category : 'contas' });
    }
    if (!items.length) throw new Error('nada para adicionar');
    return items;
  }

  function describeSetupItem(it) {
    if (it.kind === 'card') {
      const exists = state.cards.some((c) => c.name.toLowerCase() === it.name.toLowerCase());
      return `💳 <strong>${esc(it.name)}</strong>${exists ? ' (atualizar)' : ''}: fecha dia ${it.closingDay}, vence dia ${it.dueDay}${it.limit ? `, limite ${fmtMoney(it.limit)}` : ''}${it.openInvoice ? `<br>Fatura em aberto: <strong>${fmtMoney(it.openInvoice)}</strong>` : ''}`;
    }
    if (it.kind === 'salary') return `💼 <strong>Salário</strong>: ${it.paydays.map((p) => `dia ${p.day}${p.amount ? ` (${fmtMoney(p.amount)})` : ''}`).join(' e ')}`;
    if (it.kind === 'debt' && it.overdue) {
      return `⚠️ <strong>${esc(it.name)}</strong>: em atraso, ${fmtMoney(it.amount)}${it.offers.map((o) => `<br>&nbsp;&nbsp;💬 proposta ${fmtMoney(o.value)}${o.remaining > o.value ? ` (−${Math.floor(((o.remaining - o.value) / o.remaining) * 100)}%)` : ''}`).join('')}`;
    }
    if (it.kind === 'debt') return `${it.icon} <strong>${esc(it.name)}</strong>: ${it.total} parcelas de ${fmtMoney(it.amount)}, ${it.paid} pagas, próxima em ${shortDate(it.nextDue)}${it.offers.length ? `, ${it.offers.length} proposta(s)` : ''}`;
    return `📅 <strong>${esc(it.name)}</strong>: ${fmtMoney(it.amount)} todo mês, dia ${it.day}`;
  }

  function applySetup(items) {
    const today = todayISO();
    for (const it of items) {
      if (it.kind === 'card') {
        let c = state.cards.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
        if (c) {
          Object.assign(c, { name: it.name, closingDay: it.closingDay, dueDay: it.dueDay, limit: it.limit || c.limit });
          recomputeCardTx(c);
        } else {
          c = { id: uid(), name: it.name, closingDay: it.closingDay, dueDay: it.dueDay, limit: it.limit, paid: [], createdAt: Date.now() };
          state.cards.push(c);
        }
        // Colar o mesmo código duas vezes não duplica a fatura.
        if (it.openInvoice && !state.transactions.some((t) => t.cardId === c.id && t.description === OPEN_INVOICE_DESC)) addOpenInvoice(c, it.openInvoice);
      } else if (it.kind === 'salary') {
        state.salary = { paydays: it.paydays, weekendBefore: it.weekendBefore, generatedUntil: '', startYM: state.salary ? state.salary.startYM : currentMonth() };
        rebuildSalary(it.includePast);
      } else if (it.kind === 'debt') {
        let d = state.debts.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
        const data = { name: it.name, icon: it.icon, amount: it.amount, total: it.total, paid: it.paid, rate: it.rate, nextDue: it.nextDue, dueDay: Number(it.nextDue.slice(8, 10)), overdue: it.overdue, linked: !it.overdue };
        if (d && d.settled) continue;
        if (d) Object.assign(d, data);
        else {
          d = { id: uid(), createdAt: Date.now(), advanced: 0, offers: [], ...data };
          state.debts.push(d);
        }
        if (!d.offers) d.offers = [];
        for (const o of it.offers) {
          const dup = d.offers.some((x) => x.value === o.value && x.until === o.until);
          if (!dup) d.offers.push({ id: uid(), value: o.value, remaining: o.remaining, date: today, until: o.until, note: o.note });
        }
        syncDebtTx(d);
      } else if (it.kind === 'bill') {
        if (state.transactions.some((t) => t.recurring && t.description.toLowerCase() === it.name.toLowerCase() && t.date >= today)) continue;
        const thisMonth = dueIn(currentMonth(), it.day);
        const first = thisMonth >= today ? thisMonth : dueIn(shiftMonth(currentMonth(), 1), it.day);
        const groupId = uid();
        for (let i = 0; i < 12; i++) {
          state.transactions.push({
            id: uid(), type: 'expense', amount: it.amount, description: it.name, category: it.category, groupId, recurring: true,
            date: dueIn(shiftMonth(monthOf(first), i), it.day), createdAt: Date.now() + i,
          });
        }
      }
    }
    advanceDebts();
  }

  function openSetupSheet() {
    const root = openSheet(`<h2 class="sheet-title" id="sheetTitle">📥 Código do assistente</h2>
      <p class="hint">Cole aqui o código que o assistente te mandou no chat. Ele só adiciona ou atualiza dados; nada é apagado.</p>
      <textarea id="setupCode" class="backup-text" placeholder="Toque e segure aqui, depois escolha Colar" aria-label="Código do assistente"></textarea>
      <div class="actions" style="margin-top:10px">
        <button class="btn primary block" type="button" id="readSetup">Ler código</button>
      </div>
      <div id="setupSlot"></div>`);
    $('#readSetup', root).addEventListener('click', () => {
      let items;
      try {
        items = parseSetupCode($('#setupCode', root).value);
      } catch {
        toast('Não reconheci esse código. Copie de novo o código inteiro do chat.');
        return;
      }
      $('#setupSlot', root).innerHTML = `<div class="debt-preview" style="margin-top:12px">
          <p><strong>Vou adicionar:</strong></p>${items.map((it) => `<p>${describeSetupItem(it)}</p>`).join('')}</div>
        <div class="actions" style="margin-top:10px">
          <button class="btn primary block" type="button" id="applySetup">✓ Adicionar ao app</button>
        </div>`;
      $('#applySetup', root).addEventListener('click', () => {
        applySetup(items);
        save();
        closeSheet();
        ui.tab = 'home';
        ui.month = currentMonth();
        render();
        window.scrollTo(0, 0);
        toast('Pronto! Dados adicionados ✓');
      });
    });
    $('#setupCode', root).focus();
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
      { id: uid(), name: 'Reserva de emergência', icon: 'shield', target: 1200000, saved: 360000, deadline: shiftMonth(cur, 18), createdAt: Date.now() },
      { id: uid(), name: 'Moto nova', icon: 'moto', target: 1500000, saved: 210000, deadline: shiftMonth(cur, 24), createdAt: Date.now() },
    ];
    // Próximo vencimento a partir de hoje para o dia informado.
    const nextOn = (day) => dueIn(Number(today.slice(8, 10)) > day ? shiftMonth(cur, 1) : cur, day);
    s.debts = [
      { id: uid(), name: 'Empréstimo pessoal', icon: '🏦', amount: 38990, total: 12, paid: 4, advanced: 0, rate: 3.5, offers: [], dueDay: 15, nextDue: nextOn(15), linked: true, createdAt: Date.now() },
      { id: uid(), name: 'Celular parcelado', icon: '💳', amount: 15990, total: 10, paid: 7, advanced: 0, rate: null, offers: [], dueDay: 28, nextDue: nextOn(28), linked: true, createdAt: Date.now() },
    ];
    // Contas fixas de meses que já passaram contam como pagas, senão o exemplo mostra dezenas de atrasadas.
    for (const t of s.transactions) if (t.type === 'expense' && (t.recurring || t.installment) && t.date < today) t.paidAt = t.date;
    state = s;
    s.debts.forEach(syncDebtTx);
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
      if (tab.dataset.tab !== ui.tab) goTab(tab.dataset.tab);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = e.target.closest('[data-action]');
    if (!el || el.closest('#sheet')) return;
    const { action } = el.dataset;
    if (action === 'go-tab') {
      goTab(el.dataset.tab);
    } else if (action === 'filter-cat') {
      ui.category = el.dataset.cat;
      ui.filter = 'expense';
      ui.query = '';
      goTab('transactions');
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
    } else if (action === 'edit-goal' || action === 'deposit' || action === 'goal-plan') {
      const goal = state.goals.find((g) => g.id === el.dataset.id);
      if (goal) (action === 'deposit' ? openDepositSheet : action === 'goal-plan' ? openGoalPlanSheet : openGoalSheet)(goal);
    } else if (action === 'trend-sel') {
      selectTrend(el.dataset.month);
    } else if (action === 'new-income') {
      openTxSheet(null, 'income');
    } else if (action === 'load-demo') {
      loadDemo();
    } else if (action === 'see-invoice') {
      const card = cardById(el.dataset.card);
      if (card) openInvoiceSheet(card, el.dataset.due);
    } else if (action === 'pay-bill') {
      payBill(el.dataset.kind, el.dataset.key);
    } else if (action === 'all-bills') {
      openBillsSheet();
    } else if (action === 'bills-calendar') {
      exportBillsCalendar();
    } else if (action === 'setup-code') {
      openSetupSheet();
    } else if (action === 'salary') {
      openSalarySheet();
    } else if (action === 'new-debt') {
      openDebtSheet();
    } else if (['edit-debt', 'pay-debt', 'advance-debt', 'new-offer', 'accept-offer', 'del-offer', 'settle-debt'].includes(action)) {
      const debt = state.debts.find((d) => d.id === el.dataset.id);
      if (!debt) return;
      if (!debt.offers) debt.offers = [];
      const offer = debt.offers.find((o) => o.id === el.dataset.offer);
      if (action === 'pay-debt') payDebt(debt);
      else if (action === 'edit-debt') openDebtSheet(debt);
      else if (action === 'advance-debt') openAdvanceSheet(debt);
      else if (action === 'new-offer') openOfferSheet(debt);
      else if (action === 'settle-debt') openAcceptOffer(debt, { id: 'full', value: leftOf(debt) * debt.amount, remaining: leftOf(debt) * debt.amount });
      else if (action === 'accept-offer' && offer) openAcceptOffer(debt, offer);
      else if (action === 'del-offer' && offer) {
        debt.offers = debt.offers.filter((o) => o !== offer);
        save();
        render();
        toast('Proposta excluída', {
          label: 'Desfazer',
          run: () => {
            debt.offers.push(offer);
            save();
            render();
          },
        });
      }
    } else if (action === 'help-ok') {
      state.settings.helpSeen[el.dataset.tab] = true;
      save();
      render();
    } else if (action === 'backup-now') {
      exportBackup();
    } else if (action === 'backup-snooze') {
      state.settings.backupSnooze = todayISO();
      save();
      render();
      toast('Tudo bem. Amanhã eu lembro de novo.');
    } else if (action === 'clear-demo') {
      state = { ...defaultState(), settings: state.settings };
      save();
      render();
      toast('Tudo limpo. Bora começar!');
    }
  });

  // O Safari do iPhone ignora user-scalable=no em alguns casos; bloqueia a pinça direto.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));

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
    ui.motion = n > 0 ? 'slide-next' : 'slide-prev';
    $('#monthLabel').textContent = fixedTitleFor() || monthName(ui.month);
    renderSoon();
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
  $('#fab').addEventListener('click', () => {
    if (ui.tab === 'debts') openDebtSheet();
    else if (ui.tab === 'goals') openGoalSheet();
    else openTxSheet();
  });
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
    if (!swipe || ui.tab === 'goals' || ui.tab === 'debts') return;
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
    advanceDebts();
    ensureSalary();
    render();
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

  // ---------- Atualizações ----------
  // A versão e as novidades ficam no sw.js. O app pergunta ao service worker por mensagem.

  const VERSION_KEY = `${STORAGE_KEY}:versao`;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LOGO = `<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#146c5b"/>
    <rect x="104" y="150" width="304" height="232" rx="36" fill="#fff"/><path d="M104 206h304" stroke="#146c5b" stroke-width="22"/>
    <rect x="300" y="250" width="108" height="76" rx="22" fill="#dcefe9"/><circle cx="340" cy="288" r="14" fill="#146c5b"/>
    <path d="M168 300l40-40 36 30 46-56" fill="none" stroke="#eb6834" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  let swRegistration = null;
  let currentInfo = null;
  let updatingNow = false;

  function askWorker(worker) {
    return new Promise((resolve) => {
      if (!worker) {
        resolve(null);
        return;
      }
      const channel = new MessageChannel();
      const timer = setTimeout(() => resolve(null), 1500);
      channel.port1.onmessage = (e) => {
        clearTimeout(timer);
        resolve(e.data && e.data.version ? e.data : null);
      };
      worker.postMessage('getInfo', [channel.port2]);
    });
  }

  function waitInstalled(worker) {
    return new Promise((resolve) => {
      if (!worker || worker.state !== 'installing') {
        resolve();
        return;
      }
      const timer = setTimeout(resolve, 10000);
      worker.addEventListener('statechange', () => {
        if (worker.state !== 'installing') {
          clearTimeout(timer);
          resolve();
        }
      });
    });
  }

  const notesList = (notes) => (notes || []).map((n) => `<li>${esc(n)}</li>`).join('');

  // Cartão que sobe de baixo avisando da versão nova.
  let offering = false;
  async function offerUpdate(worker) {
    if (updatingNow || offering) return;
    offering = true;
    const info = await askWorker(worker);
    $('#toast').hidden = true;
    const card = document.createElement('div');
    card.id = 'updateCard';
    card.className = 'update-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', 'updTitle');
    card.innerHTML = `<div class="update-head">
        <div class="update-icon" aria-hidden="true">✨</div>
        <div><strong id="updTitle">Nova versão disponível</strong>
          <span>${info ? `Versão ${esc(info.version)} · ` : ''}leva só alguns segundos</span></div>
      </div>
      ${info && info.notes && info.notes.length ? `<p class="update-label">O que tem de novo:</p><ul class="update-notes">${notesList(info.notes.slice(0, 3))}</ul>` : ''}
      <div class="update-actions">
        <button class="btn" type="button" data-upd="later">Depois</button>
        <button class="btn primary" type="button" data-upd="now">Atualizar agora</button>
      </div>`;
    document.body.appendChild(card);
    card.addEventListener('click', (e) => {
      const b = e.target.closest('[data-upd]');
      if (!b) return;
      hideUpdateCard();
      if (b.dataset.upd === 'now') runUpdate(worker, info);
      else toast('Tudo bem! A atualização fica para a próxima vez que abrir o app.');
    });
  }

  function hideUpdateCard() {
    offering = false;
    const card = $('#updateCard');
    if (!card) return;
    card.classList.add('leaving');
    setTimeout(() => card.remove(), reduceMotion() ? 0 : 260);
  }

  // Tela de progresso: guarda os dados, instala e recarrega.
  async function runUpdate(worker, info) {
    updatingNow = true;
    closeSheet();
    const el = document.createElement('div');
    el.className = 'updating';
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-label', 'Atualizando o app');
    el.innerHTML = `<div class="updating-inner">
        <div class="updating-logo"><span class="updating-ring" aria-hidden="true"></span>${LOGO}</div>
        <h2>Atualizando o Meu Bolso</h2>
        <ol class="updating-steps" aria-live="polite">
          <li data-step="save">Guardando seus dados</li>
          <li data-step="install">Instalando ${info ? `a versão ${esc(info.version)}` : 'a nova versão'}</li>
          <li data-step="done">Pronto!</li>
        </ol>
        <div class="updating-bar"><span></span></div>
        <p class="hint">Seus dados continuam guardados no aparelho.</p>
      </div>`;
    document.body.appendChild(el);
    const step = (name, pct) => {
      let reached = false;
      $$('.updating-steps li', el).forEach((li) => {
        if (li.dataset.step === name) {
          li.className = name === 'done' ? 'done' : 'active';
          reached = true;
        } else {
          li.className = reached ? '' : 'done';
        }
      });
      $('.updating-bar span', el).style.width = `${pct}%`;
    };
    requestAnimationFrame(() => el.classList.add('show'));
    step('save', 25);
    await Promise.all([saveChain, wait(700)]);
    step('install', 70);
    const changed = new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      setTimeout(resolve, 6000);
    });
    worker.postMessage('skipWaiting');
    await Promise.all([changed, wait(700)]);
    step('done', 100);
    await wait(700);
    location.reload();
  }

  // Depois de atualizar: novidades com confete.
  function showWhatsNew(info, celebrate = true) {
    if (!info) return;
    const root = openSheet(`<div class="whatsnew">
        <div class="whatsnew-badge" aria-hidden="true">🎉</div>
        <h2 class="sheet-title" id="sheetTitle">${celebrate ? 'Atualizado!' : 'Novidades'} Versão ${esc(info.version)}</h2>
        <p class="hint">Veja o que mudou:</p>
        <ul class="whatsnew-list">${notesList(info.notes)}</ul>
        <button class="btn primary block" type="button" id="whatsNewOk">Bora usar!</button>
      </div>`);
    $('#whatsNewOk', root).addEventListener('click', closeSheet);
    if (celebrate) confetti();
  }

  async function checkWhatsNew() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    const info = await askWorker(navigator.serviceWorker.controller);
    if (!info) return;
    currentInfo = info;
    let last = null;
    try {
      last = localStorage.getItem(VERSION_KEY);
      localStorage.setItem(VERSION_KEY, info.version);
    } catch { /* sem armazenamento */ }
    // Sem versão anotada é a primeira vez com o modo offline: só anota, não é uma atualização.
    if (!last || last === info.version) return;
    showWhatsNew(info);
  }

  // Puxar para baixo ou tocar em "Procurar atualização".
  async function checkForUpdate() {
    advanceDebts();
    render();
    if (!swRegistration) {
      toast('Tudo em dia ✓');
      return;
    }
    try {
      await swRegistration.update();
    } catch {
      toast('Sem internet agora. Tente de novo mais tarde.');
      return;
    }
    await waitInstalled(swRegistration.installing);
    if (swRegistration.waiting) offerUpdate(swRegistration.waiting);
    else toast(`Você já está na versão mais nova ✓${currentInfo ? ` (${currentInfo.version})` : ''}`);
  }

  // Confete leve em canvas; some sozinho.
  function confetti() {
    if (reduceMotion()) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const colors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#146c5b'];
    const parts = Array.from({ length: 90 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 80,
      y: h * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 11 - 4,
      size: Math.random() * 6 + 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const startAt = performance.now();
    (function frame(now) {
      const t = now - startAt;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - t / 2200);
      for (const p of parts) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (t < 2200) requestAnimationFrame(frame);
      else canvas.remove();
    })(startAt);
  }

  // Puxar a tela para baixo para procurar atualização.
  const ptr = document.createElement('div');
  ptr.className = 'ptr';
  ptr.setAttribute('aria-hidden', 'true');
  ptr.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
  document.body.appendChild(ptr);
  let pull = null;
  const PULL_MAX = 110;
  const PULL_ARM = 70;
  window.addEventListener('touchstart', (e) => {
    pull = window.scrollY <= 0 && e.touches.length === 1 && $('#sheet').hidden && !document.body.classList.contains('locked')
      && !ptr.classList.contains('loading') ? { y: e.touches[0].clientY, dy: 0, armed: false } : null;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!pull) return;
    const dy = Math.min(PULL_MAX, Math.max(0, (e.touches[0].clientY - pull.y) * 0.5));
    pull.dy = dy;
    ptr.classList.add('pulling');
    ptr.style.transform = `translate(-50%, ${dy}px)`;
    ptr.style.opacity = String(Math.min(1, dy / PULL_ARM));
    $('svg', ptr).style.transform = `rotate(${dy >= PULL_ARM ? 180 : (dy / PULL_ARM) * 150}deg)`;
    const armed = dy >= PULL_ARM;
    if (armed && !pull.armed && navigator.vibrate) navigator.vibrate(8);
    pull.armed = armed;
    ptr.classList.toggle('armed', armed);
  }, { passive: true });
  window.addEventListener('touchend', async () => {
    if (!pull) return;
    const { armed } = pull;
    pull = null;
    ptr.classList.remove('pulling', 'armed');
    if (!armed) {
      ptr.style.transform = '';
      ptr.style.opacity = '';
      return;
    }
    ptr.classList.add('loading');
    ptr.style.transform = `translate(-50%, ${PULL_ARM}px)`;
    await Promise.all([checkForUpdate(), wait(600)]);
    ptr.classList.remove('loading');
    ptr.style.transform = '';
    ptr.style.opacity = '';
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.MEUBOLSO_PREVIEW) {
    window.addEventListener('load', async () => {
      try {
        let hadController = !!navigator.serviceWorker.controller;
        swRegistration = await navigator.serviceWorker.register('sw.js');
        if (swRegistration.waiting && navigator.serviceWorker.controller) offerUpdate(swRegistration.waiting);
        swRegistration.addEventListener('updatefound', () => {
          const worker = swRegistration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
          });
        });
        // Primeira instalação: anota a versão para não mostrar "novidades" à toa depois.
        navigator.serviceWorker.ready.then((reg) => askWorker(reg.active)).then((info) => {
          if (!info) return;
          currentInfo = currentInfo || info;
          try {
            if (!localStorage.getItem(VERSION_KEY) && !navigator.serviceWorker.controller) localStorage.setItem(VERSION_KEY, info.version);
          } catch { /* sem armazenamento */ }
        });
        // Atualizado em outra aba: recarrega esta também.
        // Só recarrega quando já existia uma versão antes: na primeira instalação o modo offline
        // assume a página e isso não é uma atualização (recarregar atropelaria quem já está usando).
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!hadController) {
            hadController = true;
            return;
          }
          if (!updatingNow) {
            updatingNow = true;
            location.reload();
          }
        });
      } catch { /* sem modo offline */ }
    });
  }

  // ---------- Início ----------

  function hideSplash() {
    const splash = $('#splash');
    if (!splash || splash.classList.contains('hide')) return;
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), reduceMotion() ? 0 : 450);
  }

  let started = false;
  // Troca os emojis por ícones já na tela inicial e em tudo o que for desenhado depois.
  iconify(document.body);
  iconObserver.observe(document.body, { childList: true, subtree: true });

  function start() {
    // Dados de versão antiga: grava logo no formato novo.
    const raw = parseJSON(readRaw());
    if (raw && !isEnvelope(raw) && !(raw.version >= 5)) save();
    advanceDebts();
    ensureSalary();
    render();
    hideSplash();
    snapshotToday().catch(() => {});
    if (!started) {
      started = true;
      checkWhatsNew().catch(() => {});
    }
  }

  if (isEnvelope(parseJSON(readRaw()))) {
    showLock();
    hideSplash();
  } else {
    state = parseState(readRaw());
    if (window.MEUBOLSO_PREVIEW && !state.transactions.length && !state.goals.length && !state.debts.length) {
      loadDemo();
      hideSplash();
    } else {
      start();
    }
  }
})();
