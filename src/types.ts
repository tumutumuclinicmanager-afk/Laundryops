export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'Available' | 'On Delivery' | 'Off Duty';
  username?: string;
  password?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'Wash & Fold' | 'Dry Cleaning' | 'Ironing' | 'Special Care';
  unit: 'kg' | 'item' | 'fixed';
  price: number;
}

export interface OrderItem {
  serviceId: string;
  serviceName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type OrderStatus =
  | 'New'
  | 'Pickup Scheduled'
  | 'Picked Up'
  | 'In Process'
  | 'Ready for Delivery'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Completed';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: OrderStatus;
  pickupDate: string;
  pickupTimeWindow: string;
  deliveryDate: string;
  deliveryTimeWindow: string;
  driverId?: string;
  driverName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  proofOfDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Card';
  reference?: string;
  date: string;
  notes?: string;
}

export interface Stats {
  todayPickupsCount: number;
  todayDeliveriesCount: number;
  inProgressCount: number;
  totalOutstanding: number;
  totalRevenue: number;
  todayPickups: Order[];
  todayDeliveries: Order[];
  recentOrders: Order[];
}

export interface Reports {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalOutstanding: number;
  revenueByMethod: Record<string, number>;
  customersCount: number;
}
