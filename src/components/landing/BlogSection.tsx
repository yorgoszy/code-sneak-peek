
import React, { useState, useEffect } from 'react';
import { BlogSectionProps, Article } from './blog/types';
import { articles } from './blog/blogData';
import ArticleCard from './blog/ArticleCard';
import ArticleModal from './blog/ArticleModal';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [api, setApi] = useState<any>();
  const isMobile = useIsMobile();

  const currentLanguage = translations.language || 'el';
  const currentArticles = articles[currentLanguage] || articles.el;

  // Auto-rotate carousel on mobile
  useEffect(() => {
    if (!api || !isMobile) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 1500);

    return () => clearInterval(interval);
  }, [api, isMobile]);

  return (
    <section id="blog" className="py-21 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Robert, sans-serif' }}>
            {translations.blogSection}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {translations.blogDescription}
          </p>
        </div>

        <div className="relative mb-16">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            {/* Navigation buttons positioned absolutely in top right */}
            <div className="absolute -top-16 right-0 flex gap-2 z-10">
              <CarouselPrevious className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-gray-600 hover:text-[#00ffba] hover:bg-transparent rounded-none">
                <ChevronLeft className="h-6 w-6" />
              </CarouselPrevious>
              <CarouselNext className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none text-gray-600 hover:text-[#00ffba] hover:bg-transparent rounded-none">
                <ChevronRight className="h-6 w-6" />
              </CarouselNext>
            </div>

            <CarouselContent className="-ml-4">
              {currentArticles.map((article) => (
                <CarouselItem 
                  key={article.id} 
                  className={`pl-4 ${isMobile ? 'basis-full' : 'basis-1/3'}`}
                >
                  <ArticleCard
                    article={article}
                    onReadMore={setSelectedArticle}
                    translations={translations}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
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
