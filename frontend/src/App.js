import React, { useState } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import FrameGallery from './components/FrameGallery';
import Footer from './components/Footer';

// 使用环境变量或默认值
const API_URL = process.env.REACT_APP_API_URL || 'https://little-smoke-90a1.imluluj8-7a3.workers.dev';
const STORAGE_URL = process.env.REACT_APP_STORAGE_URL || 'https://storage.y.cheesecatool.com';

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
      
      let requestData = {
        fps: parseFloat(options.fps) || 1,
        quality: parseInt(options.quality) || 90,
        format: options.format || 'jpg',
        startTime: options.startTime ? parseFloat(options.startTime) : null,
        endTime: options.endTime ? parseFloat(options.endTime) : null
      };
      
      if (videoFile) {
        // 如果是文件上传，先上传文件
        const uploadFormData = new FormData();
        uploadFormData.append('video', videoFile);
        console.log('上传文件:', videoFile.name, videoFile.size);
        
        const uploadResponse = await fetch(`${API_URL}/api/upload-video`, {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`上传视频失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const uploadResult = await uploadResponse.json();
        requestData.videoPath = uploadResult.videoPath || uploadResult.filename || videoFile.name;
      } else if (videoUrl) {
        requestData.videoUrl = videoUrl;
        console.log('使用视频URL:', videoUrl);
      } else {
        throw new Error('请先上传视频或提供视频链接');
      }
      
      console.log('发送JSON请求数据:', requestData);
      
      // 修改API请求路径为正确的端点
      const apiUrl = `${API_URL}/api/extract-frames`;
      console.log('发送请求到:', apiUrl);
      
      // 发送到后端API，使用JSON格式
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
      setError(`处理错误: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <img src="images/cat-icon.png" alt="猫咪图标" className="nav-logo" />
        <div className="nav-title">芝士猫万能工具箱</div>
      </div>
      
      <div className="container">
        {/* 标题与图标 */}
        <div className="title-with-icon">
          <img src="images/cat-icon.png" alt="猫咪图标" className="cat-icon" />
          <h1 className="text-3xl font-bold">芝士猫视频帧万能无损提取工具</h1>
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