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
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-gray-700">共 {frames.length} 帧</span>
        </div>
        
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('grid')}
          >
            网格
          </button>
          <button
            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('list')}
          >
            列表
          </button>
          <button
            onClick={downloadAllFrames}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded ml-2"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载全部
          </button>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {frames.map((frame, index) => (
            <div key={index} className="bg-gray-100 rounded p-2">
              <div className="relative group">
                <img
                  src={frame.url}
                  alt={`Frame ${index}`}
                  className="w-full h-auto rounded cursor-pointer"
                  onClick={() => openFrame(frame)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => downloadFrame(frame)}
                    className="bg-white rounded-full p-2 mx-1"
                  >
                    <svg className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openFrame(frame)}
                    className="bg-white rounded-full p-2 mx-1"
                  >
                    <svg className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <div>时间戳: {frame.timestamp || `${index + 1}`}</div>
                <div>格式: {frame.format || 'JPG'}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预览</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">帧</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间戳</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">格式</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {frames.map((frame, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={frame.url}
                      alt={`Frame ${index}`}
                      className="h-14 w-auto rounded cursor-pointer"
                      onClick={() => openFrame(frame)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{frame.timestamp || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{frame.format || 'JPG'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => downloadFrame(frame)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      下载
                    </button>
                    <button
                      onClick={() => openFrame(frame)}
                      className="text-gray-600 hover:text-gray-800"
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                帧 {frames.indexOf(selectedFrame) + 1}
                {selectedFrame.timestamp && ` - 时间戳: ${selectedFrame.timestamp}`}
              </h3>
              <button
                onClick={closeFrame}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex justify-center">
              <img
                src={selectedFrame.url}
                alt={`Frame ${frames.indexOf(selectedFrame)}`}
                className="max-h-[70vh] max-w-full"
              />
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => downloadFrame(selectedFrame)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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