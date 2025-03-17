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
      <div className="mb-6">
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 ${uploadMethod === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadMethod('file')}
          >
            上传视频文件
          </button>
          <button
            className={`flex-1 py-2 ${uploadMethod === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadMethod('url')}
          >
            使用视频URL
          </button>
        </div>

        {uploadMethod === 'file' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer block"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                点击选择视频文件或拖放到此处
              </p>
              <p className="mt-1 text-xs text-gray-500">
                支持的格式: MP4, AVI, MOV, WMV, FLV
              </p>
            </label>
          </div>
        ) : (
          <form onSubmit={handleUrlSubmit} className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="输入视频URL"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r"
              >
                加载
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">提取选项</h3>
        <form onSubmit={handleExtractionSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                帧率 (FPS)
              </label>
              <select
                name="fps"
                value={extractionOptions.fps}
                onChange={handleOptionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="1">1 (每秒1帧)</option>
                <option value="5">5 (每秒5帧)</option>
                <option value="10">10 (每秒10帧)</option>
                <option value="15">15 (每秒15帧)</option>
                <option value="30">30 (每秒30帧)</option>
                <option value="all">全部帧</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图像质量
              </label>
              <select
                name="quality"
                value={extractionOptions.quality}
                onChange={handleOptionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="low">低 (体积小)</option>
                <option value="medium">中</option>
                <option value="high">高 (无损)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图像格式
              </label>
              <select
                name="format"
                value={extractionOptions.format}
                onChange={handleOptionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始时间 (秒)
              </label>
              <input
                type="number"
                name="startTime"
                placeholder="可选"
                value={extractionOptions.startTime}
                onChange={handleOptionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束时间 (秒)
              </label>
              <input
                type="number"
                name="endTime"
                placeholder="可选"
                value={extractionOptions.endTime}
                onChange={handleOptionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition"
          >
            提取帧
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadForm; 