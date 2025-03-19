import React, { useState, useRef } from 'react';

function UploadForm({ onVideoUpload, onVideoUrl, onExtractFrames }) {
  const [url, setUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file');
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [extractionOptions, setExtractionOptions] = useState({
    fps: 1,
    quality: 90,
    format: 'jpg',
    startTime: '',
    endTime: '',
  });

  // 拖放相关处理函数
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
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.includes('video')) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.includes('video')) {
      setFileName(file.name);
      
      // 为视频创建预览URL
      const videoUrl = URL.createObjectURL(file);
      setFilePreview(videoUrl);
      
      onVideoUpload(file);
      
      // 自动跳转到提取选项区域
      document.querySelector('.extraction-options').scrollIntoView({ 
        behavior: 'smooth' 
      });
    }
  };

  const handleRemoveFile = () => {
    setFilePreview(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onVideoUrl(url);
      // 自动跳转到提取选项区域
      document.querySelector('.extraction-options').scrollIntoView({ 
        behavior: 'smooth' 
      });
    }
  };

  const handleExtractionSubmit = (e) => {
    e.preventDefault();
    onExtractFrames(extractionOptions);
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quality') {
      let qualityValue = 90;
      
      switch(value) {
        case 'low':
          qualityValue = 60;
          break;
        case 'medium':
          qualityValue = 80;
          break;
        case 'high':
          qualityValue = 95;
          break;
        default:
          qualityValue = parseInt(value) || 90;
      }
      
      setExtractionOptions({
        ...extractionOptions,
        [name]: qualityValue,
      });
    } else {
      setExtractionOptions({
        ...extractionOptions,
        [name]: value,
      });
    }
  };

  // 计算预计提取的帧数
  const calculateEstimatedFrames = () => {
    const { fps, startTime, endTime } = extractionOptions;
    if (fps === 'all') return '全部帧';
    
    const start = parseFloat(startTime) || 0;
    const end = parseFloat(endTime) || 0;
    
    if (end > start) {
      return `约 ${Math.ceil((end - start) * parseFloat(fps))} 帧`;
    }
    return `每秒 ${fps} 帧`;
  };

  return (
    <div>
      <div className="form-group">
        <div className="upload-tabs">
          <button
            className={`tab-btn ${uploadMethod === 'file' ? 'active' : ''}`}
            onClick={() => setUploadMethod('file')}
            type="button"
          >
            上传视频文件
          </button>
          <button
            className={`tab-btn ${uploadMethod === 'url' ? 'active' : ''}`}
            onClick={() => setUploadMethod('url')}
            type="button"
          >
            使用视频URL
          </button>
        </div>

        {uploadMethod === 'file' ? (
          <div 
            className={`upload-area ${isDragging ? 'dragging' : ''} ${filePreview ? 'has-preview' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!filePreview ? (
              <>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden-input"
                  id="video-upload"
                  ref={fileInputRef}
                />
                <label
                  htmlFor="video-upload"
                  className="upload-label"
                >
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V8M12 8L8 12M12 8L16 12" stroke="#bdc3c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#bdc3c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="upload-text">
                    点击选择视频文件或拖放到此处
                  </p>
                  <p className="upload-hint">
                    支持的格式: MP4, AVI, MOV, WMV, FLV
                  </p>
                </label>
              </>
            ) : (
              <div className="file-preview">
                <div className="file-preview-header">
                  <div className="file-info">
                    <span className="file-name">{fileName}</span>
                  </div>
                  <button 
                    className="remove-file-btn" 
                    onClick={handleRemoveFile}
                    type="button"
                  >
                    删除
                  </button>
                </div>
                <div className="video-preview-container">
                  <video 
                    src={filePreview} 
                    className="video-preview" 
                    controls
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleUrlSubmit} className="url-form">
            <div className="form-group">
              <label htmlFor="video-url">视频URL</label>
              <div className="url-input-group">
                <input
                  type="text"
                  id="video-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="输入视频URL"
                  className="url-input"
                  required
                />
                <button
                  type="submit"
                  className="url-btn"
                >
                  加载
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="form-group extraction-options">
        <h3 className="options-title">提取选项</h3>
        <form onSubmit={handleExtractionSubmit}>
          <div className="param-group">
            <div className="form-group">
              <label htmlFor="fps">帧率 (FPS)</label>
              <select
                id="fps"
                name="fps"
                value={extractionOptions.fps}
                onChange={handleOptionChange}
              >
                <option value="1">1 (每秒1帧)</option>
                <option value="5">5 (每秒5帧)</option>
                <option value="10">10 (每秒10帧)</option>
                <option value="15">15 (每秒15帧)</option>
                <option value="30">30 (每秒30帧)</option>
                <option value="all">全部帧</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quality">图像质量</label>
              <select
                id="quality"
                name="quality"
                value={
                  extractionOptions.quality <= 60 ? 'low' :
                  extractionOptions.quality <= 80 ? 'medium' : 'high'
                }
                onChange={handleOptionChange}
              >
                <option value="low">低 (体积小)</option>
                <option value="medium">中</option>
                <option value="high">高 (无损)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="format">图像格式</label>
              <select
                id="format"
                name="format"
                value={extractionOptions.format}
                onChange={handleOptionChange}
              >
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startTime">开始时间 (秒)</label>
              <input
                type="number"
                id="startTime"
                name="startTime"
                placeholder="可选"
                value={extractionOptions.startTime}
                onChange={handleOptionChange}
                min="0"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">结束时间 (秒)</label>
              <input
                type="number"
                id="endTime"
                name="endTime"
                placeholder="可选"
                value={extractionOptions.endTime}
                onChange={handleOptionChange}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="extraction-summary">
            <p>预计提取: <strong>{calculateEstimatedFrames()}</strong></p>
          </div>

          <button
            type="submit"
            className="extract-btn"
          >
            提取帧
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadForm; 