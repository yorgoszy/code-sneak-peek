import React, { useRef, useEffect } from 'react';
import { Article } from './types';
import { getBibliography } from './blogBibliography';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  language: string;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose, language }) => {
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
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="relative">
          <img 
            src={article.image} 
            alt={article.title}
            className={`w-full h-64 object-cover object-center ${article.id === 2 ? 'mt-8' : ''}`}
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
          <div className="text-sm text-[#00ffba] mb-2">{article.date}</div>
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
          <div dangerouslySetInnerHTML={{ __html: getBibliography(article.id, language) }} />
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
