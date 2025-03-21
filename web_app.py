import os
import time
import json
import requests
import logging
from functools import wraps
from flask import Flask, request, jsonify, send_file, redirect
from werkzeug.utils import secure_filename
from extract_frames import extract_frames
from r2_storage import R2Storage

app = Flask(__name__)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 从config模块导入配置
try:
    from config import (
        SECRET_KEY, 
        UPLOAD_FOLDER, 
        FRAMES_FOLDER, 
        ALLOWED_EXTENSIONS,
        MAX_CONTENT_LENGTH,
        FRAMES_BASE_URL,
        CORS_ORIGINS
    )
    logger.info("从config.py加载配置成功")
except ImportError as e:
    logger.warning(f"无法导入配置模块: {str(e)}，使用默认配置")
    # 默认配置
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key')
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    FRAMES_FOLDER = os.environ.get('FRAMES_FOLDER', 'frames')
    ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'}
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 500 * 1024 * 1024))  # 500MB
    FRAMES_BASE_URL = os.environ.get('FRAMES_BASE_URL', '')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

# 设置Flask应用配置
app.config['SECRET_KEY'] = SECRET_KEY
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['FRAMES_FOLDER'] = FRAMES_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['FRAMES_BASE_URL'] = FRAMES_BASE_URL

# 初始化R2存储
r2_storage = R2Storage()

# 确保上传和帧目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FRAMES_FOLDER, exist_ok=True)

# CORS支持
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    
    # 如果没有Origin头或CORS_ORIGINS为*，则允许所有
    if CORS_ORIGINS == ['*']:
        response.headers.add('Access-Control-Allow-Origin', '*')
    elif origin and origin in CORS_ORIGINS:
        response.headers.add('Access-Control-Allow-Origin', origin)
    
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# 检查文件扩展名是否允许
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 主页
@app.route('/')
def index():
    return jsonify({
        'message': 'Video Frame Extractor API',
        'version': '1.0',
        'endpoints': [
            '/api/extract-frames',
            '/api/upload-video',
            '/frames/<folder_name>',
            '/download/<folder_name>/<filename>',
            '/api/get-frame-image'
        ]
    })

# 上传视频
@app.route('/api/upload-video', methods=['POST'])
def upload_video():
    """处理视频上传请求"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': '未找到视频文件'}), 400
            
        file = request.files['video']
        
        if file.filename == '':
            return jsonify({'error': '未选择文件'}), 400
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # 添加时间戳，避免文件名冲突
            timestamp = int(time.time())
            filename = f"{timestamp}_{filename}"
            
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            return jsonify({
                'success': True,
                'filename': filename,
                'path': filepath,
                'size': os.path.getsize(filepath)
            })
        else:
            return jsonify({'error': '不支持的文件类型'}), 400
    except Exception as e:
        logger.error(f"上传视频时出错: {str(e)}", exc_info=True)
        return jsonify({'error': f'上传视频失败: {str(e)}'}), 500

# 提取帧
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
        response = requests.get(url, stream=True)
        if response.status_code != 200:
            return jsonify({"error": f"Failed to fetch image: {response.status_code}"}), response.status_code
        
        return send_file(
            response.raw,
            mimetype=response.headers.get('content-type', 'image/jpeg'),
            as_attachment=False,
            download_name=url.split('/')[-1]
        )
    except Exception as e:
        logger.error(f"代理图片请求失败: {str(e)}")
        return jsonify({"error": f"Failed to proxy image: {str(e)}"}), 500

@app.route('/api/get-frame-image')
def get_frame_image():
    """获取帧图片，通过R2存储直接获取"""
    filepath = request.args.get('filepath')
    if not filepath:
        return jsonify({"error": "Missing filepath parameter"}), 400
    
    try:
        logger.info(f"请求帧图片: {filepath}")
        
        # 从R2存储获取文件内容
        file_content = r2_storage.get_file(filepath)
        if not file_content:
            logger.warning(f"未找到帧图片: {filepath}")
            return jsonify({"error": "Frame image not found"}), 404
        
        # 确定内容类型
        content_type = 'image/jpeg'  # 默认
        if filepath.endswith('.png'):
            content_type = 'image/png'
            
        return send_file(
            file_content,
            mimetype=content_type,
            as_attachment=False,
            download_name=os.path.basename(filepath)
        )
    except Exception as e:
        logger.error(f"获取帧图片失败: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to get frame image: {str(e)}"}), 500

# 启动服务器
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port) 