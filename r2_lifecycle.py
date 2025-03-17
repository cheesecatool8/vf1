import logging
from datetime import datetime, timedelta
from r2_storage import R2Storage

class R2Lifecycle:
    def __init__(self, r2_storage):
        self.r2_storage = r2_storage
        self.logger = logging.getLogger(__name__)

    def _get_expired_files(self, prefix, expiration_hours=1):
        """获取超过指定时间的文件列表"""
        try:
            objects = self.r2_storage.list_files(prefix)
            expired_files = []
            now = datetime.utcnow()
            
            for obj in objects:
                if obj.get('LastModified'):
                    last_modified = obj['LastModified']
                    if isinstance(last_modified, str):
                        last_modified = datetime.fromisoformat(last_modified.replace('Z', '+00:00'))
                    
                    # 检查文件是否超过1小时
                    if now - last_modified > timedelta(hours=expiration_hours):
                        expired_files.append(obj['Key'])
            
            return expired_files
        except Exception as e:
            self.logger.error(f"获取过期文件列表失败: {str(e)}")
            return []

    def cleanup_expired_files(self):
        """清理过期文件"""
        try:
            # 检查视频文件
            expired_videos = self._get_expired_files('videos/')
            for video_key in expired_videos:
                try:
                    self.r2_storage.delete_file(video_key)
                    self.logger.info(f"已删除过期视频: {video_key}")
                except Exception as e:
                    self.logger.error(f"删除视频失败 {video_key}: {str(e)}")

            # 检查帧文件
            expired_frames = self._get_expired_files('frames/')
            for frame_key in expired_frames:
                try:
                    self.r2_storage.delete_file(frame_key)
                    self.logger.info(f"已删除过期帧: {frame_key}")
                except Exception as e:
                    self.logger.error(f"删除帧失败 {frame_key}: {str(e)}")

            return len(expired_videos) + len(expired_frames)
        except Exception as e:
            self.logger.error(f"清理过期文件失败: {str(e)}")
            return 0

    def _cleanup_prefix(self, prefix, expiration_time):
        """清理指定前缀的过期文件"""
        try:
            # 列出所有文件
            files = self.r2_storage.list_files(prefix)
            
            for file in files:
                # 获取文件的最后修改时间
                last_modified = file.get('LastModified')
                if last_modified and last_modified < expiration_time:
                    # 删除过期文件
                    if self.r2_storage.delete_file(file['Key']):
                        self.logger.info(f"已删除过期文件: {file['Key']}")
                    else:
                        self.logger.warning(f"删除文件失败: {file['Key']}")
        except Exception as e:
            self.logger.error(f"清理 {prefix} 目录时出错: {str(e)}") 