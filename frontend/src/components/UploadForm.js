import React, { useState, useEffect, useRef } from 'react';

function UploadForm({ onVideoUpload, onExtractFrames, language, translations }) {
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fps, setFps] = useState(1);
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState('jpg');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dragging, setDragging] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [estimatedFrameCount, setEstimatedFrameCount] = useState(0);
  const videoInputRef = useRef(null);
  const uploadAreaRef = useRef(null);
  const videoRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 获取翻译文本
  const getText = (key) => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };

  // 帧率选项翻译
  const getFpsOptions = () => {
    const fpsLabels = {
      en: {
        "0.5": "0.5 (1 frame per 2 seconds)",
        "1": "1 (1 frame per second)",
        "2": "2 (2 frames per second)",
        "5": "5 (5 frames per second)",
        "10": "10 (10 frames per second)",
        "15": "15 (15 frames per second)",
        "30": "30 (30 frames per second)"
      },
      zh: {
        "0.5": "0.5 (每秒0.5帧)",
        "1": "1 (每秒1帧)",
        "2": "2 (每秒2帧)",
        "5": "5 (每秒5帧)",
        "10": "10 (每秒10帧)",
        "15": "15 (每秒15帧)",
        "30": "30 (每秒30帧)"
      },
      ja: {
        "0.5": "0.5 (2秒間に1フレーム)",
        "1": "1 (1秒間に1フレーム)",
        "2": "2 (1秒間に2フレーム)",
        "5": "5 (1秒間に5フレーム)",
        "10": "10 (1秒間に10フレーム)",
        "15": "15 (1秒間に15フレーム)",
        "30": "30 (1秒間に30フレーム)"
      },
      ko: {
        "0.5": "0.5 (2초당 1프레임)",
        "1": "1 (1초당 1프레임)",
        "2": "2 (1초당 2프레임)",
        "5": "5 (1초당 5프레임)",
        "10": "10 (1초당 10프레임)",
        "15": "15 (1초당 15프레임)",
        "30": "30 (1초당 30프레임)"
      },
      es: {
        "0.5": "0.5 (1 fotograma cada 2 segundos)",
        "1": "1 (1 fotograma por segundo)",
        "2": "2 (2 fotogramas por segundo)",
        "5": "5 (5 fotogramas por segundo)",
        "10": "10 (10 fotogramas por segundo)",
        "15": "15 (15 fotogramas por segundo)",
        "30": "30 (30 fotogramas por segundo)"
      },
      fr: {
        "0.5": "0.5 (1 image toutes les 2 secondes)",
        "1": "1 (1 image par seconde)",
        "2": "2 (2 images par seconde)",
        "5": "5 (5 images par seconde)",
        "10": "10 (10 images par seconde)",
        "15": "15 (15 images par seconde)",
        "30": "30 (30 images par seconde)"
      },
      de: {
        "0.5": "0.5 (1 Frame alle 2 Sekunden)",
        "1": "1 (1 Frame pro Sekunde)",
        "2": "2 (2 Frames pro Sekunde)",
        "5": "5 (5 Frames pro Sekunde)",
        "10": "10 (10 Frames pro Sekunde)",
        "15": "15 (15 Frames pro Sekunde)",
        "30": "30 (30 Frames pro Sekunde)"
      }
    };
    
    // 如果没有当前语言的翻译，使用英文
    const currentLabels = fpsLabels[language] || fpsLabels.en;
    
    return [
      { value: 0.5, label: currentLabels["0.5"] },
      { value: 1, label: currentLabels["1"] },
      { value: 2, label: currentLabels["2"] },
      { value: 5, label: currentLabels["5"] },
      { value: 10, label: currentLabels["10"] },
      { value: 15, label: currentLabels["15"] },
      { value: 30, label: currentLabels["30"] }
    ];
  };

  // 处理文件选择或拖拽
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i))) {
      onVideoUpload(file);
    } else {
      alert(getText('invalidVideoFile'));
    }
  };

  // 处理拖拽事件
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i))) {
      onVideoUpload(file);
    } else {
      alert(getText('invalidVideoFile'));
    }
  };

  // 点击上传区域触发文件选择
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // 当视频加载时获取持续时间
  const handleVideoLoad = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      
      // 计算估计的帧数
      const startT = startTime ? parseFloat(startTime) : 0;
      const endT = endTime ? parseFloat(endTime) : duration;
      
      if (endT > startT) {
        const effectiveDuration = endT - startT;
        const frames = Math.ceil(effectiveDuration * fps);
        setEstimatedFrameCount(frames);
      } else {
        setEstimatedFrameCount(0);
      }
    }
  };

  // 当fps、开始时间或结束时间改变时重新计算估计帧数
  useEffect(() => {
    if (videoDuration > 0) {
      const startT = startTime ? parseFloat(startTime) : 0;
      const endT = endTime ? parseFloat(endTime) : videoDuration;
      
      if (endT > startT) {
        const effectiveDuration = endT - startT;
        const frames = Math.ceil(effectiveDuration * fps);
        setEstimatedFrameCount(frames);
      } else {
        setEstimatedFrameCount(0);
      }
    }
  }, [fps, startTime, endTime, videoDuration]);

  // 提交表单
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!videoFile) {
      alert('请先上传视频文件');
      return;
    }
    
    const options = {
      fps: fps,
      quality: quality,
      format: format,
      startTime: startTime || null,
      endTime: endTime || null
    };
    
    onExtractFrames(options);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div 
        ref={uploadAreaRef}
        className={`upload-area ${isDragging ? 'dragging' : ''} ${videoFile ? 'has-preview' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        {!videoFile ? (
          <div className="upload-label">
            <div className="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="upload-text">
              <p>{getText('dragDropText')}</p>
              <p className="upload-format">{getText('supportedFormats')}</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="video/*,.mp4,.webm,.mov,.avi,.mkv"
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-preview-header">
              <div className="file-info">
                <div className="file-name" title={videoFile.name}>{videoFile.name}</div>
                <div className="file-size">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</div>
              </div>
              <button 
                type="button" 
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoFile(null);
                  setPreviewUrl(null);
                  setVideoDuration(0);
                  setEstimatedFrameCount(0);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                移除
              </button>
            </div>
            
            <div className="video-preview-container">
              <video 
                className="video-preview" 
                src={previewUrl} 
                controls 
                ref={videoRef}
                onLoadedMetadata={handleVideoLoad}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* 如果有视频并且已加载持续时间，显示估计帧数 */}
      {videoFile && estimatedFrameCount > 0 && (
        <div className="extraction-summary">
          <p>视频长度: <strong>{Math.floor(videoDuration / 60)}分{Math.floor(videoDuration % 60)}秒</strong> | 估计将提取 <strong>{estimatedFrameCount}</strong> 帧</p>
        </div>
      )}
      
      <div className="extraction-options">
        <h3 className="options-title">提取选项</h3>
        
        <div className="form-group">
          <label htmlFor="fps">{getText('fps')}</label>
          <select 
            id="fps" 
            value={fps} 
            onChange={(e) => setFps(parseFloat(e.target.value))}
          >
            {getFpsOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="format">{getText('imageFormat')}</label>
          <select 
            id="format" 
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="quality">
            {getText('imageQuality')} <span className="quality-display">{quality}</span>
          </label>
          <input 
            type="range" 
            id="quality" 
            min="10" 
            max="100" 
            value={quality} 
            onChange={(e) => setQuality(parseInt(e.target.value))}
          />
        </div>
        
        <div className="param-group">
          <div className="form-group">
            <label htmlFor="startTime">{getText('startTime')}</label>
            <input 
              type="number" 
              id="startTime" 
              min="0" 
              step="0.1" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)}
              placeholder={language === 'zh' ? "从视频开始" : "From video start"}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endTime">{getText('endTime')}</label>
            <input 
              type="number" 
              id="endTime" 
              min="0" 
              step="0.1" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)}
              placeholder={language === 'zh' ? "到视频结束" : "To video end"}
            />
          </div>
        </div>
        
        <button type="submit" className="extract-btn">{getText('extractButton')}</button>
      </div>
    </form>
  );
}

export default UploadForm; 