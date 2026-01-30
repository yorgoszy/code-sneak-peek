
import React from 'react';
import { Article } from './types';

interface ArticleCardProps {
  article: Article;
  onReadMore: (article: Article) => void;
  translations: any;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore, translations }) => {
  return (
    <article className="bg-black rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
      <div className="relative">
        <img 
          src={article.image} 
          alt={article.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="text-sm mb-2 text-white">{article.date}</div>
        <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Robert, sans-serif' }}>
          {article.title}
        </h3>
        <p className="mb-4 line-clamp-3 flex-grow text-white">
          {article.excerpt}
        </p>
        <button 
          onClick={() => onReadMore(article)}
          className="hover:opacity-80 font-semibold transition-colors mt-auto text-left text-white"
        >
          {translations.blog?.readMore || 'Διαβάστε περισσότερα →'}
        </button>
      </div>
    </article>
  );
};

export default ArticleCard;
