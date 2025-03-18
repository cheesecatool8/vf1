import cv2
import os
import argparse
import logging

# 配置日志
logger = logging.getLogger(__name__)

def extract_frames(video_path, output_dir, fps=1, start_time=None, end_time=None, format="jpg", quality=90):
    """
    从视频中提取帧
    
    参数:
    video_path: 视频文件路径
    output_dir: 输出目录
    fps: 每秒提取的帧数
    start_time: 开始提取的时间(秒)
    end_time: 结束提取的时间(秒)
    format: 输出图像格式(jpg或png)
    quality: 输出图像质量(1-100)
    
    返回: 
    int - 提取的帧数量
    """
    logger.info(f"开始处理视频: {video_path}")
    logger.info(f"参数: fps={fps}, start_time={start_time}, end_time={end_time}, format={format}, quality={quality}")
    
    # 检查输入参数
    if not os.path.exists(video_path):
        err_msg = f"视频文件不存在: {video_path}"
        logger.error(err_msg)
        raise FileNotFoundError(err_msg)
    
    # 确保quality是整数
    try:
        quality = int(quality)
        if quality < 1 or quality > 100:
            logger.warning(f"质量参数超出范围(1-100): {quality}，使用默认值90")
            quality = 90
    except (ValueError, TypeError) as e:
        logger.warning(f"质量参数无效: {quality}, 错误: {e}，使用默认值90")
        quality = 90
    
    # 确保fps是浮点数
    try:
        fps = float(fps)
        if fps <= 0:
            logger.warning(f"fps参数必须大于0: {fps}，使用默认值1")
            fps = 1.0
    except (ValueError, TypeError) as e:
        logger.warning(f"fps参数无效: {fps}, 错误: {e}，使用默认值1")
        fps = 1.0
    
    # 确保输出目录存在
    if not os.path.exists(output_dir):
        logger.info(f"创建输出目录: {output_dir}")
        os.makedirs(output_dir)
    
    # 打开视频文件
    logger.info(f"打开视频文件: {video_path}")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        err_msg = f"无法打开视频文件: {video_path}"
        logger.error(err_msg)
        raise ValueError(err_msg)
    
    try:
        # 获取视频属性
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / video_fps
        
        logger.info(f"视频属性: fps={video_fps}, 总帧数={frame_count}, 时长={duration}秒")
        
        # 计算提取帧的间隔
        frame_interval = int(video_fps / fps)
        if frame_interval < 1:
            frame_interval = 1
        
        logger.info(f"提取帧间隔: {frame_interval}帧")
        
        # 计算开始和结束帧
        start_frame = 0
        if start_time is not None:
            start_frame = int(start_time * video_fps)
        
        end_frame = frame_count
        if end_time is not None:
            end_frame = int(end_time * video_fps)
        
        logger.info(f"提取范围: 开始帧={start_frame}, 结束帧={end_frame}")
        
        # 设置文件扩展名和保存参数
        if format.lower() == "jpg":
            ext = ".jpg"
            save_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        else:
            ext = ".png"
            save_params = [cv2.IMWRITE_PNG_COMPRESSION, min(9, 10 - int(quality / 10))]
        
        logger.info(f"输出格式: {format}, 参数: {save_params}")
        
        # 移动到起始帧
        if start_frame > 0:
            logger.info(f"移动到起始帧: {start_frame}")
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        
        # 提取帧
        frame_number = start_frame
        count = 0
        
        logger.info("开始提取帧...")
        while frame_number < end_frame:
            ret, frame = cap.read()
            if not ret:
                logger.warning(f"读取第{frame_number}帧失败，提前结束")
                break
            
            if frame_number % frame_interval == 0:
                output_path = os.path.join(output_dir, f"frame_{count:06d}{ext}")
                cv2.imwrite(output_path, frame, save_params)
                count += 1
                
                if count % 10 == 0:
                    logger.info(f"已提取 {count} 帧")
            
            frame_number += 1
        
        logger.info(f"提取完成，共 {count} 帧")
        return count
    except Exception as e:
        logger.error(f"提取帧过程中出错: {str(e)}", exc_info=True)
        raise
    finally:
        cap.release()
        logger.info("释放视频资源")

def main():
    parser = argparse.ArgumentParser(description="从视频中提取帧")
    parser.add_argument("video_path", help="视频文件路径")
    parser.add_argument("output_dir", help="输出目录")
    parser.add_argument("--fps", type=float, default=1, help="每秒提取的帧数")
    parser.add_argument("--start", type=float, help="开始提取的时间(秒)")
    parser.add_argument("--end", type=float, help="结束提取的时间(秒)")
    parser.add_argument("--format", choices=["jpg", "png"], default="jpg", help="输出图像格式")
    parser.add_argument("--quality", type=int, default=90, help="输出图像质量(1-100)")
    
    args = parser.parse_args()
    
    # 配置日志
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    try:
        frames = extract_frames(
            args.video_path,
            args.output_dir,
            fps=args.fps,
            start_time=args.start,
            end_time=args.end,
            format=args.format,
            quality=args.quality
        )
        
        print(f"已提取 {frames} 帧")
    except Exception as e:
        print(f"错误: {e}")
        exit(1)

if __name__ == "__main__":
    main() 