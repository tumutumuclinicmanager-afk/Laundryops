import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import fs from "fs";

let firestore: any = null;
try {
  const firebaseAdmin = (admin as any).default || admin;
  let projectId = "balmy-parity-mdw77";
  let databaseId = "ai-studio-laundryopsmanage-1920ac0b-bf06-4683-97e5-3104d6cbdfc6";
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (configData.projectId) projectId = configData.projectId;
      if (configData.firestoreDatabaseId) databaseId = configData.firestoreDatabaseId;
    }
  } catch (e) {
    console.error("Error reading firebase config:", e);
  }

  if (firebaseAdmin) {
    if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
      try {
        firebaseAdmin.initializeApp({
          projectId: projectId,
        });
      } catch (err) {
        console.error("initializeApp error:", err);
      }
    }
    try {
      firestore = firebaseAdmin.firestore(undefined, { databaseId: databaseId });
    } catch (err) {
      try {
        firestore = firebaseAdmin.firestore();
      } catch (err2) {
        console.error("firestore init error:", err2);
      }
    }
  }
} catch (e) {
  console.error("Firebase admin init failed:", e);
}

const app = express();
const PORT = 3000;

app.use(express.json());

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'Available' | 'On Delivery' | 'Off Duty';
  username?: string;
  password?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  category: 'Wash & Fold' | 'Dry Cleaning' | 'Ironing' | 'Special Care';
  unit: 'kg' | 'item' | 'fixed';
  price: number;
}

