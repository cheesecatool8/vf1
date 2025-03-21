import React from 'react';

function Footer({ language, translations }) {
  // 获取翻译文本
  const getText = (key) => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };

  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>&copy; 2024 视频帧提取器. 保留所有权利.</p>
          </div>
          <div>
            <ul className="flex space-x-4">
              <li><a href="#privacy" className="hover:text-blue-300">隐私政策</a></li>
              <li><a href="#terms" className="hover:text-blue-300">使用条款</a></li>
              <li><a href="#contact" className="hover:text-blue-300">联系我们</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>视频帧提取器是一个在线工具，用于从视频中无损提取帧。</p>
          <p>如有需求或建议反馈，欢迎联系：{getText('contact')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 