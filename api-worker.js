export default {
  async fetch(request, env) {
    // 处理请求
    async function handleRequest(request) {
      try {
        const headers = new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Expose-Headers': '*'
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
          
          // 创建新的Headers对象，保留原始请求的所有头部
          const newHeaders = new Headers(request.headers);
          
          // 创建一个新的请求转发到Render.com
          const renderRequest = new Request(`${renderUrl}${path}`, {
            method: request.method,
            headers: newHeaders,
            body: request.body,
            duplex: 'half'  // 添加这个选项来处理流
          });
          
          try {
            // 发送请求到Render.com
            const renderResponse = await fetch(renderRequest);
            console.log('Render响应状态:', renderResponse.status);
            
            // 创建Response对象，包含CORS头
            const responseHeaders = new Headers(renderResponse.headers);
            responseHeaders.set('Access-Control-Allow-Origin', '*');
            responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            responseHeaders.set('Access-Control-Allow-Headers', '*');
            responseHeaders.set('Access-Control-Expose-Headers', '*');
            
            // 获取响应内容
            const responseBody = await renderResponse.blob();
            
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