import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong while loading this data.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-surface rounded-2xl border border-line my-6">
      <div className="w-14 h-14 rounded-full bg-error-container/20 text-error flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="font-headline-h3 text-headline-h3 font-semibold text-on-surface mb-2">
        Unable to Load Data
      </h3>
      <p className="font-body text-body text-on-surface-variant max-w-md mb-6 text-sm">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-10 px-5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-caption-medium text-caption-medium flex items-center gap-2 border border-line transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};
