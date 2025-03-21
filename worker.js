export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    if (!key) {
      return new Response('Not Found', { status: 404 });
    }

    // 允许的文件前缀
    const allowedPrefixes = ['videos/', 'frames/'];
    if (!allowedPrefixes.some(prefix => key.startsWith(prefix))) {
      return new Response('Forbidden', { status: 403 });
    }

    // 获取 R2 对象
    const object = await env.BUCKET.get(key);
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // 添加CORS头部
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    return new Response(object.body, {
      headers
    });
  }
}

// 处理CORS预检请求的函数
function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Max-Age': '86400',
    }
  });
} 