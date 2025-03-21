import React, { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import FrameGallery from './components/FrameGallery';
import Footer from './components/Footer';
import ErrorHandler from './components/ErrorHandler';

// 使用环境变量或默认值
const API_URL = process.env.REACT_APP_API_URL || 'https://api.y.cheesecatool.com';
const STORAGE_URL = process.env.REACT_APP_STORAGE_URL || 'https://storage.y.cheesecatool.com';

// 支持的语言列表
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// 添加语言文本映射
const TRANSLATIONS = {
  en: {
    title: "CheeseCat Video Frame Extraction Tool",
    uploadTitle: "Upload or drop a video file here",
    supportedFormats: "Supported formats: MP4, AVI, MOV, WMV, FLV, MKV",
    fps: "Frame Rate (FPS)",
    imageFormat: "Image Format",
    imageQuality: "Image Quality",
    startTime: "Start Time (seconds, optional)",
    endTime: "End Time (seconds, optional)",
    extractButton: "Extract Frames",
    processing: "Processing video, please wait...",
    extractedFrames: "Extracted Frames",
    frame: "Frame",
    download: "Download",
    contact: "For suggestions or feedback, please contact: imluluj8@outlook.com"
  },
  zh: {
    title: "芝士猫视频帧万能无损提取工具",
    uploadTitle: "点击选择视频文件或拖放到此处",
    supportedFormats: "支持的格式: MP4, AVI, MOV, WMV, FLV, MKV",
    fps: "帧率 (FPS)",
    imageFormat: "图像格式",
    imageQuality: "图像质量",
    startTime: "开始时间 (秒, 可选)",
    endTime: "结束时间 (秒, 可选)",
    extractButton: "提取视频帧",
    processing: "正在提取视频帧，请稍候...",
    extractedFrames: "提取的帧",
    frame: "帧",
    download: "下载",
    contact: "如有需求或建议反馈，欢迎联系：imluluj8@outlook.com"
  },
  // 可以添加其他语言...
};

// 调试日志 - 使用正确的环境变量格式
console.log('环境变量:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_URL,
  STORAGE_URL
});

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('general');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en'); // 使用本地存储保存语言选择
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // 获取翻译文本
  const getText = (key) => {
    return (TRANSLATIONS[language] && TRANSLATIONS[language][key]) || TRANSLATIONS.en[key];
  };

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 处理上传的视频文件
  const handleVideoUpload = (file) => {
    setVideoFile(file);
    setError('');
  };

  // 切换语言菜单显示状态
  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu);
  };

  // 选择语言
  const selectLanguage = (langCode) => {
    setLanguage(langCode);
    setShowLanguageMenu(false);
    // 保存语言选择到localStorage
    localStorage.setItem('language', langCode);
    console.log(`切换语言到: ${langCode}`);
  };

  // 获取当前语言信息
  const getCurrentLanguage = () => {
    return LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
  };

  // 处理提取帧
  const handleExtractFrames = async (options) => {
    if (!videoFile) {
      setError('请先上传视频文件');
      setErrorType('upload');
      return;
    }
    
    if (!isOnline) {
      setError('您当前处于离线状态，无法连接到服务器');
      setErrorType('network');
      return;
    }

    setLoading(true);
    setError('');
    setFrames([]);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('fps', options.fps);
    formData.append('quality', options.quality);
    formData.append('format', options.format);
    
    if (options.startTime) {
      formData.append('start_time', options.startTime);
    }
    
    if (options.endTime) {
      formData.append('end_time', options.endTime);
    }

    try {
      console.log('提取参数:', options);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `上传视频失败: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error('解析错误响应失败:', e);
        }
        
        // 根据错误码设置错误类型
        if (response.status >= 500) {
          setErrorType('server');
        } else if (response.status === 413) {
          setErrorType('upload');
          errorMessage = '视频文件太大，超过服务器限制';
        } else if (response.status === 415) {
          setErrorType('upload');
          errorMessage = '不支持的视频格式';
        } else {
          setErrorType('extract');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('提取结果:', data);
      
      if (data.frames && Array.isArray(data.frames)) {
        // 预加载图片
        setFrames(data.frames);
      } else {
        throw new Error('提取视频帧失败: 服务器返回无效数据');
      }
    } catch (err) {
      console.error('提取帧错误:', err);
      setError(err.message || '提取视频帧失败');
    } finally {
      setLoading(false);
    }
  };

  // 重试上传和提取
  const handleRetry = () => {
    setError('');
    setErrorType('general');
    if (videoFile) {
      setVideoFile(null);
    }
  };

  return (
    <div className="App">
      {!isOnline && (
        <div className="offline-notice">
          您当前处于离线状态，部分功能可能不可用
        </div>
      )}
      
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <img src="images/cat-icon.png" alt="猫咪图标" className="nav-logo" />
        <div className="nav-title">芝士猫工具箱</div>
        <div className="nav-links">
          <a href="https://y.cheesecatool.com/" className="nav-link" target="_blank" rel="noopener noreferrer">上传视频文件提取视频帧</a>
          <a href="https://y.cheesecatool.com/url" className="nav-link" target="_blank" rel="noopener noreferrer">视频URL提取视频帧</a>
          <a href="https://yt.cheesecatool.com/" className="nav-link" target="_blank" rel="noopener noreferrer">YOUTUBE视频数据分析</a>
        </div>

        {/* 语言选择器 */}
        <div className="language-selector">
          <button 
            className="language-btn" 
            onClick={toggleLanguageMenu}
            aria-label="Select language"
          >
            <span className="language-flag">{getCurrentLanguage().flag}</span>
            <span className="language-name">{getCurrentLanguage().name}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showLanguageMenu && (
            <div className="language-dropdown">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code} 
                  className={`language-option ${lang.code === language ? 'active' : ''}`}
                  onClick={() => selectLanguage(lang.code)}
                >
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-name">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="container">
        {/* 标题与图标 */}
        <div className="title-with-icon">
          <img src="images/cat-icon.png" alt="猫咪图标" className="cat-icon" />
          <h1 className="text-3xl font-bold">{getText('title')}</h1>
        </div>
        
        {/* 错误显示区域 */}
        {error && (
          <ErrorHandler 
            error={error} 
            type={errorType} 
            onRetry={handleRetry}
            showDetails={true}
          />
        )}
        
        {/* 表单区域 */}
        <div className="bg-white rounded-lg mb-8">
          <UploadForm 
            onVideoUpload={handleVideoUpload} 
            onExtractFrames={handleExtractFrames}
            language={language}
            translations={TRANSLATIONS}
            disabled={!isOnline || loading}
          />
        </div>
        
        {loading && (
          <div className="loading" style={{display: 'block'}}>
            <div className="spinner"></div>
            <p>{getText('processing')}</p>
          </div>
        )}
        
        {frames.length > 0 && (
          <div id="results-section" style={{display: 'block'}}>
            <h2 className="text-xl font-semibold mb-4">{getText('extractedFrames')}</h2>
            <FrameGallery frames={frames} language={language} translations={TRANSLATIONS} />
          </div>
        )}
      </div>
      
      <Footer language={language} translations={TRANSLATIONS} />
    </div>
  );
}

export default App; 