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
import cv2

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
                    # 验证URL是否有效
                    if not video_url.startswith(('http://', 'https://')):
                        logger.error(f"无效的视频URL格式: {video_url}")
                        return jsonify({'error': '请提供有效的视频URL (http或https)'}), 400
                    
                    # 生成唯一文件名
                    video_filename = f"url_video_{int(time.time())}.mp4"
                    video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_filename)
                    
                    # 确保上传目录存在
                    if not os.path.exists(app.config['UPLOAD_FOLDER']):
                        os.makedirs(app.config['UPLOAD_FOLDER'])
                    
                    # 下载视频
                    logger.info(f"从URL下载视频: {video_url}")
                    response = requests.get(video_url, stream=True, timeout=60)
                    response.raise_for_status()
                    
                    # 检查是否是视频类型
                    content_type = response.headers.get('Content-Type', '')
                    logger.info(f"视频内容类型: {content_type}")
                    
                    if content_type and not ('video' in content_type or 'octet-stream' in content_type):
                        logger.warning(f"非预期的内容类型: {content_type}，尝试继续处理")
                    
                    with open(video_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192): 
                            f.write(chunk)
                            
                    logger.info(f"视频下载成功: {video_path}")
                    
                    # 验证下载的文件是否是有效的视频文件
                    if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
                        logger.error(f"下载的文件无效或为空: {video_path}")
                        return jsonify({'error': '无法下载有效的视频文件'}), 400
                except requests.exceptions.RequestException as e:
                    logger.error(f"请求视频URL时出错: {str(e)}", exc_info=True)
                    return jsonify({'error': f'无法从URL获取视频: {str(e)}'}), 500
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
                
                logger.info(f"成功提取 {frame_count} 帧，准备上传到R2存储")
                
                # 将帧上传到R2存储
                base_url = app.config.get('FRAMES_BASE_URL', '')
                if not base_url:
                    # 如果没有设置基础URL，使用当前请求的URL构建
                    base_url = request.url_root.rstrip('/')
                
                logger.info(f"使用基础URL: {base_url}")
                    
                # 调整为相对路径
                frames_url_path = f"frames/{output_dir_name}"
                # 列出所有帧文件
                frame_files = sorted([f for f in os.listdir(output_dir) if f.endswith(f'.{format_type}')])
                
                logger.info(f"准备上传 {len(frame_files)} 个文件到R2存储")
                
                frames = []
                upload_success_count = 0
                
                for i, frame_file in enumerate(frame_files):
                    # 构建本地文件路径和对象存储路径
                    local_file_path = os.path.join(output_dir, frame_file)
                    object_name = f"{frames_url_path}/{frame_file}"
                    
                    # 确定内容类型
                    content_type = f"image/{format_type}"
                    
                    # 上传文件到R2存储
                    uploaded = r2_storage.upload_file(local_file_path, object_name, content_type)
                    if uploaded:
                        upload_success_count += 1
                    else:
                        logger.warning(f"上传帧到R2失败: {object_name}")
                    
                    # 构建完整URL，确保它是可访问的
                    frame_url = f"{base_url}/{object_name}"
                    frames.append({
                        'url': frame_url,
                        'filename': frame_file,
                        'index': i,
                        'format': format_type
                    })
                    
                    # 每上传10个文件记录一次日志
                    if (i+1) % 10 == 0 or i == len(frame_files)-1:
                        logger.info(f"已上传 {i+1}/{len(frame_files)} 个文件")
                
                logger.info(f"成功上传 {upload_success_count}/{len(frame_files)} 个文件到R2存储")
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

