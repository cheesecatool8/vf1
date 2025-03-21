import React, { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import FrameGallery from './components/FrameGallery';
import Footer from './components/Footer';

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
  
  // 使用 'en' 作为默认语言，仅当本地存储中有值时才使用本地存储的值
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });
  
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // 确保在组件加载时将语言设置为英文（如果未设置）
  useEffect(() => {
    if (!localStorage.getItem('language')) {
      localStorage.setItem('language', 'en');
    }
  }, []);

  // 获取翻译文本
  const getText = (key) => {
    return (TRANSLATIONS[language] && TRANSLATIONS[language][key]) || TRANSLATIONS.en[key];
  };

  // 处理上传的视频文件
  const handleVideoUpload = (file) => {
    setVideoFile(file);
    setFrames([]);
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
      } else {
        throw new Error('请先上传视频文件');
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
        
        {/* 表单区域 */}
        <div className="bg-white rounded-lg mb-8">
          <UploadForm 
            onVideoUpload={handleVideoUpload} 
            onExtractFrames={handleExtractFrames}
            language={language}
            translations={TRANSLATIONS}
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