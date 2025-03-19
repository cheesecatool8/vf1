// 提取视频帧
const extractFrames = async () => {
  if (!videoFile && !videoUrl) {
    message.error('请先上传视频或提供视频URL');
    return;
  }
  
  setIsExtracting(true);
  setProgress(0);
  
  try {
    // 准备API请求数据
    const data = {
      videoPath: videoFile.name,
      fps: selectedFps,
      quality: selectedQuality,
      format: 'jpg',
      startTime: startTime || '',
      endTime: endTime || ''
    };
    
    // 调用提取帧API
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/extract-frames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '提取帧失败');
    }
    
    const result = await response.json();
    
    // 更新帧数据，使用代理URL处理可能的CORS问题
    const framesWithProxy = result.frames.map(frame => {
      return {
        ...frame,
        url: frame.url.includes('storage.y.cheesecatool.com') 
          ? `${process.env.REACT_APP_API_URL}/api/proxy-image?url=${encodeURIComponent(frame.url)}`
          : frame.url
      };
    });
    
    // 更新帧信息
    setFrames(framesWithProxy);
    message.success(`成功提取 ${framesWithProxy.length} 帧`);
    
    // 转到帧浏览页面
    setCurrentStep(2);
  } catch (error) {
    console.error('提取帧出错:', error);
    message.error(`提取帧失败: ${error.message}`);
  } finally {
    setIsExtracting(false);
  }
}; 