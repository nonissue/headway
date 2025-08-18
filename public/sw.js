self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('nexttrain-v1').then((cache) =>
            cache.addAll([
                '/', // shell route
                '/offline.html', // simple offline fallback page you create
            ])
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== 'nexttrain-v1')
                        .map((k) => caches.delete(k))
                )
            )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request)
                .then((network) => {
                    const copy = network.clone();
                    caches
                        .open('nexttrain-v1')
                        .then((cache) => cache.put(request, copy));
                    return network;
                })
                .catch(() => cached || caches.match('/offline.html'));
            return cached || fetchPromise;
        })
    );
});
