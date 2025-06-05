
import React, { useState } from 'react';
import { BlogSectionProps, Article } from './blog/types';
import { articles } from './blog/blogData';
import ArticleCard from './blog/ArticleCard';
import ArticleModal from './blog/ArticleModal';

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const currentLanguage = translations.language || 'el';
  const currentArticles = articles[currentLanguage] || articles.el;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
            {translations.blogSection}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {translations.blogDescription}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onReadMore={setSelectedArticle}
              translations={translations}
            />
          ))}
        </div>

        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          language={currentLanguage}
        />
      </div>
    </section>
  );
};

export default BlogSection;