@app.route('/api/frame-image/<path:filepath>')
def get_frame_image(filepath):
    """直接从存储获取帧图片，避免CORS和404问题"""
    try:
        # 构造完整的对象路径
        object_name = f"frames/{filepath}"
        logger.info(f"请求获取帧图片: {object_name}")
        
        # 从R2存储获取图片内容
        image_data = r2_storage.get_file(object_name)
        
        if image_data:
            # 确定正确的MIME类型
            content_type = 'image/jpeg'
            if filepath.lower().endswith('.png'):
                content_type = 'image/png'
            elif filepath.lower().endswith('.webp'):
                content_type = 'image/webp'
            
            # 创建响应
            response = Response(image_data, content_type=content_type)
            response.headers.set('Access-Control-Allow-Origin', '*')
            response.headers.set('Cache-Control', 'public, max-age=31536000')
            return response
        else:
            logger.error(f"帧图片不存在: {object_name}")
            return jsonify({"error": "图片不存在"}), 404
            
    except Exception as e:
        logger.error(f"获取帧图片失败: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# 配置静态文件路由 - 允许直接访问提取的帧
@app.route('/frames/<path:filepath>')
def serve_frames(filepath):
    """提供对提取的帧的访问"""
    return send_file(os.path.join(app.config['FRAMES_FOLDER'], filepath))

def extract_frames(video_path, output_dir, fps=1, start_time=None, end_time=None, format='jpg', quality=80):
    """从视频中提取帧"""
    try:
        logger.info(f"正在初始化视频捕获: {video_path}")
        
        # 检查视频文件是否存在
        if not os.path.exists(video_path):
            logger.error(f"视频文件不存在: {video_path}")
            raise FileNotFoundError(f"视频文件不存在: {video_path}")
            
        # 检查文件大小
        file_size = os.path.getsize(video_path)
        if file_size == 0:
            logger.error(f"视频文件为空: {video_path}")
            raise ValueError(f"视频文件为空: {video_path}")
            
        logger.info(f"视频文件大小: {file_size} 字节")
        
        # 尝试打开视频文件
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"无法打开视频文件: {video_path}")
            raise ValueError(f"无法打开视频文件: {video_path}")
            
        # 获取视频信息
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / video_fps if video_fps else 0
        
        logger.info(f"视频信息: FPS={video_fps}, 总帧数={total_frames}, 时长={duration:.2f}秒")
        
        # 计算采样间隔
        sample_rate = int(video_fps / fps) if fps > 0 else 1
        logger.info(f"采样间隔: 每{sample_rate}帧提取一帧")
        
        # 处理开始和结束时间
        start_frame = 0
        end_frame = total_frames
        
        if start_time is not None and start_time > 0:
            start_frame = int(start_time * video_fps)
            logger.info(f"设置开始时间: {start_time}秒, 起始帧={start_frame}")
            
        if end_time is not None and end_time > 0:
            end_frame = min(int(end_time * video_fps), total_frames)
            logger.info(f"设置结束时间: {end_time}秒, 结束帧={end_frame}")
            
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 提取帧
        frame_count = 0
        for frame_id in range(start_frame, end_frame, sample_rate):
            # 设置帧位置
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_id)
            
            ret, frame = cap.read()
            if not ret:
                logger.warning(f"无法读取帧 {frame_id}, 跳过")
                continue
                
            # 构建输出文件路径
            output_path = os.path.join(output_dir, f"frame_{frame_count:04d}.{format}")
            
            # 根据格式保存图像
            if format.lower() == 'jpg' or format.lower() == 'jpeg':
                cv2.imwrite(output_path, frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
            elif format.lower() == 'png':
                cv2.imwrite(output_path, frame, [cv2.IMWRITE_PNG_COMPRESSION, min(9, max(0, 10 - quality // 10))])
            else:
                cv2.imwrite(output_path, frame)
                
            frame_count += 1
            
            # 每提取10帧打印一次日志
            if frame_count % 10 == 0:
                logger.info(f"已提取 {frame_count} 帧")
                
        cap.release()
        logger.info(f"提取完成, 总共提取了 {frame_count} 帧")
        
        return frame_count
    except Exception as e:
        logger.error(f"提取帧时出错: {str(e)}", exc_info=True)
        raise

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('DEBUG', 'False').lower() == 'true') 