import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Euro, Clock, Youtube, ShoppingCart, Check, Lock } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
  pdf_url?: string | null;
}

interface CourseShopCardProps {
  course: Course;
  isPurchased: boolean;
  onBuy: (course: Course) => void;
  onOpen: (course: Course) => void;
}

export const CourseShopCard: React.FC<CourseShopCardProps> = ({
  course,
  isPurchased,
  onBuy,
  onOpen
}) => {
  const handleClick = () => {
    if (isPurchased) {
      onOpen(course);
    }
  };

  return (
    <Card 
      className={`rounded-none overflow-hidden transition-all ${
        isPurchased ? 'cursor-pointer hover:shadow-lg hover:border-[#00ffba]' : ''
      }`}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Youtube className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {isPurchased ? (
            <Badge className="rounded-none bg-[#00ffba] text-black">
              <Check className="w-3 h-3 mr-1" />
              Αγοράστηκε
            </Badge>
          ) : (
            <Badge className="rounded-none bg-[#cb8954] text-white">
              <Lock className="w-3 h-3 mr-1" />
              Κλειδωμένο
            </Badge>
          )}
        </div>
        
        {/* Price Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="rounded-none bg-black/70 text-white">
            <Euro className="w-3 h-3 mr-1" />
            {course.price}€
          </Badge>
        </div>
        
        {/* Duration Badge */}
        {course.duration_minutes && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="rounded-none bg-black/70 text-white">
              <Clock className="w-3 h-3 mr-1" />
              {course.duration_minutes} λεπτά
            </Badge>
          </div>
        )}
        
        {/* Locked Overlay */}
        {!isPurchased && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white/70" />
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm truncate">{course.title}</h3>
        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
        )}
        {course.category && (
          <Badge variant="outline" className="rounded-none text-xs">
            {course.category}
          </Badge>
        )}

        <div className="pt-2 border-t">
          {isPurchased ? (
            <Button
              size="sm"
              className="w-full rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(course);
              }}
            >
              Προβολή Μαθήματος
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full rounded-none bg-[#cb8954] hover:bg-[#cb8954]/90 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onBuy(course);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Αγορά - {course.price}€
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