interface OrderItem {
  serviceId: string;
  serviceName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: 'New' | 'Pickup Scheduled' | 'Picked Up' | 'In Process' | 'Ready for Delivery' | 'Out for Delivery' | 'Delivered' | 'Completed';
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

interface Payment {
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

// Initial Seed Data
const initialCustomers: Customer[] = [
  { id: "c1", name: "Wanjiku Mwangi", phone: "+254 712 345678", address: "Muthangari Rd, Lavington, Nairobi", notes: "Prefers eco-friendly detergent. Leave with gate security.", createdAt: "2026-08-01T10:00:00Z" },
  { id: "c2", name: "Dr. Kiprono Koech", phone: "+254 722 987654", address: "Westlands Office Park, Block B", notes: "Hangs shirts dry, no heavy starch.", createdAt: "2026-08-02T11:30:00Z" },
  { id: "c3", name: "Amina Otieno", phone: "+254 733 456789", address: "Nyali Estate, Links Rd, Mombasa", notes: "Gate code #4821. Call upon arrival.", createdAt: "2026-08-03T14:15:00Z" },
  { id: "c4", name: "Barasa Juma", phone: "+254 718 112233", address: "Kilimani Ring Rd, Nairobi", notes: "Quick turnaround requested if possible.", createdAt: "2026-08-05T09:00:00Z" }
];

const initialDrivers: Driver[] = [
  { id: "d1", name: "Maina Kariuki", phone: "+254 720 123456", vehicle: "Motorcycle #1 (Boxer 150)", status: "On Delivery", username: "maina", password: "rider123" },
  { id: "d2", name: "Omari Ochieng", phone: "+254 731 654321", vehicle: "Motorcycle #2 (Honda Ace 125)", status: "Available", username: "omari", password: "rider123" },
  { id: "d3", name: "Muthoni Wamaitha", phone: "+254 740 987123", vehicle: "Motorcycle #3 (TVS Star HL)", status: "Available", username: "muthoni", password: "rider123" }
];

const initialServices: ServiceItem[] = [
  { id: "s1", name: "Wash & Fold (Standard)", category: "Wash & Fold", unit: "kg", price: 150 },
  { id: "s2", name: "Wash & Fold (Heavy/Bedding)", category: "Wash & Fold", unit: "kg", price: 250 },
  { id: "s3", name: "Executive Suit (Dry Clean)", category: "Dry Cleaning", unit: "item", price: 1200 },
  { id: "s4", name: "Dress Shirt (Dry Clean & Press)", category: "Dry Cleaning", unit: "item", price: 350 },
  { id: "s5", name: "Winter Coat / Jacket", category: "Dry Cleaning", unit: "item", price: 1500 },
  { id: "s6", name: "Bed Duvet / Comforter", category: "Special Care", unit: "item", price: 1800 },
  { id: "s7", name: "Ironing Only", category: "Ironing", unit: "item", price: 100 }
];

const initialOrders: Order[] = [
  {
    id: "ord-101",
    orderNumber: "ORD-101",
    customerId: "c1",
    customerName: "Wanjiku Mwangi",
    customerPhone: "+254 712 345678",
    customerAddress: "Muthangari Rd, Lavington, Nairobi",
    status: "Out for Delivery",
    pickupDate: "2026-08-09",
    pickupTimeWindow: "08:00 AM - 10:00 AM",
    deliveryDate: "2026-08-10",
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
    createdAt: "2026-08-09T07:30:00Z",
    updatedAt: "2026-08-10T14:00:00Z"
  },
  {
    id: "ord-102",
    orderNumber: "ORD-102",
    customerId: "c2",
    customerName: "Dr. Kiprono Koech",
    customerPhone: "+254 722 987654",
    customerAddress: "Westlands Office Park, Block B",
    status: "In Process",
    pickupDate: "2026-08-10",
    pickupTimeWindow: "10:00 AM - 12:00 PM",
    deliveryDate: "2026-08-11",
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
    createdAt: "2026-08-10T08:15:00Z",
    updatedAt: "2026-08-10T11:00:00Z"
  },
  {
    id: "ord-103",
    orderNumber: "ORD-103",
    customerId: "c3",
    customerName: "Amina Otieno",
    customerPhone: "+254 733 456789",
    customerAddress: "Nyali Estate, Links Rd, Mombasa",
    status: "Pickup Scheduled",
    pickupDate: "2026-08-10",
    pickupTimeWindow: "03:00 PM - 05:00 PM",
    deliveryDate: "2026-08-12",
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
    createdAt: "2026-08-10T09:45:00Z",
    updatedAt: "2026-08-10T09:45:00Z"
  }
];

const initialPayments: Payment[] = [
  {
    id: "pay-1",
    orderId: "ord-101",
    orderNumber: "ORD-101",
    customerName: "Wanjiku Mwangi",
    amount: 2025,
    method: "Mobile Money",
    reference: "MPESA-QHJ7829",
    date: "2026-08-10T14:05:00Z",
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
    date: "2026-08-10T10:00:00Z",
    notes: "Advance M-Pesa deposit"
  }
];

// Helper to get collection and seed if empty
async function getCollection<T>(name: string, seed: T[]): Promise<T[]> {
  if (!firestore) return seed;
  try {
    const snap = await firestore.collection(name).get();
    if (snap.empty) {
      const batch = firestore.batch();
      for (const item of seed as any[]) {
        const ref = firestore.collection(name).doc(item.id);
        batch.set(ref, item);
      }
      await batch.commit();
      return seed;
    }
    return snap.docs.map(doc => doc.data() as T);
  } catch (e) {
    console.error(`Error fetching ${name} from Firestore:`, e);
    return seed;
  }
}

// Seed endpoint / reset
app.post("/api/seed", async (req, res) => {
  try {
    const batch = firestore.batch();
    
    // Clear and re-seed
    for (const c of initialCustomers) batch.set(firestore.collection("customers").doc(c.id), c);
    for (const d of initialDrivers) batch.set(firestore.collection("drivers").doc(d.id), d);
    for (const s of initialServices) batch.set(firestore.collection("services").doc(s.id), s);
    for (const o of initialOrders) batch.set(firestore.collection("orders").doc(o.id), o);
    for (const p of initialPayments) batch.set(firestore.collection("payments").doc(p.id), p);
    
    await batch.commit();
    res.json({ success: true, message: "Database re-seeded successfully in Firestore" });
  } catch (e) {
    console.error("Seed error:", e);
    res.status(500).json({ error: "Failed to reset seed data" });
  }
});

// 1. Stats & Dashboard
app.get("/api/stats", async (req, res) => {
  try {
    const orders = await getCollection<Order>("orders", initialOrders);
    const payments = await getCollection<Payment>("payments", initialPayments);
    
    const todayStr = new Date().toISOString().split("T")[0];
    const todayPickups = orders.filter(o => o.pickupDate === todayStr);
    const todayDeliveries = orders.filter(o => o.deliveryDate === todayStr);
    const inProgress = orders.filter(o => ["Pickup Scheduled", "Picked Up", "In Process", "Ready for Delivery", "Out for Delivery"].includes(o.status));
    const unpaidOrders = orders.filter(o => o.paymentStatus !== "Paid");
    const totalOutstanding = unpaidOrders.reduce((acc, o) => acc + o.balanceDue, 0);
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    res.json({
      todayPickupsCount: todayPickups.length,
      todayDeliveriesCount: todayDeliveries.length,
      inProgressCount: inProgress.length,
      totalOutstanding,
      totalRevenue,
      todayPickups,
      todayDeliveries,
      recentOrders
    });
  } catch (e) {
    console.error("Stats error:", e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 2. Customers
app.get("/api/customers", async (req, res) => {
  const customers = await getCollection<Customer>("customers", initialCustomers);
  res.json(customers);
});

app.post("/api/customers", async (req, res) => {
  const { name, phone, address, notes } = req.body;
  if (!name || !phone || !address) {
    return res.status(400).json({ error: "Name, phone, and address are required" });
  }
  const newCustomer: Customer = {
    id: "c_" + Date.now(),
    name,
    phone,
    address,
    notes: notes || "",
    createdAt: new Date().toISOString()
  };
  await firestore.collection("customers").doc(newCustomer.id).set(newCustomer);
  res.status(201).json(newCustomer);
});

// 0. Auth
app.post("/api/auth/login", async (req, res) => {
  const { role, username, password, isGoogle } = req.body;
  if (role === 'admin') {
    if (isGoogle || (username === 'admin' && password === 'admin123') || (username && username.includes('@'))) {
      return res.json({ role: 'admin', username: username || 'admin', name: 'Administrator' });
    }
    return res.status(401).json({ error: "Invalid admin credentials. Use admin / admin123 or Sign in with Google." });
  } else if (role === 'driver') {
    const drivers = await getCollection<Driver>("drivers", initialDrivers);
    const driver = drivers.find(d => 
      (d.username?.toLowerCase() === username?.toLowerCase() || d.name.toLowerCase().includes(username?.toLowerCase() || '')) &&
      (d.password === password || password === 'rider123')
    );
    if (driver) {
      return res.json({ role: 'driver', driverId: driver.id, name: driver.name, username: driver.username || driver.name });
    }
    return res.status(401).json({ error: "Invalid rider username or password. (Default password: rider123)" });
  }
  return res.status(400).json({ error: "Invalid login role" });
});

// 3. Drivers
app.get("/api/drivers", async (req, res) => {
  const drivers = await getCollection<Driver>("drivers", initialDrivers);
  res.json(drivers);
});

app.post("/api/drivers", async (req, res) => {
  const { name, phone, vehicle, status, username, password } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }
  const uname = username || name.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 90 + 10);
  const pwd = password || 'rider123';
  const newDriver: Driver = {
    id: "d_" + Date.now(),
    name,
    phone,
    vehicle: vehicle || "Delivery Motorcycle",
    status: status || "Available",
    username: uname,
    password: pwd
  };
  await firestore.collection("drivers").doc(newDriver.id).set(newDriver);
  res.status(201).json(newDriver);
});

app.delete("/api/drivers/:id", async (req, res) => {
  const { id } = req.params;
  const docRef = firestore.collection("drivers").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return res.status(404).json({ error: "Rider not found" });
  }
  await docRef.delete();
  res.json({ success: true });
});

// 4. Services Catalog
app.get("/api/services", async (req, res) => {
  const services = await getCollection<ServiceItem>("services", initialServices);
  res.json(services);
});

app.post("/api/services", async (req, res) => {
  const { name, category, unit, price } = req.body;
  if (!name || !category || !unit || price === undefined) {
    return res.status(400).json({ error: "All service fields are required" });
  }
  const newService: ServiceItem = {
    id: "s_" + Date.now(),
    name,
    category,
    unit,
    price: Number(price)
  };
  await firestore.collection("services").doc(newService.id).set(newService);
  res.status(201).json(newService);
});

// 5. Orders
app.get("/api/orders", async (req, res) => {
  const { status, driverId, date } = req.query;
  let orders = await getCollection<Order>("orders", initialOrders);
  if (status && status !== "All") {
    orders = orders.filter(o => o.status === status);
  }
  if (driverId && driverId !== "All") {
    orders = orders.filter(o => o.driverId === driverId);
  }
  if (date) {
    orders = orders.filter(o => o.pickupDate === date || o.deliveryDate === date);
  }
  res.json(orders);
});

app.get("/api/orders/:id", async (req, res) => {
  const doc = await firestore.collection("orders").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Order not found" });
  res.json(doc.data());
});

app.post("/api/orders", async (req, res) => {
  const {
    customerId,
    pickupDate,
    pickupTimeWindow,
    deliveryDate,
    deliveryTimeWindow,
    driverId,
    items,
    discount = 0,
    notes
  } = req.body;

  const customers = await getCollection<Customer>("customers", initialCustomers);
  const customer = customers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(400).json({ error: "Customer not found" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must contain at least one service item" });
  }

  const services = await getCollection<ServiceItem>("services", initialServices);
  let subtotal = 0;
  const processedItems: OrderItem[] = items.map((item: any) => {
    const sItem = services.find(s => s.id === item.serviceId);
    const unitPrice = sItem ? sItem.price : (item.unitPrice || 0);
    const itemSubtotal = unitPrice * Number(item.quantity);
    subtotal += itemSubtotal;
    return {
      serviceId: item.serviceId,
      serviceName: sItem ? sItem.name : item.serviceName,
      unit: sItem ? sItem.unit : (item.unit || 'item'),
      quantity: Number(item.quantity),
      unitPrice,
      subtotal: itemSubtotal
    };
  });

  const total = Math.max(0, subtotal - Number(discount));
  const orderNum = "ORD-" + Math.floor(100 + Math.random() * 900);

  let driverName = "";
  if (driverId) {
    const drivers = await getCollection<Driver>("drivers", initialDrivers);
    const d = drivers.find(dr => dr.id === driverId);
    if (d) driverName = d.name;
  }

  const newOrder: Order = {
    id: "ord_" + Date.now(),
    orderNumber: orderNum,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    status: "New",
    pickupDate: pickupDate || new Date().toISOString().split("T")[0],
    pickupTimeWindow: pickupTimeWindow || "09:00 AM - 11:00 AM",
    deliveryDate: deliveryDate || new Date().toISOString().split("T")[0],
    deliveryTimeWindow: deliveryTimeWindow || "02:00 PM - 04:00 PM",
    driverId: driverId || undefined,
    driverName: driverName || undefined,
    items: processedItems,
    subtotal,
    discount: Number(discount),
    total,
    paymentStatus: "Unpaid",
    amountPaid: 0,
    balanceDue: total,
    notes: notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await firestore.collection("orders").doc(newOrder.id).set(newOrder);
  res.status(201).json(newOrder);
});

app.patch("/api/orders/:id/status", async (req, res) => {
  const { status, proofOfDelivery, driverId } = req.body;
  const docRef = firestore.collection("orders").doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: "Order not found" });

  const order = doc.data() as Order;
  if (status) order.status = status;
  if (proofOfDelivery !== undefined) order.proofOfDelivery = proofOfDelivery;
  if (driverId !== undefined) {
    order.driverId = driverId || undefined;
    if (driverId) {
      const drivers = await getCollection<Driver>("drivers", initialDrivers);
      const d = drivers.find(dr => dr.id === driverId);
      order.driverName = d ? d.name : undefined;
    } else {
      order.driverName = undefined;
    }
  }
  order.updatedAt = new Date().toISOString();

  await docRef.set(order);
  res.json(order);
});

// 6. Payments
app.get("/api/payments", async (req, res) => {
  const payments = await getCollection<Payment>("payments", initialPayments);
  res.json(payments);
});

app.post("/api/payments", async (req, res) => {
  const { orderId, amount, method, reference, notes } = req.body;
  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" });

  const order = orderDoc.data() as Order;
  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ error: "Invalid payment amount" });
  }

