
import React, { useState, useEffect } from 'react';
import { BlogSectionProps, Article } from './blog/types';
import ArticleCard from './blog/ArticleCard';
import ArticleModal from './blog/ArticleModal';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const BlogSection: React.FC<BlogSectionProps> = ({ translations }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<any>();

  const currentLanguage = translations.language || 'el';

  // Fetch articles from database
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('published_date', { ascending: false });

        if (error) throw error;

        // Transform data to match Article interface
        const transformedArticles = (data || []).map(article => ({
          id: parseInt(article.id.substring(0, 8), 16), // Convert UUID to number for compatibility
          title: currentLanguage === 'el' ? article.title_el : (article.title_en || article.title_el),
          excerpt: currentLanguage === 'el' ? article.excerpt_el : (article.excerpt_en || article.excerpt_el),
          image: article.image_url || '',
          date: new Date(article.published_date).toLocaleDateString(currentLanguage === 'el' ? 'el-GR' : 'en-US', {
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

  return (
    <section id="blog" className="pt-32 pb-28 bg-transparent relative z-10">
      {/* Banner — styled like About section */}
      <div className="relative w-full overflow-hidden flex items-center justify-center h-[18vw] min-h-[90px] md:h-[12vw] lg:h-[calc(10vw-1px)] bg-transparent">
        <div className="absolute inset-0 bg-black/30 z-0" />

        <button
          onClick={() => api?.scrollPrev()}
          aria-label="Previous slide"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <h3
          className="relative z-10 text-white text-center px-4 text-[14vw] md:text-[14vw] lg:text-[15.6vw] leading-none drop-shadow-lg"
          style={{ fontFamily: '"Roobert Pro", sans-serif', fontWeight: 500 }}
        >
          articles
        </h3>

        <button
          onClick={() => api?.scrollNext()}
          aria-label="Next slide"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 text-white p-2 hover:border hover:border-white transition-colors"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-16 mt-16">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
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
                    className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
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
