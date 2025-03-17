import cv2
import os
import argparse

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
    """
    # 确保输出目录存在
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 打开视频文件
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")
    
    # 获取视频属性
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / video_fps
    
    # 计算提取帧的间隔
    frame_interval = int(video_fps / fps)
    if frame_interval < 1:
        frame_interval = 1
    
    # 计算开始和结束帧
    start_frame = 0
    if start_time is not None:
        start_frame = int(start_time * video_fps)
    
    end_frame = frame_count
    if end_time is not None:
        end_frame = int(end_time * video_fps)
    
    # 设置文件扩展名和保存参数
    if format.lower() == "jpg":
        ext = ".jpg"
        save_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    else:
        ext = ".png"
        save_params = [cv2.IMWRITE_PNG_COMPRESSION, min(9, 10 - int(quality / 10))]
    
    # 移动到起始帧
    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    
    # 提取帧
    frame_number = start_frame
    count = 0
    
    while frame_number < end_frame:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_number % frame_interval == 0:
            output_path = os.path.join(output_dir, f"frame_{count:06d}{ext}")
            cv2.imwrite(output_path, frame, save_params)
            count += 1
        
        frame_number += 1
    
    cap.release()
    
    return count

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

if __name__ == "__main__":
    main() 