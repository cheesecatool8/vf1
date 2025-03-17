export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

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
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, {
      headers
    });
  }
} 