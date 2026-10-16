import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl border border-line p-4 animate-pulse flex flex-col justify-between">
      <div className="aspect-square w-full bg-surface-container rounded-lg mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-1/4 bg-surface-container rounded" />
        <div className="h-4 w-3/4 bg-surface-container rounded" />
        <div className="h-4 w-1/2 bg-surface-container rounded" />
      </div>
      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
        <div className="h-6 w-1/3 bg-surface-container rounded" />
        <div className="h-9 w-20 bg-surface-container rounded-lg" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-surface-container-low rounded-lg w-full" />
      ))}
    </div>
  );
};
