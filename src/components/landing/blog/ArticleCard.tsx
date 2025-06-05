
import React from 'react';
import { Article } from './types';

interface ArticleCardProps {
  article: Article;
  onReadMore: (article: Article) => void;
  translations: any;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore, translations }) => {
  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
      <img 
        src={article.image} 
        alt={article.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6 flex flex-col flex-grow">
        <div className="text-sm text-[#00ffba] mb-2">{article.date}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Robert, sans-serif' }}>
          {article.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
          {article.excerpt}
        </p>
        <button 
          onClick={() => onReadMore(article)}
          className="text-[#00ffba] hover:text-[#00cc96] font-semibold transition-colors mt-auto text-left"
        >
          {translations.blog?.readMore || 'Διαβάστε περισσότερα →'}
        </button>
      </div>
    </article>
  );
};

export default ArticleCard;
