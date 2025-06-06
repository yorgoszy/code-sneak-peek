
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BlogSectionProps, Article } from './blog/types';
import { articles } from './blog/blogData';
import ArticleCard from './blog/ArticleCard';
import ArticleModal from './blog/ArticleModal';

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentLanguage = translations.language || 'el';
  const currentArticles = articles[currentLanguage] || articles.el;

  const nextArticle = () => {
    setCurrentIndex((prev) => (prev + 1) % currentArticles.length);
  };

  const prevArticle = () => {
    setCurrentIndex((prev) => (prev - 1 + currentArticles.length) % currentArticles.length);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
            {translations.blogSection}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {translations.blogDescription}
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onReadMore={setSelectedArticle}
              translations={translations}
            />
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {currentArticles.map((article) => (
                <div key={article.id} className="w-full flex-shrink-0 px-4">
                  <ArticleCard
                    article={article}
                    onReadMore={setSelectedArticle}
                    translations={translations}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#00ffba] border-[#00ffba] text-black hover:bg-[#00cc99] rounded-none"
            onClick={prevArticle}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#00ffba] border-[#00ffba] text-black hover:bg-[#00cc99] rounded-none"
            onClick={nextArticle}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {currentArticles.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#00ffba]' : 'bg-gray-400'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
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
