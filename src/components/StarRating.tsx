import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 1-5 or fractional
  max?: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  interactive = false,
  size = 'md',
  onChange,
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(starValue)}
              className="focus:outline-none transition-transform hover:scale-110"
              aria-label={`Rate ${starValue} stars`}
            >
              <Star
                className={`${iconSize} ${
                  isFilled ? 'fill-accent text-accent' : 'text-outline/40 hover:text-accent'
                }`}
              />
            </button>
          );
        }

        return (
          <Star
            key={i}
            className={`${iconSize} ${
              isFilled ? 'fill-accent text-accent' : 'text-outline/30'
            }`}
          />
        );
      })}
    </div>
  );
};
