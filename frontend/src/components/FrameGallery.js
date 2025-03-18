import React, { useState } from 'react';

function FrameGallery({ frames }) {
  const [viewMode, setViewMode] = useState('grid'); // grid or list

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

  // 直接在新标签页打开图片
  const openImageInNewTab = (url) => {
    window.open(url, '_blank');
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
                  className="frame-image"
                  onClick={() => openImageInNewTab(frame.url)}
                  title="点击在新标签页查看原图"
                />
                <div className="frame-hover-overlay">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFrame(frame);
                    }}
                    className="frame-action-btn"
                    title="下载"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openImageInNewTab(frame.url)}
                    className="frame-action-btn"
                    title="在新标签页查看原图"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
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
                      className="thumbnail"
                      onClick={() => openImageInNewTab(frame.url)}
                      title="点击在新标签页查看原图"
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
                    <button
                      onClick={() => openImageInNewTab(frame.url)}
                      className="table-action-btn view-btn"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FrameGallery; 