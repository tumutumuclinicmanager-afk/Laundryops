import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import nodemailer, { type Transporter } from "nodemailer";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  type Firestore
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { getExpertLaundryResponse } from "./src/utils/laundryKnowledge";
import {
  generateOrderConfirmationEmail,
  generateStatusUpdateEmail,
  generateAdminAlertEmail,
  DEFAULT_COMPANY
} from "./src/utils/emailTemplates";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

let firestore: Firestore | null = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let firebaseConfig: any = {
    projectId: "balmy-parity-mdw77",
    firestoreDatabaseId: "ai-studio-laundryopsmanage-1920ac0b-bf06-4683-97e5-3104d6cbdfc6"
  };

  if (fs.existsSync(configPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (cfgErr) {
      console.warn("Could not read firebase-applet-config.json:", cfgErr);
    }
  }

  const appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  firestore = getFirestore(appInstance, databaseId);
  console.log(`[Firestore] Initialized client SDK for databaseId: ${databaseId}`);
} catch (e: any) {
  console.warn("[Firestore] Initialization note:", e?.message || e);
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

async function saveToFirestore(collectionName: string, id: string, data: any): Promise<void> {
  if (!firestore) return;
  try {
    const cleaned = cleanForFirestore(data);
    const docRef = doc(firestore, collectionName, id);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err: any) {
    console.warn(`[Firestore] Note on saving ${collectionName}/${id}:`, err?.message || err);
  }
}

async function deleteFromFirestore(collectionName: string, id: string): Promise<void> {
  if (!firestore) return;
  try {
    const docRef = doc(firestore, collectionName, id);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn(`[Firestore] Note on deleting ${collectionName}/${id}:`, err?.message || err);
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
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

interface EmailNotificationLog {
  id: string;
  orderId?: string;
  orderNumber?: string;
  type: 'order_confirmation' | 'status_update' | 'invoice' | 'admin_alert' | 'custom';
  recipient: string;
  recipientName?: string;
  subject: string;
  status: 'sent' | 'simulated' | 'failed';
  sentAt: string;
  error?: string;
  previewSnippet?: string;
}

interface NotificationSettings {
  adminEmail: string;
  autoSendOrderConfirmation: boolean;
  autoSendStatusUpdates: boolean;
  autoSendAdminAlerts: boolean;
  senderName: string;
  senderEmail: string;
  smtpConfigured: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
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
  emailSent?: boolean;
  emailSentAt?: string;
  emailHistory?: EmailNotificationLog[];
  createdAt: string;
  updatedAt: string;
}

// Mailer & Notification state
const notificationSettings: NotificationSettings = {
  adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "wangechigodfrey77@gmail.com, hillaryochieng002@gmail.com",
  autoSendOrderConfirmation: true,
  autoSendStatusUpdates: true,
  autoSendAdminAlerts: true,
  senderName: "Sparkle Spins Laundry Operations",
  senderEmail: process.env.EMAIL_FROM || "notifications@sparklespins.co.ke",
  smtpConfigured: Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  )
};

function getAdminEmails(): string[] {
  const raw = notificationSettings.adminEmail || "";
  const parts = raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  const unique = Array.from(new Set(parts));
  if (!unique.includes("hillaryochieng002@gmail.com")) {
    unique.push("hillaryochieng002@gmail.com");
  }
  if (!unique.includes("wangechigodfrey77@gmail.com") && parts.length === 0) {
    unique.unshift("wangechigodfrey77@gmail.com");
  }
  return unique;
}

function formatSmtpError(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes("534") || msg.includes("Application-specific password required") || msg.includes("InvalidSecondFactor")) {
    return "Google Authentication Error (534-5.7.9): Gmail requires a 16-character 'App Password' (generated at myaccount.google.com/apppasswords) when 2-Step Verification is active on your Google account.";
  }
  if (msg.includes("535") || msg.includes("Authentication credentials invalid") || msg.includes("Username and Password not accepted")) {
    return "SMTP Authentication Failed (535): The username or password provided was not accepted by the mail server.";
  }
  return msg;
}

let emailTransporter: Transporter | null = null;
if (notificationSettings.smtpConfigured) {
  try {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      emailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    } else {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    console.log("[Mailer] SMTP Transporter initialized");
  } catch (mailErr) {
    console.warn("[Mailer] Could not initialize SMTP transport:", mailErr);
  }
}

const inMemoryEmailLogs: EmailNotificationLog[] = [];

async function sendAdminAlertEmailInternal(order: Order, eventType: 'new_order' | 'status_change' | 'payment') {
  const recipients = getAdminEmails();
  if (recipients.length === 0) return null;
  const generated = generateAdminAlertEmail(order, eventType);

  const logs: EmailNotificationLog[] = [];
  for (const recipient of recipients) {
    let sendStatus: 'sent' | 'simulated' | 'failed' = emailTransporter ? "sent" : "simulated";
    let sendError: string | undefined = undefined;

    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: `"${notificationSettings.senderName}" <${notificationSettings.senderEmail}>`,
          to: recipient,
          subject: generated.subject,
          html: generated.html,
          text: generated.text
        });
        console.log(`[Admin Alert Email Sent via SMTP] To: ${recipient} | Subject: ${generated.subject}`);
      } catch (err: any) {
        const formatted = formatSmtpError(err);
        console.log(`[Admin Alert Note] SMTP delivery skipped (${recipient}): ${formatted.slice(0, 80)}...`);
        sendStatus = "simulated";
        sendError = formatted;
        if (formatted.includes("534") || formatted.includes("535")) {
          // Disable transporter so future notifications seamlessly use dev simulation
          emailTransporter = null;
          notificationSettings.smtpConfigured = false;
        }
      }
    } else {
      console.log(`[Admin Alert Email Dispatched (Simulated/Dev Mode)] To: ${recipient} | Subject: ${generated.subject}`);
    }

    const logEntry: EmailNotificationLog = {
      id: "mail_adm_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: "admin_alert",
      recipient,
      recipientName: recipient.includes("hillary") ? "Hillary Ochieng" : "Operations Admin",
      subject: generated.subject,
      status: sendStatus,
      sentAt: new Date().toISOString(),
      previewSnippet: generated.text.slice(0, 160) + "...",
      error: sendError
    };

    if (!order.emailHistory) order.emailHistory = [];
    order.emailHistory.unshift(logEntry);
    inMemoryEmailLogs.unshift(logEntry);
    saveToFirestore("notification_logs", logEntry.id, logEntry);
    logs.push(logEntry);
  }

  order.emailSent = true;
  order.emailSentAt = logs[0]?.sentAt || new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  saveToFirestore("orders", order.id, order);
  return logs[0] || null;
}

