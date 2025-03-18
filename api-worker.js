export default {
  async fetch(request, env) {
    // 设置CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    };

    // 处理OPTIONS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // 获取请求URL和路径
    const url = new URL(request.url);
    const path = url.pathname;
    
    console.log(`处理请求: ${request.method} ${path}`);

    // 获取请求头的Content-Type
    const contentType = request.headers.get('Content-Type') || '';
    console.log(`请求Content-Type: ${contentType}`);

    try {
      // 所有API请求转发到Render.com后端
      if (path.startsWith('/api/')) {
        // 后端URL
        const backendUrl = 'https://cheesecatool-backend.onrender.com';
        const backendPath = path; // 保持相同路径
        const backendEndpoint = `${backendUrl}${backendPath}`;
        
        console.log(`转发请求到: ${backendEndpoint}`);

        // 确保不修改原始内容类型
        const newHeaders = new Headers(request.headers);
        
        // 克隆原始请求但修改目标URL
        const backendRequest = new Request(backendEndpoint, {
          method: request.method,
          headers: newHeaders,
          body: request.body,
          redirect: 'follow',
        });

        // 发送到后端
        console.log(`开始发送请求到后端...`);
        const backendResponse = await fetch(backendRequest);
        
        console.log(`后端响应状态: ${backendResponse.status}`);

        // 读取响应体
        const responseBody = await backendResponse.arrayBuffer();
        
        // 创建带有CORS头的新响应
        const responseHeaders = new Headers(backendResponse.headers);
        Object.keys(corsHeaders).forEach(key => {
          responseHeaders.set(key, corsHeaders[key]);
        });

        // 如果响应状态为500且是JSON格式，尝试解析错误信息
        if (backendResponse.status === 500) {
          try {
            const errorText = new TextDecoder().decode(responseBody);
            console.error(`后端错误: ${errorText}`);
          } catch (e) {
            console.error(`无法解析后端错误: ${e}`);
          }
        }

        return new Response(responseBody, {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: responseHeaders
        });
      }

      // 默认响应
      return new Response(JSON.stringify({
        message: "欢迎使用视频帧提取API",
        version: "1.0"
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error(`处理请求出错: ${error.message}`);
      console.error(`错误详情: ${error.stack || '无堆栈'}`);
      
      // 返回错误响应
      return new Response(JSON.stringify({
        error: '内部服务器错误',
        message: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
}; 