import React, { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import FrameGallery from './components/FrameGallery';
import Footer from './components/Footer';
import VideoUpload from './components/VideoUpload';
import translations from './translations';

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
    batchSelect: "Batch Select",
    exitBatchMode: "Exit Select Mode",
    select: "Select",
    networkView: "Grid View",
    listView: "List View",
    downloadAll: "Download All",
    downloadSelected: "Download Selected",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    preview: "Preview",
    format: "Format",
    actions: "Actions",
    loading: "Loading images...",
    contact: "For suggestions or feedback, please contact: imluluj8@outlook.com",
    // 顶部导航栏
    navTitle: "CheeseCat Toolbox",
    navLinkUpload: "Upload Video File",
    navLinkUrl: "Video URL Extraction",
    navLinkYoutube: "YOUTUBE Video Analysis"
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
    batchSelect: "批量选择",
    exitBatchMode: "完成选择",
    select: "选择",
    networkView: "网格查看",
    listView: "列表查看",
    downloadAll: "下载全部",
    downloadSelected: "下载选中",
    selectAll: "全选",
    deselectAll: "取消选择",
    preview: "预览",
    format: "格式",
    actions: "操作",
    loading: "加载图片中...",
    contact: "如有需求或建议反馈，欢迎联系：imluluj8@outlook.com",
    // 顶部导航栏
    navTitle: "芝士猫工具箱",
    navLinkUpload: "上传视频文件提取视频帧",
    navLinkUrl: "视频URL提取视频帧",
    navLinkYoutube: "YOUTUBE视频数据分析"
  },
  ja: {
    title: "チーズキャット ビデオフレーム抽出ツール",
    uploadTitle: "ビデオファイルをアップロードまたはドロップ",
    supportedFormats: "サポートされているフォーマット: MP4, AVI, MOV, WMV, FLV, MKV",
    fps: "フレームレート (FPS)",
    imageFormat: "画像フォーマット",
    imageQuality: "画質",
    startTime: "開始時間 (秒、任意)",
    endTime: "終了時間 (秒、任意)",
    extractButton: "フレームを抽出",
    processing: "ビデオを処理中、お待ちください...",
    extractedFrames: "抽出されたフレーム",
    frame: "フレーム",
    download: "ダウンロード",
    batchSelect: "一括選択",
    exitBatchMode: "選択終了",
    select: "選択",
    networkView: "グリッド表示",
    listView: "リスト表示",
    downloadAll: "すべてダウンロード",
    downloadSelected: "選択したものをダウンロード",
    selectAll: "すべて選択",
    deselectAll: "選択解除",
    preview: "プレビュー",
    format: "フォーマット",
    actions: "アクション",
    loading: "画像を読み込み中...",
    contact: "ご意見やフィードバックは、こちらまでご連絡ください: imluluj8@outlook.com",
    // 顶部导航栏
    navTitle: "チーズキャットツールボックス",
    navLinkUpload: "ビデオファイルをアップロード",
    navLinkUrl: "ビデオURLからフレームを抽出",
    navLinkYoutube: "YouTubeビデオデータ分析"
  },
  ko: {
    title: "치즈캣 비디오 프레임 추출 도구",
    uploadTitle: "비디오 파일을 업로드하거나 여기에 끌어다 놓으세요",
    supportedFormats: "지원되는 형식: MP4, AVI, MOV, WMV, FLV, MKV",
    fps: "프레임 속도 (FPS)",
    imageFormat: "이미지 형식",
    imageQuality: "이미지 품질",
    startTime: "시작 시간 (초, 선택 사항)",
    endTime: "종료 시간 (초, 선택 사항)",
    extractButton: "프레임 추출",
    processing: "비디오를 처리 중입니다. 잠시만 기다려주세요...",
    extractedFrames: "추출된 프레임",
    frame: "프레임",
    download: "다운로드",
    batchSelect: "일괄 선택",
    exitBatchMode: "선택 완료",
    select: "선택",
    networkView: "그리드 보기",
    listView: "목록 보기",
    downloadAll: "모두 다운로드",
    downloadSelected: "선택한 항목 다운로드",
    selectAll: "모두 선택",
    deselectAll: "선택 취소",
    preview: "미리보기",
    format: "형식",
    actions: "작업",
    loading: "이미지 로딩 중...",
    contact: "제안이나 피드백이 있으시면 연락주세요: imluluj8@outlook.com",
    // 顶部导航栏
    navTitle: "치즈캣 툴박스",
    navLinkUpload: "비디오 파일 업로드",
    navLinkUrl: "비디오 URL 추출",
    navLinkYoutube: "YOUTUBE 비디오 데이터 분석"
  },
  es: {
    title: "Herramienta de Extracción de Fotogramas de Vídeo CheeseCat",
    uploadTitle: "Sube o arrastra un archivo de vídeo aquí",
    supportedFormats: "Formatos soportados: MP4, AVI, MOV, WMV, FLV, MKV",
    fps: "Velocidad de fotogramas (FPS)",
    imageFormat: "Formato de imagen",
    imageQuality: "Calidad de imagen",
    startTime: "Tiempo de inicio (segundos, opcional)",
    endTime: "Tiempo de finalización (segundos, opcional)",
    extractButton: "Extraer Fotogramas",
    processing: "Procesando vídeo, por favor espere...",
    extractedFrames: "Fotogramas Extraídos",
    frame: "Fotograma",
    download: "Descargar",
    batchSelect: "Selección por Lotes",
    exitBatchMode: "Terminar Selección",
    select: "Seleccionar",
    networkView: "Vista de Cuadrícula",
    listView: "Vista de Lista",
    downloadAll: "Descargar Todo",
    downloadSelected: "Descargar Seleccionados",
    selectAll: "Seleccionar Todo",
    deselectAll: "Deseleccionar Todo",
    preview: "Vista Previa",
    format: "Formato",
    actions: "Acciones",
    loading: "Cargando imágenes...",
    contact: "Para sugerencias o comentarios, contacta: imluluj8@outlook.com",
    // 顶部导航栏
    navTitle: "Caja de Herramientas CheeseCat",
    navLinkUpload: "Subir Archivo de Vídeo",
    navLinkUrl: "Extracción de URL de Vídeo",
    navLinkYoutube: "Análisis de Datos de Vídeo de YOUTUBE"
  },
  fr: {
    title: "CheeseCat - Outil d'Extraction de Frames Vidéo",
    uploadTitle: "Téléchargez ou déposez un fichier vidéo ici",
    supportedFormats: "Formats supportés: MP4, AVI, MOV, WMV, FLV, MKV",
    fps: "Fréquence d'images (IPS)",
    imageFormat: "Format d'image",
    imageQuality: "Qualité d'image",
    startTime: "Temps de début (secondes, optionnel)",
    endTime: "Temps de fin (secondes, optionnel)",
    extractButton: "Extraire les Images",
    processing: "Traitement de la vidéo, veuillez patienter...",
    extractedFrames: "Images Extraites",
    frame: "Image",
    download: "Télécharger",
    batchSelect: "Sélection par Lot",
    exitBatchMode: "Terminer la Sélection",
    select: "Sélectionner",
    networkView: "Vue en Grille",
    listView: "Vue en Liste",
    downloadAll: "Tout Télécharger",
    downloadSelected: "Télécharger la Sélection",
    selectAll: "Tout Sélectionner",
    deselectAll: "Tout Désélectionner",
    preview: "Aperçu",
    format: "Format",
    actions: "Actions",
    loading: "Chargement des images...",
    contact: "Pour suggestions ou commentaires, contactez: imluluj8@outlook.com",
    // 顶部导航栏
    navTitle: "Boîte à Outils CheeseCat",
    navLinkUpload: "Télécharger un Fichier Vidéo",
    navLinkUrl: "Extraction d'URL Vidéo",
    navLinkYoutube: "Analyse de Données Vidéo YOUTUBE"
  },
  de: {
    title: "CheeseCat Video-Frame-Extrahierungstool",
    uploadTitle: "Laden Sie eine Videodatei hoch oder ziehen Sie sie hierher",
    supportedFormats: "Unterstützte Formate: MP4, AVI, MOV, WMV, FLV, MKV",
    fps: "Bildrate (FPS)",
    imageFormat: "Bildformat",
    imageQuality: "Bildqualität",
    startTime: "Startzeit (Sekunden, optional)",
    endTime: "Endzeit (Sekunden, optional)",
    extractButton: "Frames extrahieren",
    processing: "Video wird verarbeitet, bitte warten...",
    extractedFrames: "Extrahierte Frames",
    frame: "Frame",
    download: "Herunterladen",
    batchSelect: "Stapelauswahl",
    exitBatchMode: "Auswahl beenden",
    select: "Auswählen",
    networkView: "Rasteransicht",
    listView: "Listenansicht",
    downloadAll: "Alle herunterladen",
    downloadSelected: "Ausgewählte herunterladen",
    selectAll: "Alle auswählen",
    deselectAll: "Auswahl aufheben",
    preview: "Vorschau",
    format: "Format",
    actions: "Aktionen",
    loading: "Bilder werden geladen...",
    contact: "Für Vorschläge oder Feedback kontaktieren Sie: imluluj8@outlook.com",
    // 顶部导航栏
    navTitle: "CheeseCat Werkzeugkasten",
    navLinkUpload: "Video-Datei hochladen",
    navLinkUrl: "Video-URL-Extraktion",
    navLinkYoutube: "YOUTUBE-Videodatenanalyse"
  }
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
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

  // 处理视频上传
  const handleVideoUpload = (file) => {
    setVideoFile(file);
    setCurrentStep(1);
  };
  
  // 处理视频帧提取
  const handleExtractFrames = async (options) => {
    if (!videoFile) {
      setError(getText('noVideoUploaded'));
      return;
    }
    
    setIsExtracting(true);
    setProgress(0);
    setError(null);
    
    try {
      // 创建FormData对象发送文件
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('fps', options.fps || 1);
      
      console.log('上传视频:', videoFile);
      console.log('设置FPS:', options.fps || 1);
      
      // 发送请求到API
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/extract-frames`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || getText('extractionFailed'));
      }
      
      const result = await response.json();
      console.log('服务器响应:', result);
      
      // 更新提取的帧
      setFrames(result.frames || []);
      setCurrentStep(2);
    } catch (error) {
      console.error('提取帧出错:', error);
      setError(error.message);
    } finally {
      setIsExtracting(false);
    }
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

  return (
    <div className="App">
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <img src="images/cat-icon.png" alt="猫咪图标" className="nav-logo" />
        <div className="nav-title">{getText('navTitle')}</div>
        <div className="nav-links">
          <a href="https://y.cheesecatool.com/" className="nav-link" target="_blank" rel="noopener noreferrer">{getText('navLinkUpload')}</a>
          <a href="https://y.cheesecatool.com/url" className="nav-link" target="_blank" rel="noopener noreferrer">{getText('navLinkUrl')}</a>
          <a href="https://yt.cheesecatool.com/" className="nav-link" target="_blank" rel="noopener noreferrer">{getText('navLinkYoutube')}</a>
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
        <div className="app-content">
          <div className="title-section">
            <img src="/logo.png" alt={getText('logoAlt')} className="logo-icon" />
            <h1>{getText('pageTitle')}</h1>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {/* 步骤1: 上传视频 */}
          {currentStep === 0 && (
            <UploadForm 
              onVideoUpload={handleVideoUpload} 
              getText={getText}
            />
          )}
          
          {/* 步骤2: 预览视频并提取帧 */}
          {currentStep === 1 && videoFile && (
            <VideoUpload 
              videoFile={videoFile} 
              onExtract={handleExtractFrames}
              language={language}
              translations={translations}
            />
          )}
          
          {/* 步骤3: 显示提取的帧 */}
          {currentStep === 2 && frames.length > 0 && (
            <FrameGallery 
              frames={frames} 
              getText={getText}
            />
          )}
          
          {isExtracting && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>{getText('processing')}</p>
              {progress > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Footer language={language} translations={TRANSLATIONS} />
    </div>
  );
}

export default App; 