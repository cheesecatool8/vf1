from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, Response, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
from extract_frames import extract_frames
import logging
from r2_storage import R2Storage
from r2_lifecycle import R2Lifecycle
from config import (
    ALLOWED_EXTENSIONS,
    MAX_CONTENT_LENGTH,
    CORS_ORIGINS,
    DEFAULT_QUALITY,
    DEFAULT_FPS,
    DEFAULT_FORMAT
)
import mimetypes
from functools import wraps
import time
import threading
import requests
import tempfile
import json
from dateutil import parser

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'video_frame_extractor_secret_key')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['FRAMES_FOLDER'] = 'frames'
app.config['FRAMES_BASE_URL'] = os.environ.get('FRAMES_BASE_URL', 'https://storage.y.cheesecatool.com')
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# 配置 CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# 确保上传目录和帧目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['FRAMES_FOLDER'], exist_ok=True)

# 初始化 R2 存储和生命周期管理
r2_storage = R2Storage()
r2_lifecycle = R2Lifecycle(r2_storage)

def cleanup_task():
    """定时清理任务"""
    while True:
        try:
            deleted_count = r2_lifecycle.cleanup_expired_files()
            if deleted_count > 0:
                logger.info(f"已清理 {deleted_count} 个过期文件")
            time.sleep(3600)  # 每1小时检查一次
        except Exception as e:
            logger.error(f"清理任务出错: {str(e)}")
            time.sleep(60)  # 出错后等待1分钟再试

# 启动清理线程
cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
cleanup_thread.start()

# 速率限制装饰器
def rate_limit(limit=10, per=60):
    def decorator(f):
        requests = {}
        @wraps(f)
        def wrapped(*args, **kwargs):
            now = time.time()
            ip = request.remote_addr
            
            # 清理过期的请求记录
            requests[ip] = [t for t in requests.get(ip, []) if now - t < per]
            
            if len(requests.get(ip, [])) >= limit:
                return jsonify({'error': '请求过于频繁，请稍后再试'}), 429
            
            requests.setdefault(ip, []).append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload-video', methods=['POST'])