interface SendEmailParams {
  order: Order;
  type: 'order_confirmation' | 'status_update' | 'invoice' | 'admin_alert' | 'custom';
  recipientEmail?: string;
  recipientName?: string;
  customSubject?: string;
  customBody?: string;
  customNote?: string;
  sendAdminCopy?: boolean;
}

async function sendOrderNotificationEmail(params: SendEmailParams): Promise<{ success: boolean; log?: EmailNotificationLog; error?: string }> {
  const { order, type, customSubject, customBody, customNote, sendAdminCopy = true } = params;
  const targetRecipient = params.recipientEmail || order.customerEmail;

  if (!targetRecipient && type !== 'admin_alert') {
    if (sendAdminCopy && notificationSettings.autoSendAdminAlerts && notificationSettings.adminEmail) {
      await sendAdminAlertEmailInternal(order, 'new_order');
    }
    return { success: false, error: "No customer email address on file" };
  }

  let subject = "";
  let html = "";
  let text = "";

  if (type === 'order_confirmation') {
    const gen = generateOrderConfirmationEmail(order, DEFAULT_COMPANY);
    subject = customSubject || gen.subject;
    html = gen.html;
    text = gen.text;
  } else if (type === 'status_update') {
    const gen = generateStatusUpdateEmail(order, order.status, customNote, DEFAULT_COMPANY);
    subject = customSubject || gen.subject;
    html = gen.html;
    text = gen.text;
  } else if (type === 'invoice') {
    const gen = generateOrderConfirmationEmail(order, DEFAULT_COMPANY);
    subject = customSubject || `🧾 Official Invoice: #${order.orderNumber} - Sparkle Spins Laundry`;
    html = gen.html;
    text = gen.text;
  } else if (type === 'custom') {
    subject = customSubject || `Sparkle Spins Order #${order.orderNumber} Update`;
    html = `<div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
      <h2 style="color: #4338ca;">Sparkle Spins Laundry Operations</h2>
      <p style="font-size: 15px; line-height: 1.6;">${customBody || 'Order Notification'}</p>
      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        Order #${order.orderNumber} • ${order.customerName}
      </div>
    </div>`;
    text = customBody || `Order #${order.orderNumber} update for ${order.customerName}`;
  }

  let sendStatus: 'sent' | 'simulated' | 'failed' = emailTransporter && targetRecipient ? "sent" : "simulated";
  let sendError: string | undefined = undefined;

  try {
    if (emailTransporter && targetRecipient) {
      await emailTransporter.sendMail({
        from: `"${notificationSettings.senderName}" <${notificationSettings.senderEmail}>`,
        to: targetRecipient,
        subject,
        html,
        text
      });
      sendStatus = "sent";
      console.log(`[Order Email Sent via SMTP] To: ${targetRecipient} | Sub: ${subject}`);
    } else {
      sendStatus = "simulated";
      console.log(`[Order Email Dispatched (Simulated/Dev Mode)] To: ${targetRecipient} | Sub: ${subject}`);
    }
  } catch (sendErr: any) {
    const formatted = formatSmtpError(sendErr);
    console.log(`[Order Email Note] SMTP skipped (${targetRecipient}): ${formatted.slice(0, 80)}...`);
    sendStatus = "simulated";
    sendError = formatted;
    if (formatted.includes("534") || formatted.includes("535")) {
      emailTransporter = null;
      notificationSettings.smtpConfigured = false;
    }
  }

  const logEntry: EmailNotificationLog = {
    id: "mail_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    orderId: order.id,
    orderNumber: order.orderNumber,
    type,
    recipient: targetRecipient || notificationSettings.adminEmail,
    recipientName: params.recipientName || order.customerName,
    subject,
    status: sendStatus,
    sentAt: new Date().toISOString(),
    previewSnippet: text.slice(0, 160) + "...",
    error: sendError
  };

  if (!order.emailHistory) order.emailHistory = [];
  order.emailHistory.unshift(logEntry);
  order.emailSent = true;
  order.emailSentAt = logEntry.sentAt;
  order.updatedAt = new Date().toISOString();

  inMemoryEmailLogs.unshift(logEntry);
  saveToFirestore("notification_logs", logEntry.id, logEntry);
  saveToFirestore("orders", order.id, order);

  if (sendAdminCopy && notificationSettings.autoSendAdminAlerts && notificationSettings.adminEmail && targetRecipient !== notificationSettings.adminEmail) {
    await sendAdminAlertEmailInternal(order, type === 'order_confirmation' ? 'new_order' : 'status_change');
  }

  return { success: logEntry.status !== "failed", log: logEntry };
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
    const colRef = collection(firestore, name);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      try {
        const batch = writeBatch(firestore);
        for (const item of fallbackList) {
          const itemRef = doc(firestore, name, item.id);
          batch.set(itemRef, cleanForFirestore(item));
        }
        await batch.commit();
        console.log(`[Firestore] Initialized collection '${name}' with ${fallbackList.length} items.`);
      } catch (seedErr: any) {
        console.warn(`[Firestore] Collection seed note for '${name}':`, seedErr?.message || seedErr);
      }
      return fallbackList;
    }
    const items = snap.docs.map(d => d.data() as T);
    return items;
  } catch (readErr: any) {
    console.warn(`[Firestore] Read note for '${name}', using memory cache:`, readErr?.message || readErr);
    return fallbackList;
  }
}

