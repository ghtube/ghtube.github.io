// Service Worker для продвинутого обхода блокировок
const CACHE_NAME = 'youtube-unblock-v1';
const YOUTUBE_DOMAINS = [
    'www.youtube.com',
    'youtube.com',
    'www.youtube-nocookie.com',
    'youtu.be',
    'i.ytimg.com'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Проксируем запросы к YouTube
    if (YOUTUBE_DOMAINS.some(domain => url.hostname.includes(domain))) {
        event.respondWith(handleYouTubeRequest(event.request));
    }
});

async function handleYouTubeRequest(request) {
    try {
        // Создаем новый запрос с обходными заголовками
        const modifiedRequest = new Request(request, {
            headers: {
                ...Object.fromEntries(request.headers),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0',
                'Referer': 'https://www.youtube.com/'
            }
        });

        const response = await fetch(modifiedRequest);
        
        // Модифицируем ответ если нужно
        if (response.headers.get('Content-Type')?.includes('text/html')) {
            return modifyYouTubeResponse(response);
        }
        
        return response;
    } catch (error) {
        console.error('Proxy error:', error);
        return new Response('Proxy error', { status: 500 });
    }
}

async function modifyYouTubeResponse(response) {
    const text = await response.text();
    
    // Заменяем YouTube домены на проксированные
    const modifiedText = text
        .replace(/youtube\.com/g, self.location.hostname + '/proxy/youtube')
        .replace(/youtu\.be/g, self.location.hostname + '/proxy/youtu');
    
    return new Response(modifiedText, {
        headers: {
            ...Object.fromEntries(response.headers),
            'Content-Type': 'text/html'
        }
    });
}