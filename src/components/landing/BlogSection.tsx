
import React, { useState, useEffect } from 'react';
import { BlogSectionProps, Article } from './blog/types';
import ArticleCard from './blog/ArticleCard';
import ArticleModal from './blog/ArticleModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const isMobile = useIsMobile();

  const currentLanguage = translations.language || 'el';

  // Fetch articles from database
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('published_date', { ascending: false })
          .limit(6);

        if (error) throw error;
        
        // Transform data to match Article interface
        const transformedArticles = (data || []).map(article => ({
          id: parseInt(article.id.substring(0, 8), 16), // Convert UUID to number for compatibility
          title: currentLanguage === 'el' ? article.title_el : (article.title_en || article.title_el),
          excerpt: currentLanguage === 'el' ? article.excerpt_el : (article.excerpt_en || article.excerpt_el),
          image: article.image_url || '',
          date: new Date(article.published_date).toLocaleDateString('el-GR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          content: currentLanguage === 'el' ? article.content_el : (article.content_en || article.content_el),
          bibliography: article.bibliography || ''
        }));
        
        setArticles(transformedArticles);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentLanguage]);

  // Auto-rotate carousel on mobile
  useEffect(() => {
    if (!api || !isMobile || isAutoplayPaused) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 1500);

    return () => clearInterval(interval);
  }, [api, isMobile, isAutoplayPaused]);

  const handleTouchStart = () => {
    if (isMobile) {
      setIsAutoplayPaused(true);
    }
  };

  const handleTouchEnd = () => {
    // Δεν επανεκκινούμε το autoplay πια
  };

  const handleScreenClick = () => {
    if (isMobile) {
      setIsAutoplayPaused(true);
    }
  };

  return (
    <section id="blog" className="pt-32 pb-28 bg-black" onClick={handleScreenClick}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white" style={{ fontFamily: 'Robert, sans-serif' }}>
            {translations.blogSection}
          </h2>
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
              <CarouselPrevious className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none hover:bg-transparent rounded-none text-white">
                <ChevronLeft className="h-6 w-6" />
              </CarouselPrevious>
              <CarouselNext className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none hover:bg-transparent rounded-none text-white">
                <ChevronRight className="h-6 w-6" />
              </CarouselNext>
            </div>

            <CarouselContent 
              className="-ml-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
            >
              {loading ? (
                <div className="flex items-center justify-center w-full p-8">
                  <div className="text-gray-500">Φόρτωση άρθρων...</div>
                </div>
              ) : articles.length === 0 ? (
                <div className="flex items-center justify-center w-full p-8">
                  <div className="text-gray-500">Δεν υπάρχουν άρθρα διαθέσιμα</div>
                </div>
              ) : (
                articles.map((article) => (
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
                ))
              )}
            </CarouselContent>
          </Carousel>
        </div>

        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          language={currentLanguage}
          translations={translations}
        />
      </div>
    </section>
  );
};

export default BlogSection;