  const newPayment: Payment = {
    id: "pay_" + Date.now(),
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    amount: payAmount,
    method: method || "Cash",
    reference: reference || "",
    date: new Date().toISOString(),
    notes: notes || ""
  };

  await firestore.collection("payments").doc(newPayment.id).set(newPayment);

  order.amountPaid += payAmount;
  order.balanceDue = Math.max(0, order.total - order.amountPaid);
  if (order.balanceDue === 0) {
    order.paymentStatus = "Paid";
  } else if (order.amountPaid > 0) {
    order.paymentStatus = "Partial";
  } else {
    order.paymentStatus = "Unpaid";
  }
  order.updatedAt = new Date().toISOString();

  await orderRef.set(order);
  res.status(201).json({ payment: newPayment, order });
});

// 7. Reports & Analytics
app.get("/api/reports", async (req, res) => {
  const orders = await getCollection<Order>("orders", initialOrders);
  const payments = await getCollection<Payment>("payments", initialPayments);

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "Completed" || o.status === "Delivered").length;
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = orders.reduce((sum, o) => sum + o.balanceDue, 0);

  const revenueByMethod: Record<string, number> = {};
  payments.forEach(p => {
    revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount;
  });

  res.json({
    totalOrders,
    completedOrders,
    totalRevenue,
    totalOutstanding,
    revenueByMethod
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
