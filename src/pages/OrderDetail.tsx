import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import { Order } from '../api/types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { OrderStepper, OrderStatusBadge } from '../components/OrderStepper';
import { ErrorState } from '../components/ErrorState';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  ReceiptText,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    document.title = orderId
      ? `Order #${orderId} · ShopSphere`
      : 'Order Details · ShopSphere';
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getOrderById(Number(orderId));
      setOrder(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleCancel = async () => {
    if (!order) return;
    try {
      setCancelling(true);
      const updated = await ordersApi.cancelOrder(order.orderId);
      setOrder(updated);
      toast.success('Order cancelled successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const canCancel = order?.status === 'PENDING' || order?.status === 'CONFIRMED';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState message={error || 'Order not found'} onRetry={loadOrder} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line mb-8">
        <div>
          <h1 className="font-headline-h2 text-2xl font-bold text-on-surface">
            Order #{order.orderId}
          </h1>
          <p className="text-sm text-muted mt-1">
            Placed on {formatDate(order.placedAt)}
            {order.customerName && ` · ${order.customerName}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="h-9 px-4 rounded-lg border border-error text-error text-xs font-semibold hover:bg-error-container/20 flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Order Progress Stepper */}
      {order.status !== 'CANCELLED' && (
        <div className="mb-8">
          <OrderStepper status={order.status} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface rounded-2xl border border-line p-6">
            <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-primary" />
              Items Ordered
            </h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 border-b border-line last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-on-surface truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-sm text-on-surface ml-4">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">
                  Item details not available.{' '}
                  <Link to="/orders" className="text-primary hover:underline">
                    View order history
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Summary + Address + Payment */}
        <div className="space-y-4">
          {/* Price Summary */}
          <div className="bg-surface rounded-2xl border border-line p-5">
            <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
              <ReceiptText className="w-4 h-4 text-primary" />
              Summary
            </h2>
            <div className="space-y-2 text-sm">
              {order.itemCount !== undefined && (
                <div className="flex justify-between text-on-surface-variant">
                  <span>Items ({order.itemCount})</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Delivery</span>
                <span className="text-success font-medium">Free</span>
              </div>
              <div className="border-t border-line my-2 pt-2 flex justify-between font-bold text-on-surface">
                <span>Total Paid</span>
                <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div className="bg-surface rounded-2xl border border-line p-5">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                Delivery Address
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {order.deliveryAddress.line1}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
                {order.deliveryAddress.pincode}
              </p>
            </div>
          )}

          {/* Payment Info */}
          {(order.paymentStatus || order.transactionRef) && (
            <div className="bg-surface rounded-2xl border border-line p-5">
              <h2 className="font-semibold text-on-surface flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-primary" />
                Payment
              </h2>
              <div className="space-y-1.5 text-sm text-on-surface-variant">
                {order.paymentStatus && (
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span
                      className={
                        order.paymentStatus === 'COMPLETED'
                          ? 'text-success font-medium'
                          : 'text-warning font-medium'
                      }
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                )}
                {order.transactionRef && (
                  <div className="flex justify-between">
                    <span>Ref</span>
                    <span className="font-mono text-xs text-on-surface truncate max-w-[120px]">
                      {order.transactionRef}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirm Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Order?"
        message={`Are you sure you want to cancel Order #${order.orderId}? This action cannot be undone.`}
        confirmText={cancelling ? 'Cancelling…' : 'Yes, Cancel'}
        loading={cancelling}
        variant="danger"
        onConfirm={handleCancel}
        onClose={() => setShowCancelModal(false)}
      />
    </div>
  );
};