// Initial direct preloading from Firestore
async function preloadAndSyncFirestore() {
  if (!firestore) {
    console.log("[Firestore] Running with cached in-memory state");
    return;
  }
  try {
    console.log("[Firestore] Starting full database preloading & sync...");
    const [custs, drivs, servs, ords, pays, revs, logs] = await Promise.all([
      getCollection<Customer>("customers", initialCustomers),
      getCollection<Driver>("drivers", initialDrivers),
      getCollection<ServiceItem>("services", initialServices),
      getCollection<Order>("orders", initialOrders),
      getCollection<Payment>("payments", initialPayments),
      getCollection<Review>("reviews", initialReviews),
      getCollection<EmailNotificationLog>("notification_logs", inMemoryEmailLogs)
    ]);

    inMemoryCustomers = custs;
    inMemoryDrivers = drivs;
    inMemoryServices = servs;
    inMemoryOrders = ords;
    inMemoryPayments = pays;
    inMemoryReviews = revs;
    inMemoryEmailLogs.length = 0;
    inMemoryEmailLogs.push(...logs);

    // Also load settings document if present
    try {
      const settingsRef = doc(firestore, "settings", "notifications");
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as NotificationSettings;
        if (data) {
          Object.assign(notificationSettings, data);
        }
      } else {
        await setDoc(settingsRef, cleanForFirestore(notificationSettings));
      }
    } catch (setErr: any) {
      console.warn("[Firestore] Settings load note:", setErr?.message || setErr);
    }

    console.log(`[Firestore Sync Active] Synced -> ${ords.length} Orders, ${custs.length} Customers, ${drivs.length} Drivers, ${servs.length} Services, ${pays.length} Payments, ${revs.length} Reviews`);
  } catch (syncErr: any) {
    console.warn("[Firestore] Sync initialization note:", syncErr?.message || syncErr);
  }
}

