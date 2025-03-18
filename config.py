import os
from dotenv import load_dotenv

load_dotenv()

# R2 配置
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME', 'cheesecatool')

# Worker URL
WORKER_URL = os.getenv('WORKER_URL', 'https://storage-worker.imluluj8-7a3.workers.dev')

# 允许的文件类型
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'}

# 最大文件大小 (500MB)
MAX_CONTENT_LENGTH = 500 * 1024 * 1024

# CORS 设置 - 确保允许前端域名
CORS_ORIGINS = [
    'https://video-frame.pages.dev',    # 主域名
    'https://*.video-frame.pages.dev',  # 子域名
    'http://localhost:3000',            # 本地开发
    '*'                                 # 临时允许所有域名
]

# 默认参数
DEFAULT_FPS = 1.0
DEFAULT_QUALITY = 90  # 使用合理的整数值
DEFAULT_FORMAT = 'jpg'

# 调试模式
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# 打印配置信息便于调试
if DEBUG:
    print("=== 配置信息 ===")
    print(f"R2_BUCKET_NAME: {R2_BUCKET_NAME}")
    print(f"WORKER_URL: {WORKER_URL}")
    print(f"CORS_ORIGINS: {CORS_ORIGINS}")
    print(f"DEFAULT_QUALITY: {DEFAULT_QUALITY} (类型: {type(DEFAULT_QUALITY).__name__})")
    print("================")

# Cloudflare 配置
CF_ZONE_ID = os.getenv('CF_ZONE_ID')
CF_API_TOKEN = os.getenv('CF_API_TOKEN')

# 缓存配置
CACHE_CONTROL = 'public, max-age=31536000'  # 1年缓存 