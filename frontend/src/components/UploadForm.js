import React, { useState } from 'react';

function UploadForm({ onVideoUpload, onVideoUrl, onExtractFrames }) {
  const [url, setUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file');
  const [extractionOptions, setExtractionOptions] = useState({
    fps: 1,
    quality: 'high',
    format: 'jpg',
    startTime: '',
    endTime: '',
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.includes('video')) {
      onVideoUpload(file);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onVideoUrl(url);
    }
  };

  const handleExtractionSubmit = (e) => {
    e.preventDefault();
    onExtractFrames(extractionOptions);
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setExtractionOptions({
      ...extractionOptions,
      [name]: value,
    });
  };

  return (
    <div>
      <div className="form-group">
        <div className="upload-tabs">
          <button
            className={`tab-btn ${uploadMethod === 'file' ? 'active' : ''}`}
            onClick={() => setUploadMethod('file')}
          >
            上传视频文件
          </button>
          <button
            className={`tab-btn ${uploadMethod === 'url' ? 'active' : ''}`}
            onClick={() => setUploadMethod('url')}
          >
            使用视频URL
          </button>
        </div>

        {uploadMethod === 'file' ? (
          <div className="upload-area">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden-input"
              id="video-upload"
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
                value={extractionOptions.quality}
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