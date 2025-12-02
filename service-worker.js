const CACHE_NAME = 'checklist-frota-cache-v2'; // Mudei para v2 para forçar atualização
const URLS_TO_CACHE = [
    '/',
    'index.html',
    'estilos.css',
    'scripts.js',
    // Imagens (Verifique se esses arquivos existem exatamente com esse nome na pasta assets)
    'assets/Brasao1.png', 
    'assets/Brasao2.png', 
    // Ícones
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    // Bibliotecas Externas (Copiadas do seu index.html)
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.1/dist/browser-image-compression.js'
];

// Salva em CACHE
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                // O return aqui é crucial para ver o erro se falhar
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => {
                console.error('Falha ao registrar cache. Verifique se todos os arquivos da lista existem:', err);
            })
    );
});

// Busca na rede
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna do cache se achar, senão busca na rede
                if (response) {
                    return response; 
                }
                return fetch(event.request); 
            })
    );
});

// Limpa caches antigos (Importante quando muda o CACHE_NAME)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});