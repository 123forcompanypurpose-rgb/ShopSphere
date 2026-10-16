import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  min = 1,
  max = 99,
  disabled = false,
  onChange,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && (max === undefined || value < max)) {
      onChange(value + 1);
    }
  };

  return (
    <div className="inline-flex items-center bg-surface-container rounded-lg p-1 border border-line">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={handleDecrement}
        aria-label="Decrease quantity"
        className="w-8 h-8 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface hover:text-on-surface disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="w-10 text-center font-caption-medium text-caption-medium text-on-surface font-semibold select-none">
        {value}
      </span>

      <button
        type="button"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={handleIncrement}
        aria-label="Increase quantity"
        className="w-8 h-8 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface hover:text-on-surface disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
