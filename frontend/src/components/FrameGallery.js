import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';

function FrameGallery({ frames, language, translations }) {
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedFrames, setSelectedFrames] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isDownloading, setIsDownloading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [imageCache, setImageCache] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);

  // 获取翻译文本
  const getText = (key) => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };

  // 处理代理URL，解决CORS问题
  const getProxyUrl = (originalUrl) => {
    // 检查URL是否包含任何已知的错误字符串
    if (originalUrl.includes('cheesecatool-backend.onrender.com')) {
      // 将后端onrender域名的URL转换为storage worker URL
      console.log('将onrender URL转换为storage URL:', originalUrl);
      const pathParts = originalUrl.split('/frames/');
      if (pathParts.length > 1) {
        return `https://storage.y.cheesecatool.com/frames/${pathParts[1]}`;
      }
    }
    
    // 检查URL是否来自storage.y.cheesecatool.com
    if (originalUrl.includes('storage.y.cheesecatool.com')) {
      // 直接返回原URL - 使用Worker URL直接访问
      console.log('使用storage URL:', originalUrl);
      return originalUrl;
    }
    
    // 检查URL是否来自Cloudflare R2存储
    if (originalUrl.includes('cloudflarestorage.com') || originalUrl.includes('r2.dev')) {
      // 重写为使用Worker URL
      console.log('将R2 URL转换为storage URL:', originalUrl);
      const pathParts = originalUrl.split('/');
      const objectKey = pathParts.slice(pathParts.indexOf('cheesecatool') + 1).join('/');
      return `https://storage.y.cheesecatool.com/${objectKey}`;
    }
    
    console.log('使用原始URL:', originalUrl);
    return originalUrl;
  };

  // 处理图片实际渲染时的URL
  const getRenderUrl = (url) => {
    // 转换为HTTPS协议
    let finalUrl = getProxyUrl(url);
    
    // 确保使用HTTPS协议
    if (finalUrl.startsWith('http://')) {
      finalUrl = finalUrl.replace('http://', 'https://');
      console.log('将HTTP URL转换为HTTPS:', finalUrl);
    }
    
    // 添加时间戳防止缓存问题
    const timestamp = new Date().getTime();
    finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
    
    return finalUrl;
  };

  // 图片预加载函数
  const preloadImages = useCallback(async () => {
    if (frames.length === 0) return;
    
    setIsPreloading(true);
    const cache = {};
    
    try {
      console.log(`开始预加载 ${frames.length} 张图片`);
      
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        // 如果图片已经在缓存中，则跳过
        if (imageCache[frame.url]) {
          cache[frame.url] = imageCache[frame.url];
          continue;
        }
        
        const proxyUrl = getProxyUrl(frame.url);
        console.log(`[${i+1}/${frames.length}] 正在加载图片:`, {
          原始URL: frame.url,
          代理URL: proxyUrl
        });
        
        // 创建图片对象并预加载
        const img = new Image();
        const promise = new Promise((resolve, reject) => {
          img.onload = () => {
            console.log(`✓ 图片加载成功: ${proxyUrl}`);
            resolve(frame.url);
          };
          img.onerror = (e) => {
            console.error(`✗ 图片加载失败: ${proxyUrl}`, e);
            reject(new Error(`Failed to load image: ${proxyUrl}`));
          };
          // 添加时间戳防止缓存问题
          img.src = `${proxyUrl}${proxyUrl.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
        });
        
        try {
          await promise;
          cache[frame.url] = true;
        } catch (error) {
          console.error(`图片 ${i+1} 加载错误:`, error);
          // 尝试使用备用方式获取图片
          try {
            console.log(`尝试使用备用方式加载图片 ${i+1}`);
            const backupUrl = frame.url.replace('cheesecatool-backend.onrender.com', 'storage.y.cheesecatool.com');
            const backupImg = new Image();
            await new Promise((resolve, reject) => {
              backupImg.onload = resolve;
              backupImg.onerror = reject;
              backupImg.src = backupUrl;
            });
            console.log(`✓ 备用方式加载成功: ${backupUrl}`);
            cache[frame.url] = true;
          } catch (backupError) {
            console.error(`备用方式加载失败:`, backupError);
          }
        }
        
        // 更新进度
        setPreloadProgress(Math.round(((i + 1) / frames.length) * 100));
      }
      
      setImageCache(cache);
      console.log('图片预加载完成，成功加载:', Object.keys(cache).length);
    } catch (error) {
      console.error('预加载图片出错:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [frames, imageCache]);

  // 查看下一张图片 - 使用useCallback包装，避免无限循环
  const viewNextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    const nextIndex = (lightboxIndex + 1) % frames.length;
    setLightboxIndex(nextIndex);
    setLightboxImage(frames[nextIndex]);
  }, [lightboxIndex, frames]);

  // 查看上一张图片 - 使用useCallback包装，避免无限循环
  const viewPrevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    const prevIndex = (lightboxIndex - 1 + frames.length) % frames.length;
    setLightboxIndex(prevIndex);
    setLightboxImage(frames[prevIndex]);
  }, [lightboxIndex, frames]);

  // 预加载所有图片以提高性能
  useEffect(() => {
    if (frames.length > 0 && Object.keys(imageCache).length === 0) {
      preloadImages();
    }
  }, [frames, imageCache, preloadImages]);

  // 关闭Lightbox
  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxOpen(false);
    // 恢复滚动
    document.body.style.overflow = '';
  };

  // 用于键盘导航的事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxImage) return;
      
      if (e.key === 'ArrowRight') {
        viewNextImage(e);
      } else if (e.key === 'ArrowLeft') {
        viewPrevImage(e);
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImage, lightboxIndex, viewNextImage, viewPrevImage]);

  const downloadFrame = (frame) => {
    // 使用代理URL，解决CORS问题
    const proxyUrl = getProxyUrl(frame.url);
    
    // 使用fetch获取图片数据，避免直接下载导致的CORS问题
    fetch(proxyUrl)
      .then(response => response.blob())
      .then(blob => {
        // 创建一个本地URL
        const url = window.URL.createObjectURL(blob);
        
        // 使用a标签下载
        const link = document.createElement('a');
        link.href = url;
        link.download = `frame_${frame.index + 1}.${frame.format || 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        
        // 清理
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error('下载出错:', error);
        alert('下载失败，请重试');
      });
  };

  // 下载所有帧 - 保留但不在UI中使用
  // eslint-disable-next-line no-unused-vars
  const downloadAllFrames = async () => {
    if (frames.length === 0) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // 创建一个新的JSZip实例
      const zip = new JSZip();
      
      // 为每个帧获取图片数据并添加到zip中
      const totalFrames = frames.length;
      
      for (let i = 0; i < totalFrames; i++) {
        const frame = frames[i];
        const proxyUrl = getProxyUrl(frame.url);
        
        try {
          const response = await fetch(proxyUrl);
          const blob = await response.blob();
          
          // 添加到zip文件，使用帧号作为文件名
          zip.file(`frame_${i + 1}.${frame.format || 'jpg'}`, blob);
          
          // 更新进度
          setDownloadProgress(Math.round(((i + 1) / totalFrames) * 100));
        } catch (error) {
          console.error(`获取第${i+1}帧图片出错:`, error);
          // 继续下一帧，而不是完全中断
          continue;
        }
      }
      
      // 生成zip文件
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        streamFiles: true,
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });
      
      // 创建下载链接并触发下载
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `all_frames_${new Date().getTime()}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // 释放URL对象
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.error('下载出错:', error);
      alert('打包下载失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // 使用JSZip库下载选中的帧
  const downloadSelectedFrames = async () => {
    if (selectedFrames.length === 0) {
      alert('请先选择要下载的帧');
      return;
    }
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    // 创建一个新的JSZip实例
    const zip = new JSZip();
    
    try {
      // 为每个选中的帧获取图片数据并添加到zip中
      const totalSelected = selectedFrames.length;
      
      for (let i = 0; i < totalSelected; i++) {
        const frameIndex = selectedFrames[i];
        const frame = frames[frameIndex];
        const proxyUrl = getProxyUrl(frame.url);
        
        try {
          const response = await fetch(proxyUrl);
          const blob = await response.blob();
          
          // 添加到zip文件，使用帧号作为文件名
          zip.file(`frame_${frameIndex + 1}.${frame.format || 'jpg'}`, blob);
          
          // 更新进度
          setDownloadProgress(Math.round(((i + 1) / totalSelected) * 100));
        } catch (error) {
          console.error(`获取第${frameIndex+1}帧图片出错:`, error);
          // 继续下一帧，而不是完全中断
          continue;
        }
      }
      
      // 生成zip文件
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        streamFiles: true,
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });
      
      // 创建下载链接并触发下载
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `selected_frames_${new Date().getTime()}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // 释放URL对象
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.error('下载出错:', error);
      alert('打包下载失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  // 切换选择框状态
  const toggleFrameSelection = (index) => {
    setSelectedFrames(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // 全选
  const selectAllFrames = () => {
    setSelectedFrames(frames.map((_, index) => index));
  };

  // 取消全选
  const deselectAllFrames = () => {
    setSelectedFrames([]);
  };

  // 打开Lightbox
  const openLightbox = (frame, index) => {
    setLightboxImage(frame);
    setLightboxIndex(index);
    setCurrentFrame(frame.url);
    setLightboxOpen(true);
    // 防止滚动
    document.body.style.overflow = 'hidden';
  };

  // 图片错误处理函数
  const handleImageError = (e, frameUrl) => {
    console.error('图片加载失败:', frameUrl);
    // 显示默认的错误图片
    e.target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22100%25%22 height%3D%22100%25%22 viewBox%3D%220 0 100 100%22%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 text-anchor%3D%22middle%22 dominant-baseline%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2210%22 fill%3D%22%23333%22%3E加载失败%3C%2Ftext%3E%3C%2Fsvg%3E';
    e.target.classList.add('image-error');
    
    // 尝试重新加载一次
    setTimeout(() => {
      const newSrc = frameUrl.replace('cheesecatool-backend.onrender.com', 'storage.y.cheesecatool.com');
      console.log('尝试重新加载:', newSrc);
      const tempImg = new Image();
      tempImg.onload = () => {
        e.target.src = newSrc;
        e.target.classList.remove('image-error');
      };
      tempImg.src = newSrc;
    }, 1000);
  };

  return (
    <div className="frame-gallery">
      {/* SSL错误提示 */}
      {frames.length > 0 && (
        <div className="ssl-error-notice">
          <span className="icon">⚠️</span>
          {getText('sslErrorNotice')}
        </div>
      )}
      
      {/* 批量选择功能 */}
      {frames.length > 0 && (
        <div className="batch-actions">
          <button
            onClick={() => setIsSelecting(!isSelecting)}
            className={`batch-toggle ${isSelecting ? 'active' : ''}`}
            type="button"
          >
            {isSelecting ? getText('finishSelection') : getText('batchSelection')}
          </button>
          
          {isSelecting && (
            <div className="batch-controls">
              <button onClick={selectAllFrames} type="button">{getText('selectAll')}</button>
              <button onClick={deselectAllFrames} type="button">{getText('deselectAll')}</button>
              <button onClick={() => downloadSelectedFrames()} 
                      disabled={selectedFrames.length === 0}
                      type="button">
                {getText('downloadSelected')} ({selectedFrames.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* 视图切换 */}
      {frames.length > 0 && (
        <div className="view-controls">
          <button
            onClick={() => setViewMode('grid')}
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            type="button"
          >
            {getText('gridView')}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            type="button"
          >
            {getText('listView')}
          </button>
        </div>
      )}

      {/* 图片预加载进度 */}
      {isPreloading && (
        <div className="loading-indicator">
          <div className="progress-bar">
            <div 
              className="progress-bar-inner" 
              style={{ width: `${preloadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">{getText('loadingImages')} {preloadProgress}%</div>
        </div>
      )}
      
      {viewMode === 'grid' ? (
        <div className="frames-container">
          {frames.map((frame, index) => (
            <div key={index} className="frame-card">
              <div 
                className={`frame-image-container ${selectedFrames.includes(index) ? 'selected' : ''}`}
                onClick={isSelecting ? () => toggleFrameSelection(index) : () => openLightbox(frame, index)}
              >
                <div className="frame-selection">
                  <input
                    type="checkbox"
                    checked={selectedFrames.includes(index)}
                    onChange={() => toggleFrameSelection(index)}
                    className="frame-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <img
                  src={getRenderUrl(frame.url)}
                  alt={`${getText('frame')} ${index + 1}`}
                  className="frame-image full-image"
                  title={isSelecting ? '点击选择' : '点击查看大图'}
                  onError={(e) => handleImageError(e, frame.url)}
                />
                {isSelecting && selectedFrames.includes(index) && (
                  <div className="selected-overlay">
                    <div className="selected-indicator">✓</div>
                  </div>
                )}
              </div>
              <div className="frame-info">
                <p className="frame-number">{`${getText('frame')} ${index + 1}`}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFrame(frame);
                  }}
                  className="download-link"
                  type="button"
                >
                  {getText('download')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="frames-table-container">
          <table className="frames-table">
            <thead>
              <tr>
                <th className="checkbox-header">
                  <input 
                    type="checkbox" 
                    checked={selectedFrames.length === frames.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllFrames();
                      } else {
                        deselectAllFrames();
                      }
                    }}
                    className="table-select-all"
                  />
                </th>
                <th>{getText('preview')}</th>
                <th>{getText('frame')}</th>
                <th>{getText('format')}</th>
                <th>{getText('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((frame, index) => (
                <tr 
                  key={index} 
                  className={selectedFrames.includes(index) ? 'selected-row' : ''}
                  onClick={isSelecting ? () => toggleFrameSelection(index) : null}
                >
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedFrames.includes(index)}
                      onChange={() => toggleFrameSelection(index)}
                      className="list-frame-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="thumbnail-cell">
                    <img
                      src={getRenderUrl(frame.url)}
                      alt={`${getText('frame')} ${index + 1}`}
                      className="thumbnail full-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(frame, index);
                      }}
                      title={getText('clickToView')}
                      onError={(e) => handleImageError(e, frame.url)}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td>{frame.format || 'JPG'}</td>
                  <td className="actions-cell">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFrame(frame);
                      }}
                      className="table-action-btn download-btn"
                      type="button"
                    >
                      {getText('download')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox组件 - 添加改进的导航和信息 */}
      {lightboxOpen && currentFrame && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox} type="button">×</button>
            
            <button className="lightbox-nav lightbox-prev" onClick={viewPrevImage} title={getText('previousImage')} type="button">
              &#10094;
            </button>
            
            <img 
              src={getRenderUrl(currentFrame)} 
              alt={`${getText('frame')} ${frames.findIndex(frame => frame.url === currentFrame) + 1}`}
              className="lightbox-image" 
              onError={(e) => handleImageError(e, currentFrame)}
            />
            
            <button className="lightbox-nav lightbox-next" onClick={viewNextImage} title={getText('nextImage')} type="button">
              &#10095;
            </button>
            
            <div className="lightbox-footer">
              <div className="lightbox-caption">
                {`${getText('frame')} ${frames.findIndex(frame => frame.url === currentFrame) + 1} / ${frames.length}`}
              </div>
              <div className="lightbox-actions">
                <label className="lightbox-select">
                  <input 
                    type="checkbox"
                    checked={selectedFrames.includes(frames.findIndex(frame => frame.url === currentFrame))}
                    onChange={() => toggleFrameSelection(frames.findIndex(frame => frame.url === currentFrame))}
                  />
                  {getText('select')}
                </label>
                <button 
                  className="lightbox-download-btn" 
                  onClick={() => downloadFrame(frames.find(frame => frame.url === currentFrame))}
                  type="button"
                >
                  {getText('download')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FrameGallery; 