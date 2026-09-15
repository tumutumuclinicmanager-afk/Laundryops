import { Customer, Driver, ServiceItem, Order, Payment, Review, Stats, Reports } from "./types";

export const initialCustomers: Customer[] = [
  { id: "c1", name: "Wanjiku Mwangi", phone: "+254 712 345678", address: "Muthangari Rd, Lavington, Nairobi", notes: "Prefers eco-friendly detergent. Leave with gate security.", createdAt: "2026-08-01T10:00:00Z" },
  { id: "c2", name: "Dr. Kiprono Koech", phone: "+254 722 987654", address: "Westlands Office Park, Block B", notes: "Hangs shirts dry, no heavy starch.", createdAt: "2026-08-02T11:30:00Z" },
  { id: "c3", name: "Amina Otieno", phone: "+254 733 456789", address: "Nyali Estate, Links Rd, Mombasa", notes: "Gate code #4821. Call upon arrival.", createdAt: "2026-08-03T14:15:00Z" },
  { id: "c4", name: "Barasa Juma", phone: "+254 718 112233", address: "Kilimani Ring Rd, Nairobi", notes: "Quick turnaround requested if possible.", createdAt: "2026-08-05T09:00:00Z" }
];

export const initialDrivers: Driver[] = [
  { id: "d1", name: "Maina Kariuki", phone: "+254 720 123456", vehicle: "Motorcycle #1 (Boxer 150)", status: "On Delivery", username: "maina", password: "rider123" },
  { id: "d2", name: "Omari Ochieng", phone: "+254 731 654321", vehicle: "Motorcycle #2 (Honda Ace 125)", status: "Available", username: "omari", password: "rider123" },
  { id: "d3", name: "Muthoni Wamaitha", phone: "+254 740 987123", vehicle: "Motorcycle #3 (TVS Star HL)", status: "Available", username: "muthoni", password: "rider123" }
];

export const initialServices: ServiceItem[] = [
  { id: "s1", name: "Wash & Fold (Standard)", category: "Wash & Fold", unit: "kg", price: 150 },
  { id: "s2", name: "Wash & Fold (Heavy/Bedding)", category: "Wash & Fold", unit: "kg", price: 250 },
  { id: "s3", name: "Executive Suit (Dry Clean)", category: "Dry Cleaning", unit: "item", price: 1200 },
  { id: "s4", name: "Dress Shirt (Dry Clean & Press)", category: "Dry Cleaning", unit: "item", price: 350 },
  { id: "s5", name: "Winter Coat / Jacket", category: "Dry Cleaning", unit: "item", price: 1500 },
  { id: "s6", name: "Bed Duvet / Comforter", category: "Special Care", unit: "item", price: 1800 },
  { id: "s7", name: "Ironing Only", category: "Ironing", unit: "item", price: 100 }
];

