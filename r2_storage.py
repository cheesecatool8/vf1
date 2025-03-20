import boto3
from botocore.config import Config
from config import (
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    CACHE_CONTROL
)
import logging

logger = logging.getLogger(__name__)

class R2Storage:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4')
        )
        self.bucket = R2_BUCKET_NAME

    def upload_file(self, file_path, object_name, content_type=None):
        """上传文件到 R2 存储"""
        try:
            logger.info(f"开始上传文件到R2: {file_path} -> {object_name}")
            
            extra_args = {
                'CacheControl': CACHE_CONTROL
            }
            if content_type:
                extra_args['ContentType'] = content_type
                
            logger.info(f"上传参数: bucket={self.bucket}, extra_args={extra_args}")

            self.s3.upload_file(
                file_path,
                self.bucket,
                object_name,
                ExtraArgs=extra_args
            )
            
            logger.info(f"文件成功上传到R2: {object_name}")
            return True
        except Exception as e:
            logger.error(f"上传文件到 R2 失败: {str(e)}", exc_info=True)
            return False

    def upload_fileobj(self, file_obj, object_name, content_type=None):
        """上传文件对象到 R2 存储"""
        try:
            extra_args = {
                'CacheControl': CACHE_CONTROL
            }
            if content_type:
                extra_args['ContentType'] = content_type

            self.s3.upload_fileobj(
                file_obj,
                self.bucket,
                object_name,
                ExtraArgs=extra_args
            )
            return True
        except Exception as e:
            logger.error(f"上传文件对象到 R2 失败: {str(e)}")
            return False

    def download_file(self, object_name, file_path):
        """从 R2 存储下载文件"""
        try:
            self.s3.download_file(self.bucket, object_name, file_path)
            return True
        except Exception as e:
            logger.error(f"从 R2 下载文件失败: {str(e)}")
            return False

    def get_presigned_url(self, object_name, expiration=3600):
        """获取预签名 URL"""
        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket,
                    'Key': object_name
                },
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.error(f"生成预签名 URL 失败: {str(e)}")
            return None

    def delete_file(self, object_name):
        """删除 R2 存储中的文件"""
        try:
            self.s3.delete_object(Bucket=self.bucket, Key=object_name)
            return True
        except Exception as e:
            logger.error(f"删除 R2 文件失败: {str(e)}")
            return False

    def list_files(self, prefix=''):
        """列出指定前缀的所有文件"""
        try:
            response = self.s3.list_objects_v2(
                Bucket=self.bucket,
                Prefix=prefix
            )
            return response.get('Contents', [])
        except Exception as e:
            logger.error(f"列出 R2 文件失败: {str(e)}")
            return []

    def get_file(self, object_name):
        """获取文件内容"""
        try:
            response = self.s3.get_object(
                Bucket=self.bucket,
                Key=object_name
            )
            return response['Body'].read()
        except Exception as e:
            logger.error(f"获取文件内容失败: {str(e)}")
            return None 