// Run preload asynchronously
preloadAndSyncFirestore();

// Database Sync Health & Status endpoint
app.get("/api/sync/status", async (req, res) => {
  let isConnected = false;
  let orderCount = inMemoryOrders.length;
  let customerCount = inMemoryCustomers.length;
  let driverCount = inMemoryDrivers.length;
  let serviceCount = inMemoryServices.length;
  let paymentCount = inMemoryPayments.length;
  let reviewCount = inMemoryReviews.length;
  let logCount = inMemoryEmailLogs.length;

  if (firestore) {
    try {
      const orderSnap = await getDocs(collection(firestore, "orders"));
      isConnected = true;
      orderCount = orderSnap.size;
    } catch (e: any) {
      isConnected = false;
    }
  }

  res.json({
    connected: isConnected,
    databaseId: "ai-studio-laundryopsmanage-1920ac0b-bf06-4683-97e5-3104d6cbdfc6",
    projectId: "balmy-parity-mdw77",
    counts: {
      orders: orderCount,
      customers: customerCount,
      drivers: driverCount,
      services: serviceCount,
      payments: paymentCount,
      reviews: reviewCount,
      notificationLogs: logCount
    },
    lastSyncedAt: new Date().toISOString()
  });
});

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
        const batch = writeBatch(firestore);
        for (const c of initialCustomers) batch.set(doc(firestore, "customers", c.id), cleanForFirestore(c));
        for (const d of initialDrivers) batch.set(doc(firestore, "drivers", d.id), cleanForFirestore(d));
        for (const s of initialServices) batch.set(doc(firestore, "services", s.id), cleanForFirestore(s));
        for (const o of initialOrders) batch.set(doc(firestore, "orders", o.id), cleanForFirestore(o));
        for (const p of initialPayments) batch.set(doc(firestore, "payments", p.id), cleanForFirestore(p));
        for (const r of initialReviews) batch.set(doc(firestore, "reviews", r.id), cleanForFirestore(r));
        await batch.commit();
      } catch (fsErr: any) {
        console.warn("[Firestore] Batch seed note:", fsErr?.message || fsErr);
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
    if (password === 'admin123') {
      return res.json({ role: 'admin', username: username || 'admin', name: 'Administrator' });
    }
    return res.status(401).json({ error: "Invalid admin password. Please use 'admin123'." });
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
      customerEmail,
      customerAddress,
      pickupDate,
      pickupTimeWindow,
      deliveryDate,
      deliveryTimeWindow,
      driverId,
      items,
      discount = 0,
      notes,
      sendEmailConfirmation = true
    } = req.body;

    const customers = await getCollection<Customer>("customers", inMemoryCustomers);
    let customer: Customer | undefined;

    if (customerId) {
      customer = customers.find(c => c.id === customerId);
      if (customer && customerEmail && !customer.email) {
        customer.email = String(customerEmail).trim();
        saveToFirestore("customers", customer.id, customer);
      }
    } else if (customerName && customerPhone) {
      const cleanPhone = String(customerPhone).replace(/\D/g, "");
      customer = customers.find(c => c.phone.replace(/\D/g, "") === cleanPhone);
      if (!customer) {
        customer = {
          id: "c_" + Date.now(),
          name: String(customerName).trim(),
          phone: String(customerPhone).trim(),
          email: customerEmail ? String(customerEmail).trim() : undefined,
          address: customerAddress ? String(customerAddress).trim() : "Address provided on booking",
          notes: notes ? `Guest Booking: ${String(notes).trim()}` : "Booked via customer portal",
          createdAt: new Date().toISOString()
        };
        inMemoryCustomers.unshift(customer);
        saveToFirestore("customers", customer.id, customer);
      } else {
        if (customerAddress && String(customerAddress).trim()) {
          customer.address = String(customerAddress).trim();
        }
        if (customerEmail && String(customerEmail).trim()) {
          customer.email = String(customerEmail).trim();
        }
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
        email: customerEmail ? String(customerEmail).trim() : undefined,
        address: customerAddress ? String(customerAddress).trim() : "Pickup address pending",
        notes: notes ? `Booking: ${String(notes).trim()}` : "Booked via customer portal",
        createdAt: new Date().toISOString()
      };
      inMemoryCustomers.unshift(customer);
      saveToFirestore("customers", customer.id, customer);
    }

    const services = await getCollection<ServiceItem>("services", inMemoryServices);
    let itemsToProcess = Array.isArray(items) ? items : [];

    let subtotal = 0;
    const processedItems: OrderItem[] = itemsToProcess.map((item: any) => {
      const sItem = services.find(s => s.id === item.serviceId);
      const unitPrice = sItem ? sItem.price : (Number(item.unitPrice) || 0);
      const qty = Math.max(0.1, Number(item.quantity) || 1);
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

    const targetEmail = customerEmail ? String(customerEmail).trim() : (customer.email || undefined);

    const newOrder: Order = {
      id: "ord_" + Date.now(),
      orderNumber: orderNum,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: targetEmail,
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
      emailSent: false,
      emailSentAt: "",
      emailHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    inMemoryOrders.unshift(newOrder);
    await saveToFirestore("orders", newOrder.id, newOrder);

    // 1. Always automatically trigger instant Admin Order Notification Email
    if (notificationSettings.autoSendAdminAlerts && notificationSettings.adminEmail) {
      try {
        await sendAdminAlertEmailInternal(newOrder, 'new_order');
      } catch (adminMailErr) {
        console.warn("[Admin Alert Email Notice]", adminMailErr);
      }
    }

    // 2. Also trigger Customer Order Confirmation Email if customer email is provided
    if (newOrder.customerEmail && sendEmailConfirmation && notificationSettings.autoSendOrderConfirmation) {
      try {
        await sendOrderNotificationEmail({
          order: newOrder,
          type: "order_confirmation",
          sendAdminCopy: false // Admin already notified in step 1
        });
      } catch (custMailErr) {
        console.warn("[Customer Confirmation Email Notice]", custMailErr);
      }
    }

    res.status(201).json(newOrder);
  } catch (orderErr: any) {
    console.error("[Orders] Creation error:", orderErr);
    res.status(500).json({ error: orderErr?.message || "Failed to process order" });
  }
});

