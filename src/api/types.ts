export interface User {
  id: number; // key is id, not userId per spec §7
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role?: 'CUSTOMER' | 'ADMIN';
}

export interface Address {
  addressId: number;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CreateAddressDto {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  categoryName?: string;
  imageUrl?: string;
  inStock?: boolean;
  createdAt?: string;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CartItem {
  itemId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string;
  available: boolean;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface WishlistItem {
  itemId: number;
  productId: number;
  productName: string;
  price: number;
  imageUrl?: string;
  inStock: boolean;
  addedAt: string;
}

export interface Wishlist {
  items: WishlistItem[];
  itemCount: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  orderId: number;
  status: OrderStatus;
  totalAmount: number;
  itemCount?: number;
  placedAt: string;
  paymentStatus?: string;
  transactionRef?: string;
  customerName?: string;
  userId?: number;
  deliveryAddress?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  items?: OrderItem[];
}

export interface Payment {
  paymentId: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionRef: string;
  processedAt: string;
  failureReason?: string;
}

export interface Review {
  reviewId: number;
  userId: number;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ReviewSummary {
  productId: number;
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
}

export interface PageResponse<T> {
  content: T[];
  page: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface Session {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  role: 'CUSTOMER' | 'ADMIN';
  expiresAt: number;
}
