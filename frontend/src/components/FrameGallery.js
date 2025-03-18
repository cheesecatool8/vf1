import React, { useState } from 'react';

function FrameGallery({ frames }) {
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [lightboxImage, setLightboxImage] = useState(null);

  const downloadFrame = (frame) => {
    const link = document.createElement('a');
    link.href = frame.url;
    link.download = `frame_${frame.timestamp || frame.index}.${frame.format || 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllFrames = () => {
    // 使用JSZip库可以在前端实现多文件打包下载
    // 这里简化处理，逐个下载
    frames.forEach((frame, index) => {
      setTimeout(() => {
        downloadFrame(frame);
      }, index * 500); // 每500毫秒下载一个，避免浏览器限制
    });
  };

  // 打开Lightbox
  const openLightbox = (frame) => {
    setLightboxImage(frame);
    // 防止滚动
    document.body.style.overflow = 'hidden';
  };

  // 关闭Lightbox
  const closeLightbox = () => {
    setLightboxImage(null);
    // 恢复滚动
    document.body.style.overflow = '';
  };

  return (
    <div>
      <div className="actions">
        <div>
          <span className="frames-count">共 {frames.length} 帧</span>
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
                <img
                  src={frame.url}
                  alt={`Frame ${index}`}
                  className="frame-image full-image"
                  onClick={() => openLightbox(frame)}
                  title="点击查看大图"
                />
              </div>
              <div className="frame-info">
                <p className="frame-number">帧 {index + 1}</p>
                <p className="frame-timestamp">时间戳: {frame.timestamp || '未知'}</p>
                <a
                  href={frame.url}
                  download={`frame_${frame.timestamp || index}.${frame.format || 'jpg'}`}
                  className="download-link"
                  onClick={(e) => {
                    e.preventDefault();
                    downloadFrame(frame);
                  }}
                >
                  下载
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="frames-table-container">
          <table className="frames-table">
            <thead>
              <tr>
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
                  <td className="thumbnail-cell">
                    <img
                      src={frame.url}
                      alt={`Frame ${index}`}
                      className="thumbnail full-image"
                      onClick={() => openLightbox(frame)}
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

      {/* Lightbox组件 */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>×</button>
            <img 
              src={lightboxImage.url} 
              alt="放大查看" 
              className="lightbox-image" 
            />
            <div className="lightbox-footer">
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