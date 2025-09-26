
const CACHE_NAME = 'checklist-frota-cache-v1';
const URLS_TO_CACHE = [
    '/',
    'index.html',
    'estilos.css',
    'scripts.js',
    'assets/brasao.png',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js'
];
//Salva em CACHE
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});
//Busca na rede
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; 
                }
                return fetch(event.request); 
            })
    );
});