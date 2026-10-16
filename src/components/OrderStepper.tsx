import React from 'react';
import { OrderStatus } from '../api/types';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertOctagon } from 'lucide-react';

interface OrderStepperProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const configs: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-surface-container text-muted', text: 'text-muted', label: 'Pending Payment' },
    CONFIRMED: { bg: 'bg-info/15 text-info border border-info/20', text: 'text-info', label: 'Confirmed' },
    SHIPPED: { bg: 'bg-primary/15 text-primary border border-primary/20', text: 'text-primary', label: 'Shipped' },
    DELIVERED: { bg: 'bg-success/15 text-success border border-success/20', text: 'text-success', label: 'Delivered' },
    CANCELLED: { bg: 'bg-error-container text-on-error-container', text: 'text-error', label: 'Cancelled' },
  };

  const config = configs[status] || configs.PENDING;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${config.bg}`}>
      {config.label}
    </span>
  );
};

export const OrderStepper: React.FC<OrderStepperProps> = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="w-full p-4 rounded-xl bg-error-container/20 border border-error/30 text-error flex items-center gap-3">
        <AlertOctagon className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-semibold text-sm">Order Cancelled</h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            This consignment was cancelled. Any debited amount will be returned to your original payment source.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
  ];

  const getStepIndex = (s: OrderStatus) => {
    switch (s) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 0;
      case 'SHIPPED':
        return 1;
      case 'DELIVERED':
        return 2;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-line -z-10" />
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-primary text-on-primary ring-4 ring-primary/20'
                    : 'bg-surface border-2 border-line text-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`mt-2 font-caption-medium text-caption-medium ${
                  isCurrent
                    ? 'text-primary font-bold'
                    : isCompleted
                    ? 'text-on-surface font-semibold'
                    : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
