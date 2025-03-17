import React, { useState } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import VideoPlayer from './components/VideoPlayer';
import FrameGallery from './components/FrameGallery';
import Header from './components/Header';
import Footer from './components/Footer';

// 使用环境变量或默认值
const API_URL = import.meta.env.VITE_API_URL || "https://little-smoke-90a1.imluluj8-7a3.workers.dev";
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || "https://storage-worker.imluluj8-7a3.workers.dev";

// 增加调试日志
console.log('API_URL:', import.meta.env.VITE_API_URL);
console.log('STORAGE_URL:', import.meta.env.VITE_STORAGE_URL);

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
      const formData = new FormData();
      
      if (videoFile) {
        formData.append('video', videoFile);
      } else if (videoUrl) {
        formData.append('videoUrl', videoUrl);
      } else {
        throw new Error('请先上传视频或提供视频链接');
      }
      
      // 添加提取选项
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      // 在fetch请求中确保完整URL
      const apiUrl = `${API_URL}/api/extract-frames`;
      console.log('发送请求到:', apiUrl);
      
      // 发送到后端API
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '提取视频帧失败');
      }
      
      const data = await response.json();
      setFrames(data.frames);
    } catch (err) {
      console.error('提取帧时出错:', err);
      setError(err.message || '提取视频帧失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <img src="/images/cat-icon.png" alt="猫咪图标" className="nav-logo" />
        <div className="nav-title">芝士猫视频工具</div>
      </div>
      
      <div className="container">
        {/* 标题与图标 */}
        <div className="title-with-icon">
          <img src="/images/cat-icon.png" alt="猫咪图标" className="cat-icon" />
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