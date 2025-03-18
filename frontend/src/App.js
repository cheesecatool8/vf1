import React, { useState } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import VideoPlayer from './components/VideoPlayer';
import FrameGallery from './components/FrameGallery';
import Footer from './components/Footer';

// 使用环境变量或默认值 - 使用React正确的环境变量格式
const API_URL = process.env.REACT_APP_API_URL || 'https://api-worker.imluluj8-7a3.workers.dev';
const STORAGE_URL = process.env.REACT_APP_STORAGE_URL || 'https://storage-worker.imluluj8-7a3.workers.dev';

// 调试日志 - 使用正确的环境变量格式
console.log('环境变量:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_URL,
  STORAGE_URL
});

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 处理上传的视频文件
  const handleVideoUpload = (file) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setFrames([]);
    setError('');
  };

  // 处理从URL加载视频
  const handleVideoUrl = (url) => {
    setVideoUrl(url);
    setVideoFile(null);
    setFrames([]);
    setError('');
  };

  // 提取帧
  const handleExtractFrames = async (options) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('提取选项:', options);
      
      const formData = new FormData();
      
      if (videoFile) {
        formData.append('video', videoFile);
        console.log('上传文件:', videoFile.name, videoFile.size);
      } else if (videoUrl) {
        formData.append('videoUrl', videoUrl);
        console.log('上传URL:', videoUrl);
      } else {
        throw new Error('请先上传视频或提供视频链接');
      }
      
      // 添加提取选项
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
        console.log(`参数 ${key}:`, options[key], '类型:', typeof options[key]);
      });
      
      // 修改API请求路径为正确的端点
      const apiUrl = `${API_URL}/api/extract-frames`;
      console.log('发送请求到:', apiUrl);
      
      // 发送到后端API
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      console.log('服务器响应状态:', response.status);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `请求失败 (${response.status}): ${response.statusText}`;
        } catch (e) {
          errorMessage = `请求失败 (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('服务器响应数据:', data);
      
      if (!data.frames || !Array.isArray(data.frames)) {
        throw new Error('服务器返回数据格式错误');
      }
      setFrames(data.frames);
    } catch (err) {
      console.error('提取帧时出错:', err);
      // 显示更详细的错误信息
      setError(`处理错误: ${err.message} (API URL: ${API_URL})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <img src="images/cat-icon.png" alt="猫咪图标" className="nav-logo" />
        <div className="nav-title">芝士猫视频工具</div>
      </div>
      
      <div className="container">
        {/* 标题与图标 */}
        <div className="title-with-icon">
          <img src="images/cat-icon.png" alt="猫咪图标" className="cat-icon" />
          <h1 className="text-3xl font-bold">视频帧提取器</h1>
        </div>
        
        {/* 表单区域 */}
        <div className="bg-white rounded-lg mb-8">
          <UploadForm 
            onVideoUpload={handleVideoUpload} 
            onVideoUrl={handleVideoUrl}
            onExtractFrames={handleExtractFrames}
          />
        </div>
        
        {error && (
          <div className="flash-message">
            {error}
          </div>
        )}
        
        {videoUrl && (
          <div className="bg-white rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">预览视频</h2>
            <VideoPlayer videoUrl={videoUrl} />
          </div>
        )}
        
        {loading && (
          <div className="loading" style={{display: 'block'}}>
            <div className="spinner"></div>
            <p>正在提取视频帧，请稍候...</p>
          </div>
        )}
        
        {frames.length > 0 && (
          <div id="results-section" style={{display: 'block'}}>
            <h2 className="text-xl font-semibold mb-4">提取的帧</h2>
            <FrameGallery frames={frames} />
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default App; 