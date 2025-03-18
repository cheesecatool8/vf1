from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
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

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'video_frame_extractor_secret_key')
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# 配置 CORS
CORS(app, origins=CORS_ORIGINS)

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

@app.route('/api/extract-frames', methods=['POST'])
@rate_limit(limit=5, per=300)  # 5次/5分钟
def extract_frames_api():
    """API端点用于提取视频帧"""
    # 添加日志便于调试
    logger.info(f"收到提取帧请求 - 内容类型: {request.content_type}")
    logger.info(f"表单数据: {list(request.form.keys()) if request.form else '无'}")
    logger.info(f"文件: {list(request.files.keys()) if request.files else '无'}")
    
    if 'video' not in request.files and 'videoUrl' not in request.form:
        return jsonify({'error': '未找到视频文件或URL'}), 400
    
    try:
        # 生成唯一文件名
        unique_id = uuid.uuid4().hex
        folder_name = unique_id
        
        # 获取表单参数
        fps = float(request.form.get('fps', DEFAULT_FPS))
        start_time = request.form.get('start_time')
        start_time = float(start_time) if start_time and start_time.strip() else None
        end_time = request.form.get('end_time')
        end_time = float(end_time) if end_time and end_time.strip() else None
        format_type = request.form.get('format', DEFAULT_FORMAT)
        quality = int(request.form.get('quality', DEFAULT_QUALITY))
        
        # 创建临时目录
        temp_dir = os.path.join('/tmp', folder_name)
        os.makedirs(temp_dir, exist_ok=True)
        temp_video_path = None
        
        # 处理视频文件或URL
        if 'video' in request.files:
            file = request.files['video']
            if file.filename == '':
                return jsonify({'error': '未选择文件'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({'error': '不支持的文件类型。允许的类型: ' + ', '.join(ALLOWED_EXTENSIONS)}), 400
            
            original_filename = secure_filename(file.filename)
            file_extension = original_filename.rsplit('.', 1)[1].lower()
            video_filename = f"{unique_id}.{file_extension}"
            
            # 上传视频到 R2
            video_object_name = f"videos/{folder_name}/{video_filename}"
            content_type = mimetypes.guess_type(original_filename)[0]
            
            logger.info(f"上传视频到R2: {video_object_name}")
            if not r2_storage.upload_fileobj(file, video_object_name, content_type):
                logger.error("上传视频到R2失败")
                return jsonify({'error': '上传视频失败'}), 500
            
            # 下载视频到临时目录
            temp_video_path = os.path.join(temp_dir, video_filename)
            logger.info(f"从R2下载视频到: {temp_video_path}")
            if not r2_storage.download_file(video_object_name, temp_video_path):
                logger.error("从R2下载视频失败")
                return jsonify({'error': '处理视频失败'}), 500
        else:
            # 处理视频URL
            video_url = request.form['videoUrl']
            logger.info(f"处理视频URL: {video_url}")
            return jsonify({'error': 'URL视频处理功能尚未实现'}), 501
        
        if not temp_video_path or not os.path.exists(temp_video_path):
            logger.error(f"视频文件不存在: {temp_video_path}")
            return jsonify({'error': '视频文件无效'}), 400
        
        # 提取帧
        logger.info(f"开始提取帧: fps={fps}, format={format_type}, quality={quality}")
        try:
            frame_count = extract_frames(
                temp_video_path,
                temp_dir,
                fps=fps,
                start_time=start_time,
                end_time=end_time,
                format=format_type,
                quality=quality
            )
            logger.info(f"提取了 {frame_count} 个帧")
        except Exception as e:
            logger.error(f"提取帧时出错: {str(e)}")
            return jsonify({'error': f'提取帧时出错: {str(e)}'}), 500
        
        # 上传帧到 R2
        frame_urls = []
        frame_files = [f for f in os.listdir(temp_dir) if f.endswith(f'.{format_type}')]
        logger.info(f"找到 {len(frame_files)} 个帧文件，准备上传到R2")
        
        for frame_file in frame_files:
            frame_path = os.path.join(temp_dir, frame_file)
            frame_object_name = f"frames/{folder_name}/{frame_file}"
            content_type = f'image/{format_type}'
            
            if r2_storage.upload_file(frame_path, frame_object_name, content_type):
                frame_url = r2_storage.get_presigned_url(frame_object_name)
                if frame_url:
                    frame_urls.append({
                        'url': frame_url,
                        'filename': frame_file
                    })
        
        logger.info(f"成功上传 {len(frame_urls)} 个帧到R2")
        
        # 清理临时文件
        for file in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, file))
        os.rmdir(temp_dir)
        logger.info("清理了临时文件")
        
        # 返回结果
        return jsonify({
            'success': True,
            'folder_name': folder_name,
            'frames': frame_urls
        })
        
    except Exception as e:
        logger.error(f"处理视频时出错: {str(e)}", exc_info=True)
        return jsonify({'error': f'处理视频时出错: {str(e)}'}), 500

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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('DEBUG', 'False').lower() == 'true') 