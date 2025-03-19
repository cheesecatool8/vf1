@app.route('/api/proxy-image')
def proxy_image():
    """代理图片请求，解决CORS问题"""
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "Missing URL parameter"}), 400
    
    try:
        # 转发请求到R2存储
        response = requests.get(url, stream=True)
        
        # 创建Flask响应对象
        proxy_response = Response(
            response.iter_content(chunk_size=1024),
            content_type=response.headers.get('content-type', 'image/jpeg')
        )
        
        # 设置响应头
        proxy_response.headers.set('Access-Control-Allow-Origin', '*')
        return proxy_response
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500 