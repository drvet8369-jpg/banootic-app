
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  reviewsCount?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'default';
}

export function StarRating({
  rating,
  reviewsCount,
  onRatingChange,
  readOnly = false,
  size = 'default',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (index: number) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(index);
    }
  };

  const handleStarHover = (index: number) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  };

  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const effectiveRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn("flex items-center text-yellow-400", !readOnly && "cursor-pointer")}
        onMouseLeave={() => handleStarHover(0)}
      >
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          return (
            <Star
              key={i}
              className={cn(
                starSize,
                effectiveRating >= starValue ? 'fill-current' : 'text-gray-300'
              )}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
            />
          );
        })}
      </div>
      {reviewsCount !== undefined && (
         <div className="w-full text-center">
            <span className="text-muted-foreground text-xs">({reviewsCount} نظر)</span>
         </div>
      )}
    </div>
  );
};
