import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usersApi } from '../api/users';
import { ordersApi } from '../api/orders';
import { Address, CreateAddressDto, ApiError } from '../api/types';
import { formatCurrency } from '../utils/formatters';
import {
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

type PaymentMethodType = 'CARD' | 'UPI' | 'NET_BANKING' | 'CASH_ON_DELIVERY';

export const Checkout: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('UPI');

  // Address Form State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Submission & Failure states
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{
    status: number;
    message: string;
    showCartLink?: boolean;
    canRetry?: boolean;
  } | null>(null);

  React.useEffect(() => {
    document.title = 'Checkout · ShopSphere';
  }, []);

  // Redirect to /cart if empty or any item unavailable per spec §8
  useEffect(() => {
    if (cart) {
      if (cart.items.length === 0) {
        navigate('/cart', { replace: true });
        return;
      }
      const hasUnavailable = cart.items.some((i) => !i.available);
      if (hasUnavailable) {
        toast.error('Please remove unavailable items before checking out.');
        navigate('/cart', { replace: true });
      }
    }
  }, [cart, navigate]);

  // Load addresses
  const loadAddresses = async () => {
    try {
      const list = await usersApi.getAddresses();
      setAddresses(list);
      // Preselect default or first address per spec §8
      const defaultAddr = list.find((a) => a.isDefault) || list[0];
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.addressId);
      }
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!/^\d{6}$/.test(pincode.trim())) {
      setAddressError('Pincode must be exactly 6 digits');
      return;
    }

    try {
      setSavingAddress(true);
      // Never send isDefault on create per spec §7
      const newAddr = await usersApi.addAddress({
        line1: addressLine1.trim(),
        line2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      });

      await loadAddresses();
      setSelectedAddressId(newAddr.addressId);
      setShowAddAddress(false);
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setStateName('');
      setPincode('');
      toast.success('Address saved');
    } catch (err: any) {
      setAddressError(err?.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select or add a delivery address');
      return;
    }

    try {
      setSubmittingOrder(true);
      setErrorBanner(null);

      // NOTE: The simulated gateway fails any total ending in .99 returning 402 per spec §8 & §10
      const order = await ordersApi.createOrder({
        addressId: selectedAddressId,
        paymentMethod: selectedPaymentMethod,
      });

      // 201 Created -> refresh cart badge & navigate to /orders/:id per spec §8
      await refreshCart();
      navigate(`/orders/${order.orderId}`, {
        state: {
          justPlaced: true,
          transactionRef: order.transactionRef,
        },
      });
    } catch (err: unknown) {
      const apiErr = err as ApiError;

      // Handle 402 Payment Failed per spec §8: red banner, stay on page
      if (apiErr?.status === 402) {
        setErrorBanner({
          status: 402,
          message: 'Payment failed. Your order has not been placed.',
        });
      } else if (apiErr?.status === 400) {
        // Handle 400: empty cart, invalid address, stock shortfall -> show server message with link to cart
        setErrorBanner({
          status: 400,
          message: apiErr.message || 'Unable to place order.',
          showCartLink: true,
        });
      } else if (apiErr?.status === 503) {
        // Handle 503: server message with retry
        setErrorBanner({
          status: 503,
          message: apiErr.message || 'Payment service temporarily unavailable.',
          canRetry: true,
        });
      } else {
        setErrorBanner({
          status: apiErr?.status || 500,
          message: apiErr?.message || 'An error occurred while placing your order.',
        });
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  const paymentOptions: { id: PaymentMethodType; title: string; desc: string; icon: any }[] = [
    {
      id: 'UPI',
      title: 'Instant UPI / QR',
      desc: 'Pay using Google Pay, PhonePe, Paytm, or any UPI app',
      icon: QrCode,
    },
    {
      id: 'CARD',
      title: 'Credit / Debit Card',
      desc: 'Simulated gateway • All major domestic & international cards',
      icon: CreditCard,
    },
    {
      id: 'NET_BANKING',
      title: 'Net Banking',
      desc: 'Instant verification with HDFC, ICICI, SBI, Axis & 50+ banks',
      icon: Building2,
    },
    {
      id: 'CASH_ON_DELIVERY',
      title: 'Cash on Delivery (COD)',
      desc: 'Pay upon delivery at your doorstep via Cash or QR',
      icon: Banknote,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <div className="pb-6 border-b border-line mb-8">
        <h1 className="font-headline-h2 text-3xl font-bold text-on-surface">
          Consignment Checkout
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Review dispatch address and select your payment protocol
        </p>
      </div>

      {/* Failure Banners per spec §8 */}
      {errorBanner && (
        <div className="mb-8 p-4 rounded-xl bg-error-container/20 border border-error/30 text-error flex items-start justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">{errorBanner.message}</h4>
              {errorBanner.showCartLink && (
                <Link
                  to="/cart"
                  className="inline-block mt-2 text-xs font-bold underline hover:opacity-80"
                >
                  Return to Cart to review your items
                </Link>
              )}
            </div>
          </div>
          {errorBanner.canRetry && (
            <button
              type="button"
              onClick={handlePlaceOrder}
              className="px-3 py-1.5 rounded-lg bg-error text-on-error text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Order
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Address Selection & Payment Methods */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Delivery Address */}
          <section className="bg-surface rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <h2 className="font-caption-medium text-caption-medium font-bold text-on-surface text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                1. Select Delivery Destination
              </h2>
              <button
                type="button"
                onClick={() => setShowAddAddress((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-primary hover:bg-surface-container-high transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddAddress ? 'Cancel' : 'Add New Address'}
              </button>
            </div>

            {/* Inline Add Address Form per spec §8 */}
            {showAddAddress && (
              <form onSubmit={handleSaveAddress} className="mb-6 p-5 rounded-xl bg-surface-container-low border border-line space-y-3">
                <h3 className="font-semibold text-sm text-on-surface">New Address Details</h3>
                {addressError && (
                  <p className="text-xs text-error font-medium">{addressError}</p>
                )}

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House / Flat / Block No., Street"
                    className="w-full h-9 px-3 text-xs bg-surface rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Landmark, Apartment or Suite"
                    className="w-full h-9 px-3 text-xs bg-surface rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full h-9 px-3 text-xs bg-surface rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full h-9 px-3 text-xs bg-surface rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Pincode (6 digits) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="400001"
                      className="w-full h-9 px-3 text-xs bg-surface rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1.5 rounded-lg bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90"
                  >
                    {savingAddress ? 'Saving...' : 'Save & Select Address'}
                  </button>
                </div>
              </form>
            )}

            {/* Address Selection Radio Cards */}
            {addresses.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-line rounded-xl">
                <p className="text-xs text-muted mb-3">No delivery address saved yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90"
                >
                  Add Your Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.addressId;

                  return (
                    <div
                      key={addr.addressId}
                      onClick={() => setSelectedAddressId(addr.addressId)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                          : 'border-line bg-surface hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-caption-medium text-caption-medium font-bold text-on-surface text-sm">
                          {addr.city}, {addr.state}
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-semibold text-primary">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="font-caption text-caption text-on-surface-variant text-xs leading-relaxed">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                        <br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>

                      <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-xs">
                        <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-muted'}`}>
                          {isSelected ? '✓ Selected' : 'Click to select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Step 2: Payment Protocol (No card inputs per spec §8) */}
          <section className="bg-surface rounded-2xl border border-line p-6 shadow-sm">
            <h2 className="font-caption-medium text-caption-medium font-bold text-on-surface text-base pb-4 border-b border-line mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              2. Select Payment Protocol
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedPaymentMethod === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedPaymentMethod(opt.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-line bg-surface hover:border-primary/40'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-caption-medium text-caption-medium font-bold text-on-surface text-sm">
                          {opt.title}
                        </h4>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted mt-1 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-3.5 rounded-xl bg-surface-container-low border border-line text-xs text-muted flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                Payment gateway simulation active: No actual banking transactions or OTPs are executed.
              </span>
            </div>
          </section>
        </div>

        {/* Right Column: Order Confirmation Summary */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-6 shadow-sm space-y-5 sticky top-24">
          <h3 className="font-headline-h3 text-headline-h3 font-bold text-on-surface pb-3 border-b border-line">
            Consignment Ledger
          </h3>

          <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 divide-y divide-line">
            {cart?.items.map((item) => (
              <div key={item.itemId} className="pt-2 flex items-center justify-between text-xs">
                <div className="flex-1 truncate pr-2">
                  <span className="font-semibold text-on-surface block truncate">
                    {item.productName}
                  </span>
                  <span className="text-muted">Qty: {item.quantity}</span>
                </div>
                <span className="font-medium text-on-surface">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-line text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>Items Total</span>
              <span>{formatCurrency(cart?.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Priority Dispatch</span>
              <span className="text-success font-semibold">Free</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Taxes & GST (18%)</span>
              <span className="text-outline">Included</span>
            </div>
            <div className="pt-3 border-t border-line flex justify-between font-bold text-lg text-on-surface">
              <span>Total Payable</span>
              <span className="text-primary">{formatCurrency(cart?.subtotal || 0)}</span>
            </div>
          </div>

          {/* Place Order Button with double-submit protection per spec §8 */}
          <button
            type="button"
            disabled={submittingOrder || !selectedAddressId}
            onClick={handlePlaceOrder}
            className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-caption-medium text-caption-medium font-semibold shadow-md transition-all ${
              submittingOrder || !selectedAddressId
                ? 'bg-surface-container text-muted cursor-not-allowed'
                : 'bg-primary text-on-primary hover:opacity-95 active:scale-[0.98]'
            }`}
          >
            {submittingOrder ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing Payment Protocol...</span>
              </>
            ) : (
              <>
                Place Consignment Order
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
