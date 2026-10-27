// Guarda os arquivos do app no aparelho para funcionar sem internet.
// Ao mudar qualquer arquivo do app, aumente VERSION e escreva as novidades em NOTES:
// o app mostra essas frases no aviso de atualização e na tela de "Atualizado!".
const VERSION = '1.21.0';
const NOTES = [
  'Novo: desbloquear o app com Face ID (⚙ → Segurança → Desbloquear com Face ID)',
  'O PIN continua valendo como reserva, e trocar o PIN desliga o Face ID por segurança',
];
const CACHE = `meubolso-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

// Baixa sempre a versão nova dos arquivos (sem passar pelo cache HTTP).
// A versão nova só assume quando a pessoa toca em "Atualizar" no app.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  else if (event.data === 'getInfo' && event.ports[0]) event.ports[0].postMessage({ version: VERSION, notes: NOTES });
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Responde com o que está guardado e atualiza em segundo plano quando houver internet.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
