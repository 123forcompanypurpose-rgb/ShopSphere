import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import { Order, PageResponse } from '../api/types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { OrderStatusBadge } from '../components/OrderStepper';
import { TableSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  Package,
  ChevronRight,
  ChevronLeft,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export const Orders: React.FC = () => {
  const [data, setData] = useState<PageResponse<Order> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = 'Order History · ShopSphere';
  }, []);

  const loadOrders = async (pageNum = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.getOrders(pageNum, 8);
      setData(res);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(0);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="h-8 w-48 bg-surface-container rounded mb-8 animate-pulse" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState message={error} onRetry={() => loadOrders(page)} />
      </div>
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={Package}
          title="No Orders Placed Yet"
          description="You haven't placed any orders yet. Explore our curated collections to find your favorite styles."
          actionText="Browse Collection"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <div className="pb-6 border-b border-line mb-8">
        <h1 className="font-headline-h2 text-3xl font-bold text-on-surface">
          Your Orders
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {data.totalElements} {data.totalElements === 1 ? 'order' : 'orders'} placed with order tracking
        </p>
      </div>

      <div className="space-y-4">
        {data.content.map((order) => (
          <div
            key={order.orderId}
            className="p-6 bg-surface rounded-2xl border border-line shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-headline-h3 text-headline-h3 font-bold text-on-surface">
                  Order #{order.orderId}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Placed on {formatDate(order.placedAt)}
                </span>
                {order.itemCount !== undefined && (
                  <span>• {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-line">
              <div className="text-left md:text-right">
                <span className="text-xs text-muted block">Total Payable</span>
                <span className="font-headline-h3 text-headline-h3 font-bold text-on-surface text-lg">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>

              <Link
                to={`/orders/${order.orderId}`}
                className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-caption-medium text-caption-medium flex items-center gap-2 border border-line transition-colors text-xs font-semibold"
              >
                Track & Details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10 pt-6 border-t border-line">
          <button
            type="button"
            disabled={data.page === 0}
            onClick={() => loadOrders(data.page - 1)}
            className="h-9 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs text-muted">
            Page {data.page + 1} of {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last}
            onClick={() => loadOrders(data.page + 1)}
            className="h-9 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40 flex items-center gap-1"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