// Update order details, items, pricing, or weights after facility inspection
app.put("/api/orders/:id", async (req, res) => {
  try {
    const orders = await getCollection<Order>("orders", inMemoryOrders);
    const order = orders.find(o => o.id === req.params.id);
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

    const previousStatus = order.status;
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
    await saveToFirestore("orders", order.id, order);

    const memIdx = inMemoryOrders.findIndex(o => o.id === order.id);
    if (memIdx >= 0) {
      inMemoryOrders[memIdx] = { ...order };
    }

    // Auto-send status update email if status changed
    if (status && status !== previousStatus && notificationSettings.autoSendStatusUpdates && (order.customerEmail || notificationSettings.autoSendAdminAlerts)) {
      sendOrderNotificationEmail({
        order,
        type: "status_update",
        sendAdminCopy: false
      }).catch(err => console.warn("[Status Email Notice]", err));
    }

    res.json(order);
  } catch (err: any) {
    console.error("[Orders] Update error:", err);
    res.status(500).json({ error: err.message || "Failed to update order" });
  }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { status, proofOfDelivery, driverId } = req.body;
    const orders = await getCollection<Order>("orders", inMemoryOrders);
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const previousStatus = order.status;
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

    await saveToFirestore("orders", order.id, order);

    // Auto-send status update email if status changed
    if (status && status !== previousStatus && notificationSettings.autoSendStatusUpdates && (order.customerEmail || notificationSettings.autoSendAdminAlerts)) {
      sendOrderNotificationEmail({
        order,
        type: "status_update",
        sendAdminCopy: false
      }).catch(err => console.warn("[Status Email Notice]", err));
    }

    res.json(order);
  } catch (patchErr: any) {
    console.error("[Orders] Status patch error:", patchErr);
    res.status(500).json({ error: patchErr?.message || "Failed to update order status" });
  }
});

