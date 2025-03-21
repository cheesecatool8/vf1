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

  // 获取翻译文本
  const getText = (key) => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };

  // 点击上传区域触发文件选择
  const handleAreaClick = () => {
    if (!videoFile && videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  // 处理文件选择
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  // 拖拽事件
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        processFile(file);
      } else {
        alert('请上传视频文件');
      }
    }
  };

  // 处理上传的文件
  const processFile = (file) => {
    setVideoFile(file);
    onVideoUpload(file);
    
    // 创建预览URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // 在组件卸载时清理URL
    return () => URL.revokeObjectURL(objectUrl);
  };

  // 移除已选择的文件
  const removeFile = () => {
    setVideoFile(null);
    setPreviewUrl(null);
    setVideoDuration(0);
    setEstimatedFrameCount(0);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
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
        className={`upload-area ${dragging ? 'dragging' : ''} ${videoFile ? 'has-preview' : ''}`}
        onClick={handleAreaClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!videoFile ? (
          <div className="upload-label">
            <div className="upload-icon">
              <img src="images/upload-icon.png" alt="上传" style={{width: '64px', height: '64px', margin: '0 auto'}} />
            </div>
            <div className="upload-text">{getText('uploadTitle')}</div>
            <div className="upload-hint">{getText('supportedFormats')}</div>
            <input 
              type="file" 
              className="hidden-input" 
              accept="video/*" 
              onChange={handleFileChange}
              ref={videoInputRef}
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
                  removeFile();
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
            <option value="0.5">0.5 (每2秒1帧)</option>
            <option value="1">1 (每秒1帧)</option>
            <option value="2">2 (每秒2帧)</option>
            <option value="5">5 (每秒5帧)</option>
            <option value="10">10 (每秒10帧)</option>
            <option value="15">15 (每秒15帧)</option>
            <option value="30">30 (每秒30帧)</option>
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