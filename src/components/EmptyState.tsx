import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface rounded-2xl border border-line my-6">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-headline-h3 text-headline-h3 font-semibold text-on-surface mb-2">
        {title}
      </h3>
      <p className="font-body text-body text-on-surface-variant max-w-md mb-6 text-sm">
        {description}
      </p>

      {actionText && actionHref && (
        <Link
          to={actionHref}
          className="h-10 px-5 rounded-lg bg-primary text-on-primary font-caption-medium text-caption-medium flex items-center justify-center hover:opacity-95 shadow-sm transition-opacity"
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="h-10 px-5 rounded-lg bg-primary text-on-primary font-caption-medium text-caption-medium flex items-center justify-center hover:opacity-95 shadow-sm transition-opacity"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
