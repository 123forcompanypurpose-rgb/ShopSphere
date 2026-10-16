import React, { useEffect, useState, useCallback } from 'react';
import { ordersApi } from '../api/orders';
import { Order, OrderStatus, PageResponse } from '../api/types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { OrderStatusBadge } from '../components/OrderStepper';
import { TableSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const AdminOrders: React.FC = () => {
  const [data, setData] = useState<PageResponse<Order> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update
  const [updateTarget, setUpdateTarget] = useState<{
    order: Order;
    newStatus: OrderStatus;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  // Status filter
  const [statusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  useEffect(() => {
    document.title = 'Order Management · SphereHQ';
  }, []);

  const loadOrders = useCallback(
    async (pageNum = 0) => {
      try {
        setLoading(true);
        setError(null);
        const res = await ordersApi.getAdminOrders(pageNum, 10);
        setData(res);
        setPage(pageNum);
      } catch (err: any) {
        setError(err?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadOrders(0);
  }, []);

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    setUpdateTarget({ order, newStatus });
  };

  const confirmStatusUpdate = async () => {
    if (!updateTarget) return;
    try {
      setUpdating(true);
      await ordersApi.updateAdminOrderStatus(updateTarget.order.orderId, updateTarget.newStatus);
      toast.success(
        `Order #${updateTarget.order.orderId} → ${updateTarget.newStatus}`,
      );
      setUpdateTarget(null);
      loadOrders(page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  // Filter client-side (data is already paginated from server)
  const displayedOrders =
    statusFilter === 'ALL'
      ? data?.content ?? []
      : (data?.content ?? []).filter((o) => o.status === statusFilter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Order Management</h1>
          <p className="text-sm text-muted mt-0.5">
            Review and update the status of all customer orders
          </p>
        </div>
        {data && (
          <span className="text-sm text-muted">
            {data.totalElements} total order{data.totalElements !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadOrders(page)} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No Orders Yet"
          description="Orders placed by customers will appear here."
        />
      ) : (
        <>
          <div className="bg-surface rounded-2xl border border-line overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-container text-left">
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">Order</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant hidden md:table-cell">
                    Customer
                  </th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">Amount</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">Status</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant text-right">
                    Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {displayedOrders.map((order) => {
                  const nextStatuses = STATUS_TRANSITIONS[order.status] ?? [];
                  return (
                    <tr
                      key={order.orderId}
                      className="hover:bg-surface-container/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-on-surface">
                          #{order.orderId}
                        </span>
                        {order.itemCount !== undefined && (
                          <p className="text-xs text-muted">
                            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant hidden md:table-cell">
                        {order.customerName || `User #${order.userId ?? '—'}`}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant hidden sm:table-cell">
                        {formatDate(order.placedAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-on-surface">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {nextStatuses.length > 0 ? (
                          <div className="relative inline-block group">
                            <button
                              type="button"
                              className="h-8 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1 transition-colors"
                            >
                              Move to <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 z-10 bg-surface border border-line rounded-xl shadow-lg overflow-hidden hidden group-hover:block min-w-[140px]">
                              {nextStatuses.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleStatusChange(order, s)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                disabled={data.page === 0}
                onClick={() => loadOrders(data.page - 1)}
                className="h-8 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-xs text-muted">
                Page {data.page + 1} of {data.totalPages}
              </span>
              <button
                type="button"
                disabled={data.last}
                onClick={() => loadOrders(data.page + 1)}
                className="h-8 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Status update confirm */}
      <ConfirmModal
        isOpen={!!updateTarget}
        title="Update Order Status?"
        message={
          updateTarget
            ? `Move Order #${updateTarget.order.orderId} from ${updateTarget.order.status} → ${updateTarget.newStatus}?`
            : ''
        }
        confirmText={updating ? 'Updating…' : 'Confirm'}
        loading={updating}
        variant="primary"
        onConfirm={confirmStatusUpdate}
        onClose={() => setUpdateTarget(null)}
      />
    </div>
  );
};
