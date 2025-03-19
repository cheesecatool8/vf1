import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';

function FrameGallery({ frames }) {
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedFrames, setSelectedFrames] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [imageCache, setImageCache] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // 图片预加载函数
  const preloadImages = useCallback(async () => {
    if (frames.length === 0) return;
    
    setIsPreloading(true);
    const cache = {};
    
    try {
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        // 如果图片已经在缓存中，则跳过
        if (imageCache[frame.url]) {
          cache[frame.url] = imageCache[frame.url];
          continue;
        }
        
        // 创建图片对象并预加载
        const img = new Image();
        const promise = new Promise((resolve, reject) => {
          img.onload = () => resolve(frame.url);
          img.onerror = () => reject(new Error(`Failed to load image: ${frame.url}`));
          img.src = frame.url;
        });
        
        try {
          await promise;
          cache[frame.url] = true;
        } catch (error) {
          console.error(error);
        }
        
        // 更新进度
        setPreloadProgress(Math.round(((i + 1) / frames.length) * 100));
      }
      
      setImageCache(cache);
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
    // 使用a标签下载，而不是打开新窗口
    const link = document.createElement('a');
    link.href = frame.url;
    link.download = `frame_${frame.index + 1}.${frame.format || 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        const response = await fetch(frame.url);
        const blob = await response.blob();
        
        // 添加到zip文件，使用帧号作为文件名
        zip.file(`frame_${i + 1}.${frame.format || 'jpg'}`, blob);
        
        // 更新进度
        setDownloadProgress(Math.round(((i + 1) / totalFrames) * 100));
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
        const response = await fetch(frame.url);
        const blob = await response.blob();
        
        // 添加到zip文件，使用帧号作为文件名
        zip.file(`frame_${frameIndex + 1}.${frame.format || 'jpg'}`, blob);
        
        // 更新进度
        setDownloadProgress(Math.round(((i + 1) / totalSelected) * 100));
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

  // 批量选择功能
  const toggleSelectionMode = () => {
    setIsSelecting(!isSelecting);
  };

  // 全选
  const selectAllFrames = () => {
    setSelectedFrames(frames.map((_, index) => index));
  };

  // 取消全选
  const deselectAllFrames = () => {
    setSelectedFrames([]);
  };

  // 选择范围（例如：每隔N帧选择一帧）
  const selectInterval = (interval) => {
    const newSelected = [];
    for (let i = 0; i < frames.length; i += interval) {
      newSelected.push(i);
    }
    setSelectedFrames(newSelected);
  };

  // 反选
  const invertSelection = () => {
    const allIndices = frames.map((_, index) => index);
    const newSelected = allIndices.filter(index => !selectedFrames.includes(index));
    setSelectedFrames(newSelected);
  };

  // 打开Lightbox
  const openLightbox = (frame, index) => {
    setLightboxImage(frame);
    setLightboxIndex(index);
    // 防止滚动
    document.body.style.overflow = 'hidden';
  };

  return (
    <div>
      <div className="actions">
        <div className="actions-left">
          <span className="frames-count">共 {frames.length} 帧</span>
          <button
            className="btn btn-selection"
            onClick={toggleSelectionMode}
            type="button"
          >
            {isSelecting ? '完成选择' : '批量选择'}
          </button>
        </div>
        
        <div className="view-controls">
          <button
            className={`btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            type="button"
          >
            网格查看
          </button>
          <button
            className={`btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            type="button"
          >
            列表查看
          </button>
          <button
            onClick={downloadAllFrames}
            className="btn btn-download"
            disabled={isDownloading}
            type="button"
          >
            {isDownloading && downloadSelectedFrames ? '下载中...' : '下载全部'}
          </button>
        </div>
      </div>
      
      {isSelecting && (
        <div className="selection-toolbar">
          <div className="selection-info">
            已选择: <strong>{selectedFrames.length}</strong> / {frames.length} 帧
          </div>
          <div className="selection-actions">
            <button onClick={selectAllFrames} className="btn-selection-action" type="button">全选</button>
            <button onClick={deselectAllFrames} className="btn-selection-action" type="button">取消全选</button>
            <button onClick={invertSelection} className="btn-selection-action" type="button">反选</button>
            <div className="selection-interval">
              <label>每隔</label>
              <select 
                onChange={(e) => selectInterval(Number(e.target.value))}
                className="interval-select"
              >
                <option value="">-- 选择 --</option>
                <option value="2">2 帧</option>
                <option value="3">3 帧</option>
                <option value="5">5 帧</option>
                <option value="10">10 帧</option>
              </select>
              <label>选一帧</label>
            </div>
            <button
              onClick={downloadSelectedFrames}
              className="btn-download-selected"
              disabled={selectedFrames.length === 0 || isDownloading}
              type="button"
            >
              {isDownloading ? '下载中...' : `下载选中帧(${selectedFrames.length})`}
            </button>
          </div>
        </div>
      )}
      
      {isDownloading && (
        <div className="download-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">{downloadProgress}%</div>
        </div>
      )}
      
      {isPreloading && (
        <div className="preload-message">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${preloadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">加载图片中... {preloadProgress}%</div>
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
                  src={frame.url}
                  alt={`Frame ${index + 1}`}
                  className="frame-image full-image"
                  title={isSelecting ? '点击选择' : '点击查看大图'}
                />
                {isSelecting && selectedFrames.includes(index) && (
                  <div className="selected-overlay">
                    <div className="selected-indicator">✓</div>
                  </div>
                )}
              </div>
              <div className="frame-info">
                <p className="frame-number">帧 {index + 1}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFrame(frame);
                  }}
                  className="download-link"
                  type="button"
                >
                  下载
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
                <th>预览</th>
                <th>帧</th>
                <th>格式</th>
                <th>操作</th>
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
                      src={frame.url}
                      alt={`Frame ${index + 1}`}
                      className="thumbnail full-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(frame, index);
                      }}
                      title="点击查看大图"
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
                      下载
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox组件 - 添加改进的导航和信息 */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox} type="button">×</button>
            
            <button className="lightbox-nav lightbox-prev" onClick={viewPrevImage} title="上一张图片" type="button">
              &#10094;
            </button>
            
            <img 
              src={lightboxImage.url} 
              alt={`帧 ${lightboxIndex + 1}`}
              className="lightbox-image" 
            />
            
            <button className="lightbox-nav lightbox-next" onClick={viewNextImage} title="下一张图片" type="button">
              &#10095;
            </button>
            
            <div className="lightbox-footer">
              <div className="lightbox-caption">
                第 {lightboxIndex + 1} 帧 / 共 {frames.length} 帧
              </div>
              <div className="lightbox-actions">
                <label className="lightbox-select">
                  <input 
                    type="checkbox"
                    checked={selectedFrames.includes(lightboxIndex)}
                    onChange={() => toggleFrameSelection(lightboxIndex)}
                  />
                  选择此帧
                </label>
                <button 
                  className="lightbox-download-btn" 
                  onClick={() => downloadFrame(lightboxImage)}
                  type="button"
                >
                  下载图片
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