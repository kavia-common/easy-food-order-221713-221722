export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Money {
  currency: string; // e.g., 'USD'
  amount: number; // smallest unit or decimal amount per app convention; here we use decimal number in major units
}

export interface AddressSnapshot {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  instructions?: string;
}

export interface PaymentSnapshot {
  method: 'card' | 'cash' | 'wallet';
  last4?: string;
  brand?: string;
  txnRef?: string;
  paid: boolean;
}

export interface FulfillmentInfo {
  type: 'delivery' | 'pickup';
  scheduledAt?: string; // ISO timestamp
  deliveredAt?: string; // ISO timestamp
  pickedUpAt?: string; // ISO timestamp
  etaMinutes?: number;
}

export interface OrderLine {
  id: string;
  itemId: string;
  restaurantId: string;
  name: string;
  options?: string[]; // e.g., size or add-ons
  unitPrice: Money;
  quantity: number;
  imageUrl?: string;
}

export interface OrderTotals {
  subtotal: Money;
  discount?: Money;
  tax: Money;
  deliveryFee?: Money;
  tip?: Money;
  total: Money;
}

export interface OrderSummary {
  id: string;
  placedAt: string; // ISO
  status: OrderStatus;
  restaurantName: string;
  restaurantId: string;
  lineCount: number;
  total: Money;
}

export interface OrderDetail extends OrderSummary {
  lines: OrderLine[];
  fulfillment: FulfillmentInfo;
  addressSnapshot?: AddressSnapshot; // required for delivery
  paymentSnapshot?: PaymentSnapshot;
  notes?: string;
  couponCodes?: string[];
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface Invoice {
  orderId: string;
  invoiceNumber: string;
  issuedAt: string; // ISO
  billedTo: AddressSnapshot;
  lines: InvoiceLine[];
  totals: OrderTotals;
  payment: PaymentSnapshot;
  restaurantName: string;
  restaurantAddress?: AddressSnapshot;
  taxId?: string;
}
