export default {
  async fetch(request, env) {
    // 处理请求
    async function handleRequest(request) {
      try {
        const headers = new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
          'Content-Type': 'application/json'
        });

        // 处理 OPTIONS 请求
        if (request.method === 'OPTIONS') {
          return new Response(null, { headers });
        }

        const url = new URL(request.url);
        const path = url.pathname;
        
        console.log('请求路径:', path, '方法:', request.method);

        // Render.com 后端 URL
        const renderUrl = "https://cheesecatool-backend.onrender.com";

        // 检查路径是否以 /api/ 开头
        if (path.startsWith('/api/')) {
          console.log('转发请求到 Render.com:', `${renderUrl}${path}`);
          
          // 保持原始请求头
          const newHeaders = new Headers(request.headers);
          newHeaders.set('Origin', renderUrl);
          
          // 创建一个新的请求转发到Render.com
          const renderRequest = new Request(`${renderUrl}${path}`, {
            method: request.method,
            headers: newHeaders,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined
          });
          
          try {
            // 发送请求到Render.com
            const renderResponse = await fetch(renderRequest);
            console.log('Render响应状态:', renderResponse.status);
            
            // 获取响应内容和状态
            const responseBody = await renderResponse.blob();
            
            // 创建Response对象，包含CORS头
            const responseHeaders = new Headers(renderResponse.headers);
            responseHeaders.set('Access-Control-Allow-Origin', '*');
            responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
            
            return new Response(responseBody, {
              status: renderResponse.status,
              headers: responseHeaders
            });
          } catch (error) {
            console.error('代理请求错误:', error);
            return new Response(JSON.stringify({
              error: '代理请求失败',
              details: error.message
            }), {
              headers,
              status: 502
            });
          }
        }

        // 默认响应
        return new Response(JSON.stringify({
          message: "欢迎使用视频帧提取API",
          version: "1.0"
        }), {
          headers,
          status: 200
        });
      } catch (error) {
        console.error('整体处理错误:', error);
        return new Response(JSON.stringify({
          error: '服务器内部错误',
          details: error.message
        }), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          status: 500
        });
      }
    }

    return handleRequest(request);
  }
} 