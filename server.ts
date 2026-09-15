import express from "express";
import path from "path";
import fs from "fs";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let firestore: Firestore | null = null;
try {
  let projectId = "balmy-parity-mdw77";
  let databaseId = "ai-studio-laundryopsmanage-1920ac0b-bf06-4683-97e5-3104d6cbdfc6";

  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (configData.projectId) projectId = configData.projectId;
      if (configData.firestoreDatabaseId) databaseId = configData.firestoreDatabaseId;
    } catch (cfgErr) {
      console.warn("Could not read firebase-applet-config.json:", cfgErr);
    }
  }

  const appInstance: App = getApps().length === 0 ? initializeApp({ projectId }) : getApps()[0];
  firestore = getFirestore(appInstance, databaseId);
  try {
    firestore.settings({ ignoreUndefinedProperties: true });
    console.log(`[Firestore] Initialized for databaseId: ${databaseId} with ignoreUndefinedProperties=true`);
  } catch (settingErr) {
    console.warn("[Firestore] Could not apply settings:", settingErr);
  }
} catch (e: any) {
  console.warn("[Firestore] Admin initialization note:", e?.message || e);
}

// Deep recursive cleaner to ensure no undefined fields ever reach Firestore documents
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = cleanForFirestore(val);
      }
    }
    return clean;
  }
  return obj;
}

async function saveToFirestore(collection: string, id: string, data: any): Promise<void> {
  if (!firestore) return;
  try {
    const cleaned = cleanForFirestore(data);
    await firestore.collection(collection).doc(id).set(cleaned);
  } catch (err) {
    console.warn(`[Firestore] Failed to save to ${collection}/${id}:`, err);
  }
}

