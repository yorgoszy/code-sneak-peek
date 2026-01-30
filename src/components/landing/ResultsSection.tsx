import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ResultsSectionProps {
  translations: any;
}

interface Result {
  id: string;
  title_el: string;
  title_en?: string;
  content_el: string;
  content_en?: string;
  hashtags?: string;
  result_date: string;
  image_url?: string;
  status: string;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ translations }) => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('status', 'published')
        .order('result_date', { ascending: false })
        .limit(6); // Περιορισμός στα 6 πιο πρόσφατα

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseHashtags = (hashtagsString: string) => {
    if (!hashtagsString) return [];
    return hashtagsString.split(' ').filter(tag => tag.startsWith('#'));
  };

  if (loading) {
    return (
      <section id="results" className="py-8 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert Pro, sans-serif', color: '#aca097' }}>
              Αποτελέσματα
            </h2>
            <div style={{ color: '#aca097' }}>Φόρτωση...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="results" className="py-8 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
            {translations?.language === 'en' ? 'Results' : 'Αποτελέσματα'}
          </h2>
        </div>
        
        {results.length === 0 ? (
          <div style={{ color: '#aca097' }}>
            Δεν υπάρχουν αποτελέσματα προς εμφάνιση
          </div>
        ) : isMobile ? (
          <div className="relative">
            <Carousel className="w-full max-w-sm mx-auto">
              {/* Navigation buttons positioned absolutely below title */}
              <div className="absolute -top-16 right-0 flex gap-2 z-10">
                <CarouselPrevious className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none hover:bg-transparent rounded-none text-white">
                  <ChevronLeft className="h-6 w-6" />
                </CarouselPrevious>
                <CarouselNext className="relative inset-auto translate-x-0 translate-y-0 h-10 w-10 bg-transparent border-none hover:bg-transparent rounded-none text-white">
                  <ChevronRight className="h-6 w-6" />
                </CarouselNext>
              </div>

              <CarouselContent>
                {results.map((result) => (
                  <CarouselItem key={result.id}>
                    <article className="bg-black rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
                      {result.image_url && (
                        <div className="relative">
                          <img 
                            src={result.image_url} 
                            alt={result.title_el}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
                        </div>
                      )}
                      
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="text-sm mb-2 text-white">
                          {format(new Date(result.result_date), 'dd MMM yyyy')}
                        </div>
                        
                        <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                          {translations?.language === 'en' && result.title_en ? result.title_en : result.title_el}
                        </h3>
                        
                        <p className="mb-4 flex-grow text-white">
                          {translations?.language === 'en' && result.content_en ? result.content_en : result.content_el}
                        </p>
                        
                        {result.hashtags && (
                          <div className="flex flex-wrap gap-1">
                            {parseHashtags(result.hashtags).map((tag, index) => (
                              <span key={index} className="inline-block px-2 py-1 text-xs rounded-full bg-white text-black">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
              {results.map((result) => (
                <article key={result.id} className="bg-black rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
                  {result.image_url && (
                    <div className="relative">
                      <img 
                        src={result.image_url} 
                        alt={result.title_el}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-sm mb-2 text-white">
                      {format(new Date(result.result_date), 'dd MMM yyyy')}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-white" style={{ fontFamily: 'Robert Pro, sans-serif' }}>
                      {translations?.language === 'en' && result.title_en ? result.title_en : result.title_el}
                    </h3>
                    
                    <p className="mb-4 flex-grow text-white">
                      {translations?.language === 'en' && result.content_en ? result.content_en : result.content_el}
                    </p>
                    
                    {result.hashtags && (
                      <div className="flex flex-wrap gap-1">
                        {parseHashtags(result.hashtags).map((tag, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs rounded-full bg-white text-black">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResultsSection;
