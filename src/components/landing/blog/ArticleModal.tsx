
import React, { useRef, useEffect } from 'react';
import { Article } from './types';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  language: string;
  translations: any;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose, language, translations }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (article) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cb8954;
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #b87849;
          }
        `}
      </style>
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className={`relative ${article.id === 2 ? 'pt-8' : ''}`}>
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-64 object-cover object-center"
            style={{
              objectPosition: article.id === 2 ? 'center 30%' : 'center'
            }}
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8">
          <div className="text-sm mb-2 text-gray-600">{article.date}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Robert, sans-serif' }}>
            {article.title}
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Bibliography Section */}
          {article.bibliography && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">{translations.bibliography}</h3>
              <div className="text-[11px] text-gray-500 leading-tight space-y-1">
                {article.bibliography.split('\n').map((line, index) => {
                  if (line.trim() === '') return null;
                  return (
                    <div key={index} className="break-words">
                      {line.trim()}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
