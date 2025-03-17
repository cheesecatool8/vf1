import os
from dotenv import load_dotenv

load_dotenv()

# R2 配置
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME', 'cheesecatool')

# Worker URL
WORKER_URL = os.getenv('WORKER_URL', 'https://your-worker.your-domain.workers.dev')

# 允许的文件类型
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'}

# 最大文件大小 (500MB)
MAX_CONTENT_LENGTH = 500 * 1024 * 1024

# CORS 设置
CORS_ORIGINS = ['*']

# 默认参数
DEFAULT_FPS = 1.0
DEFAULT_QUALITY = 95
DEFAULT_FORMAT = 'jpg'

# Cloudflare 配置
CF_ZONE_ID = os.getenv('CF_ZONE_ID')
CF_API_TOKEN = os.getenv('CF_API_TOKEN')

# 缓存配置
CACHE_CONTROL = 'public, max-age=31536000'  # 1年缓存 