export const initialOrders: Order[] = [
  {
    id: "ord-101",
    orderNumber: "ORD-101",
    customerId: "c1",
    customerName: "Wanjiku Mwangi",
    customerPhone: "+254 712 345678",
    customerAddress: "Muthangari Rd, Lavington, Nairobi",
    status: "Out for Delivery",
    pickupDate: new Date().toISOString().split("T")[0],
    pickupTimeWindow: "08:00 AM - 10:00 AM",
    deliveryDate: new Date().toISOString().split("T")[0],
    deliveryTimeWindow: "02:00 PM - 04:00 PM",
    driverId: "d1",
    driverName: "Maina Kariuki",
    items: [
      { serviceId: "s1", serviceName: "Wash & Fold (Standard)", unit: "kg", quantity: 6.5, unitPrice: 150, subtotal: 975 },
      { serviceId: "s4", serviceName: "Dress Shirt (Dry Clean & Press)", unit: "item", quantity: 3, unitPrice: 350, subtotal: 1050 }
    ],
    subtotal: 2025,
    discount: 0,
    total: 2025,
    paymentStatus: "Paid",
    amountPaid: 2025,
    balanceDue: 0,
    notes: "Please call upon arrival at gate.",
    proofOfDelivery: "Left with reception desk at 2:15 PM. Signed by security guard.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "ord-102",
    orderNumber: "ORD-102",
    customerId: "c2",
    customerName: "Dr. Kiprono Koech",
    customerPhone: "+254 722 987654",
    customerAddress: "Westlands Office Park, Block B",
    status: "In Process",
    pickupDate: new Date().toISOString().split("T")[0],
    pickupTimeWindow: "10:00 AM - 12:00 PM",
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    deliveryTimeWindow: "09:00 AM - 11:00 AM",
    driverId: "d2",
    driverName: "Omari Ochieng",
    items: [
      { serviceId: "s3", serviceName: "Executive Suit (Dry Clean)", unit: "item", quantity: 2, unitPrice: 1200, subtotal: 2400 },
      { serviceId: "s4", serviceName: "Dress Shirt (Dry Clean & Press)", unit: "item", quantity: 5, unitPrice: 350, subtotal: 1750 }
    ],
    subtotal: 4150,
    discount: 250,
    total: 3900,
    paymentStatus: "Unpaid",
    amountPaid: 0,
    balanceDue: 3900,
    notes: "Urgent turnaround for board meeting.",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "ord-103",
    orderNumber: "ORD-103",
    customerId: "c3",
    customerName: "Amina Otieno",
    customerPhone: "+254 733 456789",
    customerAddress: "Nyali Estate, Links Rd, Mombasa",
    status: "Pickup Scheduled",
    pickupDate: new Date().toISOString().split("T")[0],
    pickupTimeWindow: "03:00 PM - 05:00 PM",
    deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    deliveryTimeWindow: "01:00 PM - 03:00 PM",
    driverId: "d1",
    driverName: "Maina Kariuki",
    items: [
      { serviceId: "s2", serviceName: "Wash & Fold (Heavy/Bedding)", unit: "kg", quantity: 10.0, unitPrice: 250, subtotal: 2500 },
      { serviceId: "s6", serviceName: "Bed Duvet / Comforter", unit: "item", quantity: 1, unitPrice: 1800, subtotal: 1800 }
    ],
    subtotal: 4300,
    discount: 0,
    total: 4300,
    paymentStatus: "Partial",
    amountPaid: 2000,
    balanceDue: 2300,
    notes: "Gate code #4821.",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

export const initialPayments: Payment[] = [
  {
    id: "pay-1",
    orderId: "ord-101",
    orderNumber: "ORD-101",
    customerName: "Wanjiku Mwangi",
    amount: 2025,
    method: "Mobile Money",
    reference: "MPESA-QHJ7829",
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    notes: "Paid via M-Pesa upon delivery"
  },
  {
    id: "pay-2",
    orderId: "ord-103",
    orderNumber: "ORD-103",
    customerName: "Amina Otieno",
    amount: 2000,
    method: "Mobile Money",
    reference: "MPESA-RTY4910",
    date: new Date(Date.now() - 3600000 * 10).toISOString(),
    notes: "Advance M-Pesa deposit"
  }
];

export const initialReviews: Review[] = [
  {
    id: "rev-1",
    customerName: "Faith Muthoni",
    rating: 5,
    comment: "Exceptional service! The rider picked up my laundry right from my apartment at 9 AM and delivered everything crisply pressed and folded the next afternoon. Saved me hours on the weekend!",
    serviceUsed: "Wash & Fold + Ironing",
    date: "2026-09-08",
    verified: true
  },
  {
    id: "rev-2",
    customerName: "Brian Omondi",
    rating: 5,
    comment: "My two wool business suits look brand new after dry cleaning. Zero chemical odor, crisp lapels, and punctual delivery in Westlands. Will definitely be a repeat client.",
    serviceUsed: "Dry Cleaning (Suits)",
    date: "2026-09-05",
    verified: true
  },
  {
    id: "rev-3",
    customerName: "Esther W.",
    rating: 5,
    comment: "Booking was effortless with no account needed. Got our king duvet cleaned, fresh smelling, and packaged in a protective zipped garment bag. Punctual rider Maina was very courteous.",
    serviceUsed: "Bed Duvet / Comforter Cleaning",
    date: "2026-08-30",
    verified: true
  },
  {
    id: "rev-4",
    customerName: "David Kipchoge",
    rating: 4,
    comment: "Reliable turnaround time and convenient M-Pesa payment on delivery. The rider called 10 minutes ahead of delivery. Very professional service.",
    serviceUsed: "Wash & Fold",
    date: "2026-08-22",
    verified: true
  }
];

export function computeStats(orders: Order[], payments: Payment[]): Stats {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPickups = orders.filter(o => o.pickupDate === todayStr);
  const todayDeliveries = orders.filter(o => o.deliveryDate === todayStr);
  const inProgress = orders.filter(o => [
    "Pickup Scheduled",
    "Picked Up",
    "In Process",
    "Ready for Delivery",
    "Out for Delivery"
  ].includes(o.status));
  const unpaidOrders = orders.filter(o => o.paymentStatus !== "Paid");
  const totalOutstanding = unpaidOrders.reduce((acc, o) => acc + (o.balanceDue || 0), 0);
  const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  return {
    todayPickupsCount: todayPickups.length,
    todayDeliveriesCount: todayDeliveries.length,
    inProgressCount: inProgress.length,
    totalOutstanding,
    totalRevenue,
    todayPickups,
    todayDeliveries,
    recentOrders
  };
}

export function computeReports(orders: Order[], payments: Payment[], customersCount: number = 0): Reports {
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "Completed" || o.status === "Delivered").length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstanding = orders.reduce((sum, o) => sum + (o.balanceDue || 0), 0);

  const revenueByMethod: Record<string, number> = {};
  payments.forEach(p => {
    revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + (p.amount || 0);
  });

  return {
    totalOrders,
    completedOrders,
    totalRevenue,
    totalOutstanding,
    revenueByMethod,
    customersCount
  };
}