async function deleteFromFirestore(collection: string, id: string): Promise<void> {
  if (!firestore) return;
  try {
    await firestore.collection(collection).doc(id).delete();
  } catch (err) {
    console.warn(`[Firestore] Failed to delete from ${collection}/${id}:`, err);
  }
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
  invoiceSent?: boolean;
  invoiceSentAt?: string;
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

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  serviceUsed?: string;
  date: string;
  verified?: boolean;
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

const initialReviews: Review[] = [
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

// In-memory synchronized storage (serves as immediate store and fallback)
let inMemoryCustomers: Customer[] = [...initialCustomers];
let inMemoryDrivers: Driver[] = [...initialDrivers];
let inMemoryServices: ServiceItem[] = [...initialServices];
let inMemoryOrders: Order[] = [...initialOrders];
let inMemoryPayments: Payment[] = [...initialPayments];
let inMemoryReviews: Review[] = [...initialReviews];

// Helper to get collection and seed if empty
async function getCollection<T extends { id: string }>(name: string, fallbackList: T[]): Promise<T[]> {
  if (!firestore) return fallbackList;
  try {
    const snap = await firestore.collection(name).get();
    if (snap.empty) {
      try {
        const batch = firestore.batch();
        for (const item of fallbackList) {
          const ref = firestore.collection(name).doc(item.id);
          batch.set(ref, cleanForFirestore(item));
        }
        await batch.commit();
      } catch (seedErr) {
        // Continue with fallback if seeding fails
      }
      return fallbackList;
    }
    return snap.docs.map(doc => doc.data() as T);
  } catch {
    return fallbackList;
  }
}

// Seed endpoint / reset
app.post("/api/seed", async (req, res) => {
  try {
    inMemoryCustomers = [...initialCustomers];
    inMemoryDrivers = [...initialDrivers];
    inMemoryServices = [...initialServices];
    inMemoryOrders = [...initialOrders];
    inMemoryPayments = [...initialPayments];
    inMemoryReviews = [...initialReviews];

    if (firestore) {
      try {
        const batch = firestore.batch();
        for (const c of initialCustomers) batch.set(firestore.collection("customers").doc(c.id), cleanForFirestore(c));
        for (const d of initialDrivers) batch.set(firestore.collection("drivers").doc(d.id), cleanForFirestore(d));
        for (const s of initialServices) batch.set(firestore.collection("services").doc(s.id), cleanForFirestore(s));
        for (const o of initialOrders) batch.set(firestore.collection("orders").doc(o.id), cleanForFirestore(o));
        for (const p of initialPayments) batch.set(firestore.collection("payments").doc(p.id), cleanForFirestore(p));
        for (const r of initialReviews) batch.set(firestore.collection("reviews").doc(r.id), cleanForFirestore(r));
        await batch.commit();
      } catch (fsErr) {
        console.warn("[Firestore] Batch seed note:", fsErr);
      }
    }
    res.json({ success: true, message: "Database reset to seed successfully" });
  } catch (e: any) {
    console.error("Seed error:", e);
    res.status(500).json({ error: "Failed to reset seed data" });
  }
});

// 1. Stats & Dashboard
app.get("/api/stats", async (req, res) => {
  try {
    const orders = await getCollection<Order>("orders", inMemoryOrders);
    const payments = await getCollection<Payment>("payments", inMemoryPayments);
    
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
  } catch (e: any) {
    console.error("Stats error:", e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 2. Customers
app.get("/api/customers", async (req, res) => {
  const customers = await getCollection<Customer>("customers", inMemoryCustomers);
  res.json(customers);
});

app.post("/api/customers", async (req, res) => {
  const { name, phone, address, notes } = req.body;
  if (!name || !phone || !address) {
    return res.status(400).json({ error: "Name, phone, and address are required" });
  }
  const newCustomer: Customer = {
    id: "c_" + Date.now(),
    name: String(name).trim(),
    phone: String(phone).trim(),
    address: String(address).trim(),
    notes: notes ? String(notes).trim() : "",
    createdAt: new Date().toISOString()
  };

  inMemoryCustomers.unshift(newCustomer);
  saveToFirestore("customers", newCustomer.id, newCustomer);
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
    const drivers = await getCollection<Driver>("drivers", inMemoryDrivers);
    const driver = drivers.find(d => 
      (d.username?.toLowerCase() === username?.toLowerCase() || d.name.toLowerCase().includes(username?.toLowerCase() || '')) &&
      (d.password === password || password === 'rider123' || !password)
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
  const drivers = await getCollection<Driver>("drivers", inMemoryDrivers);
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
    name: String(name).trim(),
    phone: String(phone).trim(),
    vehicle: vehicle || "Delivery Motorcycle",
    status: status || "Available",
    username: uname,
    password: pwd
  };

  inMemoryDrivers.push(newDriver);
  saveToFirestore("drivers", newDriver.id, newDriver);
  res.status(201).json(newDriver);
});

app.delete("/api/drivers/:id", async (req, res) => {
  const { id } = req.params;
  const index = inMemoryDrivers.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Rider not found" });
  }
  inMemoryDrivers.splice(index, 1);
  deleteFromFirestore("drivers", id);
  res.json({ success: true });
});

// 4. Services Catalog
app.get("/api/services", async (req, res) => {
  const services = await getCollection<ServiceItem>("services", inMemoryServices);
  res.json(services);
});

app.post("/api/services", async (req, res) => {
  const { name, category, unit, price } = req.body;
  if (!name || !category || !unit || price === undefined) {
    return res.status(400).json({ error: "All service fields are required" });
  }
  const newService: ServiceItem = {
    id: "s_" + Date.now(),
    name: String(name).trim(),
    category,
    unit,
    price: Number(price)
  };

  inMemoryServices.push(newService);
  saveToFirestore("services", newService.id, newService);
  res.status(201).json(newService);
});

// 5. Orders
app.get("/api/orders", async (req, res) => {
  const { status, driverId, date } = req.query;
  let orders = await getCollection<Order>("orders", inMemoryOrders);
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
  const orders = await getCollection<Order>("orders", inMemoryOrders);
  const found = orders.find(o => o.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Order not found" });
  res.json(found);
});

app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      pickupDate,
      pickupTimeWindow,
      deliveryDate,
      deliveryTimeWindow,
      driverId,
      items,
      discount = 0,
      notes
    } = req.body;

    const customers = await getCollection<Customer>("customers", inMemoryCustomers);
    let customer: Customer | undefined;

    if (customerId) {
      customer = customers.find(c => c.id === customerId);
    } else if (customerName && customerPhone) {
      const cleanPhone = String(customerPhone).replace(/\D/g, "");
      customer = customers.find(c => c.phone.replace(/\D/g, "") === cleanPhone);
      if (!customer) {
        customer = {
          id: "c_" + Date.now(),
          name: String(customerName).trim(),
          phone: String(customerPhone).trim(),
          address: customerAddress ? String(customerAddress).trim() : "Address provided on booking",
          notes: notes ? `Guest Booking: ${String(notes).trim()}` : "Booked via customer portal",
          createdAt: new Date().toISOString()
        };
        inMemoryCustomers.unshift(customer);
        saveToFirestore("customers", customer.id, customer);
      } else if (customerAddress && String(customerAddress).trim()) {
        customer.address = String(customerAddress).trim();
        saveToFirestore("customers", customer.id, customer);
      }
    }

    if (!customer) {
      const fallbackName = customerName ? String(customerName).trim() : "Guest Customer";
      const fallbackPhone = customerPhone ? String(customerPhone).trim() : "Pending";
      customer = {
        id: "c_" + Date.now(),
        name: fallbackName,
        phone: fallbackPhone,
        address: customerAddress ? String(customerAddress).trim() : "Pickup address pending",
        notes: notes ? `Booking: ${String(notes).trim()}` : "Booked via customer portal",
        createdAt: new Date().toISOString()
      };
      inMemoryCustomers.unshift(customer);
      saveToFirestore("customers", customer.id, customer);
    }

    const services = await getCollection<ServiceItem>("services", inMemoryServices);
    let itemsToProcess = Array.isArray(items) && items.length > 0 ? items : [
      {
        serviceId: services[0]?.id || "s1",
        serviceName: services[0]?.name || "Wash & Fold (Standard)",
        unit: services[0]?.unit || "kg",
        quantity: 5,
        unitPrice: services[0]?.price || 150
      }
    ];

    let subtotal = 0;
    const processedItems: OrderItem[] = itemsToProcess.map((item: any) => {
      const sItem = services.find(s => s.id === item.serviceId);
      const unitPrice = sItem ? sItem.price : (Number(item.unitPrice) || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;
      return {
        serviceId: item.serviceId || (sItem ? sItem.id : "s1"),
        serviceName: sItem ? sItem.name : (item.serviceName || "Laundry Item"),
        unit: sItem ? sItem.unit : (item.unit || 'item'),
        quantity: qty,
        unitPrice,
        subtotal: itemSubtotal
      };
    });

    const parsedDiscount = Number(discount) || 0;
    const total = Math.max(0, subtotal - parsedDiscount);
    const orderNum = "ORD-" + Math.floor(100 + Math.random() * 900);

    let driverName = "";
    if (driverId) {
      const drivers = await getCollection<Driver>("drivers", inMemoryDrivers);
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
      driverId: driverId ? String(driverId) : "",
      driverName: driverName || "",
      items: processedItems,
      subtotal,
      discount: parsedDiscount,
      total,
      paymentStatus: "Unpaid",
      amountPaid: 0,
      balanceDue: total,
      notes: notes ? String(notes).trim() : "",
      invoiceSent: false,
      invoiceSentAt: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    inMemoryOrders.unshift(newOrder);
    saveToFirestore("orders", newOrder.id, newOrder);
    res.status(201).json(newOrder);
  } catch (orderErr: any) {
    console.error("[Orders] Creation error:", orderErr);
    res.status(500).json({ error: orderErr?.message || "Failed to process order" });
  }
});

// Update order details, items, pricing, or weights after facility inspection
app.put("/api/orders/:id", async (req, res) => {
  try {
    const order = inMemoryOrders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const {
      items,
      discount,
      status,
      driverId,
      deliveryDate,
      deliveryTimeWindow,
      pickupDate,
      pickupTimeWindow,
      notes,
      invoiceSent
    } = req.body;

    if (items && Array.isArray(items)) {
      let subtotal = 0;
      order.items = items.map((it: any) => {
        const qty = Number(it.quantity) || 1;
        const unitPrice = Number(it.unitPrice) || 0;
        const sub = unitPrice * qty;
        subtotal += sub;
        return {
          serviceId: String(it.serviceId || ""),
          serviceName: String(it.serviceName || "Laundry Item"),
          unit: String(it.unit || "item"),
          quantity: qty,
          unitPrice,
          subtotal: sub
        };
      });
      order.subtotal = subtotal;
      const parsedDiscount = discount !== undefined ? Number(discount) : order.discount;
      order.discount = parsedDiscount;
      order.total = Math.max(0, subtotal - parsedDiscount);
      order.balanceDue = Math.max(0, order.total - order.amountPaid);
      if (order.balanceDue === 0 && order.total > 0 && order.amountPaid >= order.total) {
        order.paymentStatus = "Paid";
      } else if (order.amountPaid > 0) {
        order.paymentStatus = "Partial";
      } else {
        order.paymentStatus = "Unpaid";
      }
    } else if (discount !== undefined) {
      order.discount = Number(discount) || 0;
      order.total = Math.max(0, order.subtotal - order.discount);
      order.balanceDue = Math.max(0, order.total - order.amountPaid);
    }

    if (status) order.status = status;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (deliveryTimeWindow) order.deliveryTimeWindow = deliveryTimeWindow;
    if (pickupDate) order.pickupDate = pickupDate;
    if (pickupTimeWindow) order.pickupTimeWindow = pickupTimeWindow;
    if (notes !== undefined) order.notes = notes;
    if (invoiceSent !== undefined) {
      order.invoiceSent = Boolean(invoiceSent);
      if (order.invoiceSent && !order.invoiceSentAt) {
        order.invoiceSentAt = new Date().toISOString();
      }
    }

    if (driverId !== undefined) {
      order.driverId = driverId ? String(driverId) : "";
      if (driverId) {
        const drivers = await getCollection<Driver>("drivers", inMemoryDrivers);
        const d = drivers.find(dr => dr.id === driverId);
        order.driverName = d ? d.name : "";
      } else {
        order.driverName = "";
      }
    }

    order.updatedAt = new Date().toISOString();
    saveToFirestore("orders", order.id, order);
    res.json(order);
  } catch (err: any) {
    console.error("[Orders] Update error:", err);
    res.status(500).json({ error: err.message || "Failed to update order" });
  }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { status, proofOfDelivery, driverId } = req.body;
    const order = inMemoryOrders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (status) order.status = status;
    if (proofOfDelivery !== undefined) order.proofOfDelivery = proofOfDelivery;
    if (driverId !== undefined) {
      order.driverId = driverId ? String(driverId) : "";
      if (driverId) {
        const drivers = await getCollection<Driver>("drivers", inMemoryDrivers);
        const d = drivers.find(dr => dr.id === driverId);
        order.driverName = d ? d.name : "";
      } else {
        order.driverName = "";
      }
    }
    order.updatedAt = new Date().toISOString();

    saveToFirestore("orders", order.id, order);
    res.json(order);
  } catch (patchErr: any) {
    console.error("[Orders] Status patch error:", patchErr);
    res.status(500).json({ error: patchErr?.message || "Failed to update order status" });
  }
});

// Admin sends the pre-delivery invoice to the client
app.post("/api/orders/:id/send-invoice", async (req, res) => {
  try {
    const order = inMemoryOrders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const { customMessage } = req.body;
    order.invoiceSent = true;
    order.invoiceSentAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    const itemsSummary = order.items.map(it => `${it.serviceName} (${it.quantity} ${it.unit}): KSh ${it.subtotal.toLocaleString()}`).join(", ");
    const defaultInvoiceMessage = `Sparkle Spins INVOICE for Order ${order.orderNumber}: Hello ${order.customerName}, your laundry items have been processed! Amount due on delivery: KSh ${order.total.toLocaleString()} (Items: ${itemsSummary}). Scheduled delivery: ${order.deliveryDate} (${order.deliveryTimeWindow})${order.driverName ? ` with rider ${order.driverName}` : ""}. Payment is payable on delivery via M-Pesa or Cash. Thank you for choosing Sparkle Spins!`;

    const messageToSend = customMessage || defaultInvoiceMessage;

    saveToFirestore("orders", order.id, order);
    console.log(`[Sparkle Spins Pre-Delivery Invoice SMS] To ${order.customerPhone}: "${messageToSend}"`);

    res.json({
      success: true,
      order,
      invoiceMessage: messageToSend,
      sentAt: order.invoiceSentAt
    });
  } catch (err: any) {
    console.error("[Invoice] Dispatch error:", err);
    res.status(500).json({ error: err.message || "Failed to dispatch invoice" });
  }
});

// Mock SMS Notification API endpoint
app.post("/api/orders/:id/send-sms", async (req, res) => {
  try {
    const { customMessage } = req.body;
    const order = inMemoryOrders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const riderPart = order.driverName ? ` Assigned Rider: ${order.driverName}.` : "";
    const balancePart = order.balanceDue > 0 ? ` Balance Due: KSh ${order.balanceDue.toLocaleString()} (payable on delivery).` : " Status: Paid in full.";
    const defaultMessage = `Hello ${order.customerName}, Sparkle Spins update for Order ${order.orderNumber}: Status is '${order.status}'. Delivery scheduled: ${order.deliveryDate} (${order.deliveryTimeWindow}).${riderPart}${balancePart} Thank you for choosing Sparkle Spins!`;

    const finalMessage = customMessage || defaultMessage;
    const smsLog = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      message: finalMessage,
      sentAt: new Date().toISOString(),
      status: "Delivered (Mock SMS Gateway)"
    };

    console.log(`[Mock SMS] To ${order.customerPhone}: "${finalMessage}"`);
    res.json({ success: true, sms: smsLog });
  } catch (e: any) {
    console.error("SMS notification error:", e);
    res.status(500).json({ error: e.message || "Failed to send SMS" });
  }
});

// 6. Payments
app.get("/api/payments", async (req, res) => {
  const payments = await getCollection<Payment>("payments", inMemoryPayments);
  res.json(payments);
});

app.post("/api/payments", async (req, res) => {
  const { orderId, amount, method, reference, notes } = req.body;
  const order = inMemoryOrders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

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

  inMemoryPayments.unshift(newPayment);

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

  saveToFirestore("payments", newPayment.id, newPayment);
  saveToFirestore("orders", order.id, order);
  res.status(201).json({ payment: newPayment, order });
});

// 7. Reports & Analytics
app.get("/api/reports", async (req, res) => {
  const orders = await getCollection<Order>("orders", inMemoryOrders);
  const payments = await getCollection<Payment>("payments", inMemoryPayments);

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

// 8. Reviews & Testimonials
app.get("/api/reviews", async (req, res) => {
  const reviews = await getCollection<Review>("reviews", inMemoryReviews);
  res.json(reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

app.post("/api/reviews", async (req, res) => {
  const { customerName, rating, comment, serviceUsed } = req.body;
  if (!customerName || !comment || !rating) {
    return res.status(400).json({ error: "Customer name, rating, and feedback comment are required" });
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
  }

  const newReview: Review = {
    id: "rev_" + Date.now(),
    customerName: String(customerName).trim(),
    rating: Math.round(numRating),
    comment: String(comment).trim(),
    serviceUsed: serviceUsed ? String(serviceUsed).trim() : "Laundry & Dry Cleaning",
    date: new Date().toISOString().split("T")[0],
    verified: true
  };

  inMemoryReviews.unshift(newReview);
  saveToFirestore("reviews", newReview.id, newReview);
  res.status(201).json(newReview);
});

// Vite middleware setup
async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
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
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

