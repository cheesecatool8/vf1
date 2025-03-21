import React from 'react';

/**
 * ErrorHandler组件 - 用于处理和显示各种错误
 * @param {Object} props - 组件属性
 * @param {string} props.error - 错误信息
 * @param {string} props.type - 错误类型：'upload', 'extract', 'server', 'network'
 * @param {Function} props.onRetry - 重试操作的回调函数
 * @param {boolean} props.showDetails - 是否显示详细错误信息
 */
function ErrorHandler({ error, type = 'general', onRetry, showDetails = false }) {
  // 根据错误类型获取提示信息
  const getErrorInfo = () => {
    switch (type) {
      case 'upload':
        return {
          title: '上传视频失败',
          message: '无法上传视频文件，请检查文件大小和格式是否符合要求。',
          solution: '请尝试使用较小的视频文件，或转换为支持的格式（MP4, AVI, MOV等）后重试。'
        };
      case 'extract':
        return {
          title: '提取视频帧失败',
          message: '服务器在处理您的视频时遇到问题，无法提取视频帧。',
          solution: '请尝试改变提取参数（如降低帧率或质量）或使用其他视频文件后重试。'
        };
      case 'server':
        return {
          title: '服务器错误',
          message: '服务器暂时无法响应请求，这可能是临时性问题。',
          solution: '请稍后再试，如果问题持续存在，请联系我们的支持团队（imluluj8@outlook.com）。'
        };
      case 'network':
        return {
          title: '网络连接错误',
          message: '无法连接到服务器，请检查您的网络连接。',
          solution: '请确保您已连接到互联网，然后刷新页面重试。'
        };
      default:
        return {
          title: '出现错误',
          message: '处理您的请求时遇到了问题。',
          solution: '请重试，如果问题持续存在，请联系支持团队。'
        };
    }
  };

  const errorInfo = getErrorInfo();
  
  // 获取错误代码（如果有）
  const getErrorCode = () => {
    if (typeof error === 'string') {
      const match = error.match(/(\d{3,4})/);
      return match ? match[0] : '';
    }
    return '';
  };
  
  const errorCode = getErrorCode();

  return (
    <div className="error-container">
      <div className="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
        </svg>
      </div>
      <h3 className="error-title">{errorInfo.title} {errorCode && `(${errorCode})`}</h3>
      <p className="error-message">{errorInfo.message}</p>
      <p className="error-solution">{errorInfo.solution}</p>
      
      {showDetails && error && (
        <div className="error-details">
          <p className="error-details-title">错误详情：</p>
          <p className="error-details-content">{error}</p>
        </div>
      )}
      
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  );
}

export default ErrorHandler; 