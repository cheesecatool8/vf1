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