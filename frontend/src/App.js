import React, { useState } from 'react';
import './App.css';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Tabs, Upload, Form, Input, Slider, Select, InputNumber, message } from 'antd';
import UploadForm from './components/UploadForm';
import VideoPlayer from './components/VideoPlayer';
import FrameGallery from './components/FrameGallery';
import Header from './components/Header';
import Footer from './components/Footer';

// 使用环境变量或默认值
const API_URL = process.env.REACT_APP_API_URL || "https://little-smoke-90a1.imluluj8-7a3.workers.dev";
const STORAGE_URL = process.env.REACT_APP_STORAGE_URL || "https://storage-worker.imluluj8-7a3.workers.dev";

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
        formData.append('url', videoUrl);
      } else {
        throw new Error('请先上传视频或提供视频链接');
      }
      
      // 添加提取选项
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      // 发送到后端API
      const response = await fetch(`${API_URL}/api/extract-frames`, {
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
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">视频帧提取器</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <UploadForm 
            onVideoUpload={handleVideoUpload} 
            onVideoUrl={handleVideoUrl}
            onExtractFrames={handleExtractFrames}
          />
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {videoUrl && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">预览视频</h2>
            <VideoPlayer videoUrl={videoUrl} />
          </div>
        )}
        
        {loading && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <p className="inline-block">正在提取视频帧，请稍候...</p>
          </div>
        )}
        
        {frames.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">提取的帧</h2>
            <FrameGallery frames={frames} />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App; 