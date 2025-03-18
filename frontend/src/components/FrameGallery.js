import React, { useState, useEffect, useCallback } from 'react';

function FrameGallery({ frames }) {
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedFrames, setSelectedFrames] = useState([]);

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
    // 始终在新窗口打开下载链接
    window.open(frame.url, '_blank');
  };

  const downloadAllFrames = () => {
    // 使用JSZip库可以在前端实现多文件打包下载
    // 这里简化处理，逐个在新窗口打开下载链接
    frames.forEach((frame) => {
      window.open(frame.url, '_blank');
    });
  };

  const downloadSelectedFrames = () => {
    if (selectedFrames.length === 0) {
      alert('请先选择要下载的帧');
      return;
    }
    
    // 为每个选中的帧打开下载链接
    selectedFrames.forEach((frameIndex) => {
      window.open(frames[frameIndex].url, '_blank');
    });
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
        <div>
          <span className="frames-count">共 {frames.length} 帧</span>
          <button
            onClick={downloadSelectedFrames}
            className="btn btn-download selected-download-btn"
            style={{ display: 'inline-block' }} // 始终显示选中下载按钮
          >
            下载选中视频帧 {selectedFrames.length > 0 ? `(${selectedFrames.length})` : ''}
          </button>
        </div>
        
        <div className="view-controls">
          <button
            className={`btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            网格查看
          </button>
          <button
            className={`btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            列表查看
          </button>
          <button
            onClick={downloadAllFrames}
            className="btn btn-download"
          >
            下载全部
          </button>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="frames-container">
          {frames.map((frame, index) => (
            <div key={index} className="frame-card">
              <div className="frame-image-container">
                <div className="frame-selection">
                  <input
                    type="checkbox"
                    checked={selectedFrames.includes(index)}
                    onChange={() => toggleFrameSelection(index)}
                    className="frame-checkbox"
                  />
                </div>
                <img
                  src={frame.url}
                  alt={`Frame ${index}`}
                  className="frame-image full-image"
                  onClick={() => openLightbox(frame, index)}
                  title="点击查看大图"
                />
              </div>
              <div className="frame-info">
                <p className="frame-number">帧 {index + 1}</p>
                <p className="frame-timestamp">时间戳: {frame.timestamp || '未知'}</p>
                <button
                  onClick={() => downloadFrame(frame)}
                  className="download-link"
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
                <th>选择</th>
                <th>预览</th>
                <th>帧</th>
                <th>时间戳</th>
                <th>格式</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((frame, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedFrames.includes(index)}
                      onChange={() => toggleFrameSelection(index)}
                    />
                  </td>
                  <td className="thumbnail-cell">
                    <img
                      src={frame.url}
                      alt={`Frame ${index}`}
                      className="thumbnail full-image"
                      onClick={() => openLightbox(frame, index)}
                      title="点击查看大图"
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td>{frame.timestamp || '-'}</td>
                  <td>{frame.format || 'JPG'}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => downloadFrame(frame)}
                      className="table-action-btn download-btn"
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

      {/* Lightbox组件 - 添加更明显的导航按钮 */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>×</button>
            
            <button className="lightbox-nav lightbox-prev" onClick={viewPrevImage} title="上一张图片">
              &#10094;
            </button>
            
            <img 
              src={lightboxImage.url} 
              alt="放大查看" 
              className="lightbox-image" 
            />
            
            <button className="lightbox-nav lightbox-next" onClick={viewNextImage} title="下一张图片">
              &#10095;
            </button>
            
            <div className="lightbox-footer">
              <div className="lightbox-caption">
                第 {lightboxIndex + 1} 帧 / 共 {frames.length} 帧
              </div>
              <button 
                className="lightbox-download-btn" 
                onClick={() => downloadFrame(lightboxImage)}
              >
                下载图片
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FrameGallery; 