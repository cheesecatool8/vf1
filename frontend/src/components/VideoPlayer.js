import React, { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

function VideoPlayer({ video, language, translations }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [expectedFrames, setExpectedFrames] = useState(0);
  const [currentFps, setCurrentFps] = useState(1);

  // 获取翻译文本
  const getText = (key) => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };

  useEffect(() => {
    if (videoRef.current && video) {
      videoRef.current.src = URL.createObjectURL(video);
      
      videoRef.current.onloadedmetadata = () => {
        setDuration(videoRef.current.duration);
        
        // 估算默认帧率(1fps)下的预计帧数
        setExpectedFrames(Math.ceil(videoRef.current.duration));
      };
    }
  }, [video]);

  // 更新帧率时重新计算预期帧数
  const updateExpectedFrames = (fps) => {
    setCurrentFps(fps);
    setExpectedFrames(Math.ceil(duration * fps));
  };

  return (
    <div className="video-preview">
      <video ref={videoRef} controls className="preview-video"></video>
      
      {duration > 0 && (
        <div className="video-info">
          <p>{getText('videoDuration')}: {duration.toFixed(2)} {getText('seconds')}</p>
          <p>{getText('estimatedFrames')}: {expectedFrames} ({currentFps} {getText('framesPerSecond')})</p>
          
          <div className="fps-selector">
            <label>{getText('selectFps')}:</label>
            <div className="fps-buttons">
              <button type="button" onClick={() => updateExpectedFrames(0.5)}>0.5 fps</button>
              <button type="button" onClick={() => updateExpectedFrames(1)}>1 fps</button>
              <button type="button" onClick={() => updateExpectedFrames(2)}>2 fps</button>
              <button type="button" onClick={() => updateExpectedFrames(5)}>5 fps</button>
              <button type="button" onClick={() => updateExpectedFrames(10)}>10 fps</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer; 