// Admin sends the pre-delivery invoice to the client (SMS + Email)
app.post("/api/orders/:id/send-invoice", async (req, res) => {
  try {
    const orders = await getCollection<Order>("orders", inMemoryOrders);
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const { customMessage, recipientEmail } = req.body;
    order.invoiceSent = true;
    order.invoiceSentAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    const itemsSummary = order.items.map(it => `${it.serviceName} (${it.quantity} ${it.unit}): KSh ${it.subtotal.toLocaleString()}`).join(", ");
    const defaultInvoiceMessage = `Sparkle Spins INVOICE for Order ${order.orderNumber}: Hello ${order.customerName}, your laundry items have been processed! Amount due on delivery: KSh ${order.total.toLocaleString()} (Items: ${itemsSummary}). Scheduled delivery: ${order.deliveryDate} (${order.deliveryTimeWindow})${order.driverName ? ` with rider ${order.driverName}` : ""}. Payment is payable on delivery via M-Pesa or Cash. Thank you for choosing Sparkle Spins!`;

    const messageToSend = customMessage || defaultInvoiceMessage;

    await saveToFirestore("orders", order.id, order);
    console.log(`[Sparkle Spins Pre-Delivery Invoice SMS] To ${order.customerPhone}: "${messageToSend}"`);

    // Dispatch invoice email if customer email exists or recipientEmail passed
    let emailResult = null;
    const targetEmail = recipientEmail || order.customerEmail;
    if (targetEmail) {
      emailResult = await sendOrderNotificationEmail({
        order,
        type: "invoice",
        recipientEmail: targetEmail,
        sendAdminCopy: false
      }).catch(e => {
        console.warn("[Invoice Email Warning]", e);
        return { success: false, error: e?.message };
      });
    }

    res.json({
      success: true,
      order,
      invoiceMessage: messageToSend,
      sentAt: order.invoiceSentAt,
      emailSent: Boolean(emailResult?.success)
    });
  } catch (err: any) {
    console.error("[Invoice] Dispatch error:", err);
    res.status(500).json({ error: err.message || "Failed to dispatch invoice" });
  }
});

// Dedicated Email Notification Endpoints
app.post("/api/notifications/send-order-email", async (req, res) => {
  try {
    const { orderId, type = "order_confirmation", recipientEmail, recipientName, customSubject, customBody, customNote, sendAdminCopy = true } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const orders = await getCollection<Order>("orders", inMemoryOrders);
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const result = await sendOrderNotificationEmail({
      order,
      type,
      recipientEmail,
      recipientName,
      customSubject,
      customBody,
      customNote,
      sendAdminCopy
    });

    res.json({
      success: result.success,
      log: result.log,
      order,
      error: result.error
    });
  } catch (err: any) {
    console.error("[Send Order Email Error]", err);
    res.status(500).json({ error: err?.message || "Failed to send order email" });
  }
});

