export default {
  async fetch(request, env) {
    // 设置 CORS 头
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    });

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Render.com 后端 URL
    const renderUrl = 'https://cheesecatool-backend.onrender.com';

    try {
      // 处理视频上传请求
      if (path === '/api/upload' && request.method === 'POST') {
        // 这部分通常需要配合后端服务实现
        // Workers 不能直接处理大型文件上传
        // 需要使用 R2 直接上传或通过 API 代理上传
        return new Response(JSON.stringify({
          message: '上传请求收到，但需要有服务器处理',
          info: '此功能需要使用实际的后端服务器'
        }), { 
          headers,
          status: 200 
        });
      }

      // 处理 API 请求 - 代理到 Render.com
      if (path.startsWith('/api/')) {
        try {
          // 将请求转发到 Render.com
          const fullRenderUrl = `${renderUrl}${path}`;
          
          // 创建新的请求对象，保持原始请求的方法、头和正文
          const renderRequest = new Request(fullRenderUrl, request);
          
          // 发送请求到 Render.com
          const response = await fetch(renderRequest);
          
          // 添加 CORS 头到响应
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Access-Control-Allow-Origin', '*');
          
          return new Response(response.body, {
            status: response.status,
            headers: newHeaders
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            error: `代理到后端出错: ${error.message}`,
            path: path
          }), { 
            headers, 
            status: 500 
          });
        }
      }

      // 默认响应
      return new Response(JSON.stringify({
        message: '欢迎使用芝士猫工具 API',
        version: '1.0'
      }), { 
        headers,
        status: 200 
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), { 
        headers,
        status: 500 
      });
    }
  }
} 