def upload_video():
    """处理视频上传请求"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': '没有找到视频文件'}), 400
            
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': '未选择文件'}), 400
            
        if file:
            # 生成安全的文件名
            filename = secure_filename(file.filename)
            # 确保上传目录存在
            if not os.path.exists(app.config['UPLOAD_FOLDER']):
                os.makedirs(app.config['UPLOAD_FOLDER'])
                
            # 保存文件
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            app.logger.info(f"成功上传视频: {filename}")
            
            return jsonify({
                'success': True,
                'message': '视频上传成功',
                'filename': filename,
                'videoPath': filename
            })
            
    except Exception as e:
        app.logger.error(f"上传视频时出错: {str(e)}", exc_info=True)
        return jsonify({'error': f'上传视频失败: {str(e)}'}), 500

@app.route('/api/extract-frames', methods=['POST'])
def extract_frames_api():
    """处理视频帧提取请求"""
    try:
        logger.info(f"接收到提取帧请求，内容类型: {request.content_type}")
        
        # 处理JSON请求
        if request.is_json:
            data = request.get_json()
            logger.info(f"提取帧JSON请求数据: {data}")
            
            # 获取参数
            video_path = data.get('videoPath')
            video_url = data.get('videoUrl')
            fps = data.get('fps', 1)
            quality = data.get('quality', 80)
            format_type = data.get('format', 'jpg')
            start_time = data.get('startTime')
            end_time = data.get('endTime')
            
            logger.info(f"解析的参数: video_path={video_path}, video_url={video_url}, fps={fps}, quality={quality}, format={format_type}, start_time={start_time}, end_time={end_time}")
            
            if not video_path and not video_url:
                logger.error("未提供视频路径或URL")
                return jsonify({'error': '未提供视频路径或URL'}), 400
                
            # 如果提供了URL但没有路径，先下载视频
            if video_url and not video_path:
                try:
                    # 生成唯一文件名
                    video_filename = f"url_video_{int(time.time())}.mp4"
                    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
                    
                    # 下载视频
                    logger.info(f"从URL下载视频: {video_url}")
                    response = requests.get(video_url, stream=True, timeout=60)
                    response.raise_for_status()
                    
                    with open(video_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192): 
                            f.write(chunk)
                            
                    logger.info(f"视频下载成功: {video_path}")
                except Exception as e:
                    logger.error(f"下载视频时出错: {str(e)}", exc_info=True)
                    return jsonify({'error': f'下载视频失败: {str(e)}'}), 500
            else:
                # 确保使用相对路径或完整路径
                if not os.path.isabs(video_path):
                    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_path)
                
            # 检查视频文件是否存在
            if not os.path.exists(video_path):
                logger.error(f"视频文件不存在: {video_path}")
                return jsonify({'error': f'视频文件不存在: {video_path}'}), 404
            
            logger.info(f"开始提取帧，视频路径: {video_path}")
            
            # 提取帧
            try:
                # 确保输出目录存在
                base_name = os.path.basename(video_path)
                output_dir_name = os.path.splitext(base_name)[0]
                output_dir = os.path.join(app.config['FRAMES_FOLDER'], output_dir_name)
                os.makedirs(output_dir, exist_ok=True)
                
                logger.info(f"输出目录: {output_dir}")
                
                # 执行帧提取
                frame_count = extract_frames(
                    video_path, 
                    output_dir, 
                    fps=float(fps), 
                    start_time=start_time,
                    end_time=end_time,
                    format=format_type,
                    quality=int(quality)
                )
                
                logger.info(f"成功提取 {frame_count} 帧")
                
                # 构建帧数据
                base_url = app.config.get('FRAMES_BASE_URL', '')
                if not base_url:
                    # 如果没有设置基础URL，使用当前请求的URL构建
                    base_url = request.url_root.rstrip('/')
                    
                # 调整为相对路径
                frames_url_path = f"frames/{output_dir_name}"
                # 列出所有帧文件
                frame_files = sorted([f for f in os.listdir(output_dir) if f.endswith(f'.{format_type}')])
                
                frames = []
                for i, frame_file in enumerate(frame_files):
                    # 构建完整URL，确保它是可访问的
                    frame_url = f"{base_url}/{frames_url_path}/{frame_file}"
                    frames.append({
                        'url': frame_url,
                        'filename': frame_file,
                        'index': i
                    })
                
                logger.info(f"返回 {len(frames)} 个帧URL")
                
                # 返回结果
                return jsonify({
                    'frames': frames,
                    'message': f'成功提取 {frame_count} 帧',
                    'count': frame_count,
                    'baseUrl': base_url,
                    'framesPath': frames_url_path
                })
                
            except Exception as e:
                logger.error(f"提取帧时出错: {str(e)}", exc_info=True)
                return jsonify({'error': f'提取帧时出错: {str(e)}'}), 500
        
        # 处理表单数据请求 (兼容旧格式)
        else:
            logger.warning("收到非JSON格式请求，尝试作为表单数据处理")
            if 'video' not in request.files and 'videoUrl' not in request.form:
                return jsonify({'error': '未找到视频文件或URL'}), 400
            
            # 处理表单数据请求的逻辑
            # ...
            return jsonify({'error': '请使用JSON格式请求'}), 400
                
    except Exception as e:
        logger.error(f"处理请求时出错: {str(e)}", exc_info=True)
        return jsonify({'error': f'处理请求时出错: {str(e)}'}), 500

@app.route('/frames/<folder_name>')
def get_frames(folder_name):
    try:
        # 列出指定文件夹中的所有帧
        frames = []
        for obj in r2_storage.list_files(f"frames/{folder_name}/"):
            object_name = obj['Key']
            url = r2_storage.get_presigned_url(object_name)
            if url:
                frames.append({
                    'url': url,
                    'filename': os.path.basename(object_name)
                })
        
        return jsonify({
            'success': True,
            'frames': frames
        })
    except Exception as e:
        logger.error(f"获取帧列表时出错: {str(e)}")
        return jsonify({'error': f'获取帧列表时出错: {str(e)}'}), 500

@app.route('/download/<folder_name>/<filename>')
def download_frame(folder_name, filename):
    try:
        object_name = f"frames/{folder_name}/{filename}"
        url = r2_storage.get_presigned_url(object_name)
        if url:
            return redirect(url)
        else:
            return jsonify({'error': '获取下载链接失败'}), 404
    except Exception as e:
        logger.error(f"获取下载链接时出错: {str(e)}")
        return jsonify({'error': f'获取下载链接时出错: {str(e)}'}), 500

@app.route('/api/proxy-image')
def proxy_image():
    """代理图片请求，解决CORS问题"""
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "Missing URL parameter"}), 400
    
    try:
        # 转发请求到存储服务
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
        app.logger.error(f"代理图片请求失败: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# 配置静态文件路由 - 允许直接访问提取的帧
@app.route('/frames/<path:filepath>')
def serve_frames(filepath):
    """提供对提取的帧的访问"""
    return send_file(os.path.join(app.config['FRAMES_FOLDER'], filepath))

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('DEBUG', 'False').lower() == 'true') 