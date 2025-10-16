// Cloudflare Worker для обхода блокировок YouTube
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Обработка embed запросов
    if (path.startsWith('/embed/') || path.startsWith('/video/')) {
      const videoId = path.split('/').pop();
      return handleEmbedRequest(videoId, request);
    }
    
    // Обработка API запросов
    if (path.startsWith('/api/')) {
      return handleAPIRequest(path, request);
    }
    
    return new Response('YouTube Proxy Worker - Active', { status: 200 });
  }
};

async function handleEmbedRequest(videoId, request) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  const modifiedRequest = new Request(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site'
    }
  });
  
  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.body, response);
    
    // Добавляем CORS заголовки
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return modifiedResponse;
  } catch (error) {
    return new Response('Error fetching video', { status: 500 });
  }
}

async function handleAPIRequest(path, request) {
  const apiPath = path.replace('/api/', '');
  const apiUrl = `https://www.youtube.com/${apiPath}`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'API request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}