import React from 'react';

function Footer({ language, translations }) {
  // 获取翻译文本
  const getText = (key) => {
    return (translations[language] && translations[language][key]) || translations.en[key];
  };

  // 根据语言选择对应的版权和网站说明文本
  const getLocalizedText = () => {
    switch (language) {
      case 'zh':
        return {
          copyright: "© 2024 视频帧提取器. 保留所有权利.",
          privacy: "隐私政策",
          terms: "使用条款",
          contact_us: "联系我们",
          description: "视频帧提取器是一个在线工具，用于从视频中无损提取帧。"
        };
      case 'ja':
        return {
          copyright: "© 2024 ビデオフレーム抽出ツール. 全著作権所有.",
          privacy: "プライバシーポリシー",
          terms: "利用規約",
          contact_us: "お問い合わせ",
          description: "ビデオフレーム抽出ツールは、ビデオからフレームを抽出するためのオンラインツールです。"
        };
      case 'ko':
        return {
          copyright: "© 2024 비디오 프레임 추출기. 모든 권리 보유.",
          privacy: "개인정보 보호정책",
          terms: "이용약관",
          contact_us: "문의하기",
          description: "비디오 프레임 추출기는 비디오에서 프레임을 추출하기 위한 온라인 도구입니다."
        };
      case 'es':
        return {
          copyright: "© 2024 Extractor de Fotogramas de Vídeo. Todos los derechos reservados.",
          privacy: "Política de Privacidad",
          terms: "Términos de Uso",
          contact_us: "Contacto",
          description: "Extractor de Fotogramas es una herramienta en línea para extraer fotogramas de vídeos."
        };
      case 'fr':
        return {
          copyright: "© 2024 Extracteur de Frames Vidéo. Tous droits réservés.",
          privacy: "Politique de Confidentialité",
          terms: "Conditions d'Utilisation",
          contact_us: "Contactez-nous",
          description: "L'Extracteur de Frames Vidéo est un outil en ligne pour extraire des images de vidéos."
        };
      case 'de':
        return {
          copyright: "© 2024 Video-Frame-Extraktor. Alle Rechte vorbehalten.",
          privacy: "Datenschutzrichtlinie",
          terms: "Nutzungsbedingungen",
          contact_us: "Kontakt",
          description: "Video-Frame-Extraktor ist ein Online-Tool zum Extrahieren von Frames aus Videos."
        };
      default: // English
        return {
          copyright: "© 2024 Video Frame Extractor. All rights reserved.",
          privacy: "Privacy Policy",
          terms: "Terms of Use",
          contact_us: "Contact Us",
          description: "Video Frame Extractor is an online tool for extracting frames from videos."
        };
    }
  };

  const localText = getLocalizedText();

  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>{localText.copyright}</p>
          </div>
          <div>
            <ul className="flex space-x-4">
              <li><a href="#privacy" className="hover:text-blue-300">{localText.privacy}</a></li>
              <li><a href="#terms" className="hover:text-blue-300">{localText.terms}</a></li>
              <li><a href="#contact" className="hover:text-blue-300">{localText.contact_us}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>{localText.description}</p>
          <p>{getText('contact')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 