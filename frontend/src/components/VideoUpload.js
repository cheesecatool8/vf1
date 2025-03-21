import React, { useState, useEffect } from 'react';

function VideoUpload({ videoFile, onExtract, language, translations }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [estimatedFrames, setEstimatedFrames] = useState(0);
  const [fps, setFps] = useState(1);

  // 获取翻译文本
  const getText = (key) => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };
  
  // 当文件变化时创建临时URL
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      
      // 加载视频元数据以获取时长
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        // 使用当前fps计算预计帧数
        setEstimatedFrames(Math.ceil(video.duration * fps));
      };
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile, fps]);
  
  // 帧率变化时更新预计帧数
  useEffect(() => {
    if (videoDuration > 0) {
      setEstimatedFrames(Math.ceil(videoDuration * fps));
    }
  }, [fps, videoDuration]);
  
  const handleFpsChange = (e) => {
    setFps(parseFloat(e.target.value));
  };

  return videoUrl ? (
    <div className="video-preview">
      <video src={videoUrl} controls className="preview-video" />
      
      <div className="video-info">
        <p>{getText('videoLength')} {Math.round(videoDuration)} {getText('seconds')}</p>
        <p>{getText('estimatedFrames')} {estimatedFrames}</p>
        
        <div className="fps-control">
          <label htmlFor="fps-select">{getText('fps')}</label>
          <select id="fps-select" value={fps} onChange={handleFpsChange}>
            <option value="0.5">0.5 ({getText('framesPer2Sec')})</option>
            <option value="1">1 ({getText('framesPerSec')})</option>
            <option value="2">2 ({getText('framesPerSec2')})</option>
            <option value="5">5 ({getText('framesPerSec5')})</option>
            <option value="10">10 ({getText('framesPerSec10')})</option>
            <option value="15">15 ({getText('framesPerSec15')})</option>
            <option value="30">30 ({getText('framesPerSec30')})</option>
          </select>
        </div>
        
        <button 
          className="extract-button"
          onClick={() => onExtract({ fps })}
        >
          {getText('uploadVideo')}
        </button>
      </div>
    </div>
  ) : null;
}

export default VideoUpload; 