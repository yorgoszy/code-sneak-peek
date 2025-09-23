
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
          <div className="text-center">
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
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Robert Pro, sans-serif', color: '#aca097' }}>
            Αποτελέσματα
          </h2>
        </div>
        
        {results.length === 0 ? (
          <div className="text-center" style={{ color: '#aca097' }}>
            Δεν υπάρχουν αποτελέσματα προς εμφάνιση
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
              {results.map((result) => (
                <article key={result.id} className="bg-black rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
                  {result.image_url && (
                    <img 
                      src={result.image_url} 
                      alt={result.title_el}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-sm mb-2" style={{ color: '#aca097' }}>
                      {format(new Date(result.result_date), 'dd MMM yyyy')}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Robert Pro, sans-serif', color: '#aca097' }}>
                      {translations?.language === 'en' && result.title_en ? result.title_en : result.title_el}
                    </h3>
                    
                    <p className="mb-4 flex-grow" style={{ color: '#aca097' }}>
                      {translations?.language === 'en' && result.content_en ? result.content_en : result.content_el}
                    </p>
                    
                    {result.hashtags && (
                      <div className="flex flex-wrap gap-1">
                        {parseHashtags(result.hashtags).map((tag, index) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs rounded-full" style={{ backgroundColor: '#aca097', color: 'black' }}>
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