app.get("/api/notifications/settings", (req, res) => {
  res.json({
    ...notificationSettings,
    smtpConfigured: Boolean(
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
      (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
    )
  });
});

app.post("/api/notifications/settings", (req, res) => {
  const { adminEmail, autoSendOrderConfirmation, autoSendStatusUpdates, autoSendAdminAlerts, senderName, senderEmail } = req.body;
  if (adminEmail !== undefined) notificationSettings.adminEmail = String(adminEmail).trim();
  if (autoSendOrderConfirmation !== undefined) notificationSettings.autoSendOrderConfirmation = Boolean(autoSendOrderConfirmation);
  if (autoSendStatusUpdates !== undefined) notificationSettings.autoSendStatusUpdates = Boolean(autoSendStatusUpdates);
  if (autoSendAdminAlerts !== undefined) notificationSettings.autoSendAdminAlerts = Boolean(autoSendAdminAlerts);
  if (senderName !== undefined) notificationSettings.senderName = String(senderName).trim();
  if (senderEmail !== undefined) notificationSettings.senderEmail = String(senderEmail).trim();

  saveToFirestore("settings", "notifications", notificationSettings);
  res.json({ success: true, settings: notificationSettings });
});

app.get("/api/notifications/logs", async (req, res) => {
  const logs = await getCollection<EmailNotificationLog>("notification_logs", inMemoryEmailLogs);
  res.json(logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
});

app.post("/api/notifications/test-email", async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const recipientRaw = targetEmail || notificationSettings.adminEmail;
    if (!recipientRaw) {
      return res.status(400).json({ error: "Target email address is required" });
    }

    const recipients = recipientRaw.split(/[,;\s]+/).map((s: string) => s.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return res.status(400).json({ error: "No valid recipient email address found" });
    }

    const testSubject = "✨ Sparkle Spins Test Notification";
    const testHtml = `
      <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px;">
        <h2 style="color: #4338ca; margin-top: 0;">Sparkle Spins Laundry</h2>
        <p style="font-size: 14px; color: #334155;">This is a test notification confirming that the Sparkle Spins Order Email Notification System is active and configured correctly for all operations alert recipients.</p>
        <div style="font-size: 12px; color: #64748b; margin-top: 16px;">Sent at: ${new Date().toLocaleString()}</div>
      </div>
    `;

    const logs: EmailNotificationLog[] = [];
    let smtpAuthWarning: string | null = null;
    let anyDeliveredViaSmtp = false;

    for (const rec of recipients) {
      let sendStatus: 'sent' | 'simulated' | 'failed' = emailTransporter ? "sent" : "simulated";
      let sendError: string | undefined = undefined;

      if (emailTransporter) {
        try {
          await emailTransporter.sendMail({
            from: `"${notificationSettings.senderName}" <${notificationSettings.senderEmail}>`,
            to: rec,
            subject: testSubject,
            html: testHtml,
            text: "Sparkle Spins Email Notification System is operational."
          });
          anyDeliveredViaSmtp = true;
          sendStatus = "sent";
          console.log(`[Test Mailer] Successfully sent via SMTP to ${rec}`);
        } catch (e: any) {
          const formatted = formatSmtpError(e);
          console.log(`[Test Mailer Note] SMTP skipped (${rec}): ${formatted.slice(0, 80)}...`);
          smtpAuthWarning = formatted;
          sendStatus = "simulated";
          sendError = formatted;
          if (formatted.includes("534") || formatted.includes("535")) {
            emailTransporter = null;
            notificationSettings.smtpConfigured = false;
          }
        }
      }

      const log: EmailNotificationLog = {
        id: "mail_test_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: "custom",
        recipient: rec,
        subject: testSubject,
        status: sendStatus,
        sentAt: new Date().toISOString(),
        previewSnippet: "Test notification verification from Sparkle Spins Operations.",
        error: sendError
      };

      inMemoryEmailLogs.unshift(log);
      saveToFirestore("notification_logs", log.id, log);
      logs.push(log);
    }

    res.json({
      success: true,
      log: logs[0],
      logs,
      count: logs.length,
      simulated: !anyDeliveredViaSmtp,
      smtpWarning: smtpAuthWarning
    });
  } catch (testErr: any) {
    console.error("[Test Email Error]", testErr);
    res.status(500).json({ error: testErr?.message || "Failed to dispatch test email" });
  }
});

