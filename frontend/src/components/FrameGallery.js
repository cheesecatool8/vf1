import React, { useState } from 'react';

function FrameGallery({ frames }) {
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const openFrame = (frame) => {
    setSelectedFrame(frame);
  };

  const closeFrame = () => {
    setSelectedFrame(null);
  };

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
                  onClick={() => openFrame(frame)}
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
                    onClick={() => openFrame(frame)}
                    className="frame-action-btn"
                    title="查看"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                      onClick={() => openFrame(frame)}
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
                      onClick={() => openFrame(frame)}
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
      
      {selectedFrame && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                帧 {frames.indexOf(selectedFrame) + 1}
                {selectedFrame.timestamp && ` - 时间戳: ${selectedFrame.timestamp}`}
              </h3>
              <button
                onClick={closeFrame}
                className="modal-close-btn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <img
                src={selectedFrame.url}
                alt={`Frame ${frames.indexOf(selectedFrame)}`}
                className="modal-image"
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => downloadFrame(selectedFrame)}
                className="btn download-frame-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="download-icon">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                下载此帧
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FrameGallery; 