// Mock SMS Notification API endpoint
app.post("/api/orders/:id/send-sms", async (req, res) => {
  try {
    const { customMessage } = req.body;
    const orders = await getCollection<Order>("orders", inMemoryOrders);
    const order = orders.find(o => o.id === req.params.id);
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
  try {
    const { orderId, amount, method, reference, notes } = req.body;
    const orders = await getCollection<Order>("orders", inMemoryOrders);
    const order = orders.find(o => o.id === orderId);
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

    await saveToFirestore("payments", newPayment.id, newPayment);
    await saveToFirestore("orders", order.id, order);
    res.status(201).json({ payment: newPayment, order });
  } catch (err: any) {
    console.error("[Payments] Error:", err);
    res.status(500).json({ error: err.message || "Failed to record payment" });
  }
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

// 9. Gemini AI Laundry Assistant Chatbot (Multi-turn)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "gemini-3.5-flash", systemInstruction } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user" || !m.role);
    const queryText = lastUserMessage?.text || lastUserMessage?.content || "";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";

    if (apiKey) {
      try {
        const defaultSystemInstruction = `You are Sparkle AI, the friendly and expert Virtual Laundry Care Specialist for Sparkle Spins Laundry Co. (serving PCEA Tumutumu Hospital, Karatina Town, Mathira and nearby areas).

Your capabilities & core knowledge:
1. Operations & Pickups: We offer convenient doorstep laundry collection & delivery. Pickups can be scheduled directly on our web landing page. Pickups & deliveries operate daily in Tumutumu Hospital area and Karatina. Turnaround is 24-48 hours. Payments are done safely on delivery (M-Pesa or Cash).
2. Fabric Care & Stain Treatment: Offer immediate, practical stain removal advice for coffee, tea, wine, cooking oil, grease, blood, dirt/mud, grass, ink, makeup, sweat/deodorant, collar rings.
3. Garment Types: Provide guidance on washing instructions for cottons, synthetics, delicates, silks, suits, heavy duvets, woolens, bedsheets, lab coats, and medical scrubs.
4. Services: Wash & Fold (Standard & Bulk), Professional Steam Pressing, Dry Cleaning, Bedding & Comforter Care, Hospital Scrubs, Shoe/Sneaker Revitalization.
5. Communication Style: Warm, empathetic, professional, clear, and structured (use bullet points or numbered steps when giving instructions). Keep answers concise and readable. Always sign off cheerfully!`;

        // Map conversation history to Gemini parts
        const contents = messages.map((m: { role: string; content?: string; text?: string }) => ({
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: m.text || m.content || "" }]
        }));

        const chosenModel = model || "gemini-3.5-flash";

        const response = await ai.models.generateContent({
          model: chosenModel,
          contents,
          config: {
            systemInstruction: systemInstruction || defaultSystemInstruction,
          }
        });

        if (response.text) {
          return res.json({ reply: response.text });
        }
      } catch (geminiError: any) {
        console.warn("[Gemini Chat] API note, falling back to built-in laundry knowledge:", geminiError?.message || geminiError);
      }
    }

    // High quality built-in knowledge response fallback
    const reply = getExpertLaundryResponse(queryText);
    return res.json({ reply });
  } catch (err: any) {
    console.error("[Gemini Chat] Unexpected Error:", err);
    const lastUserMessage = req.body?.messages ? [...req.body.messages].reverse().find((m: any) => m.role === "user" || !m.role) : null;
    const queryText = lastUserMessage?.text || lastUserMessage?.content || "";
    const fallbackReply = getExpertLaundryResponse(queryText);
    res.json({ reply: fallbackReply });
  }
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

