import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  onSnapshot,
  writeBatch,
  Firestore,
  Unsubscribe
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Order, Customer, Driver, ServiceItem, Payment, Review } from "./types";

let firestoreDb: Firestore | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  firestoreDb = getFirestore(app, databaseId);
  console.log(`[Firebase Client] Connected to database: ${databaseId}`);
} catch (err) {
  console.warn("[Firebase Client] Initialization note:", err);
}

export const db = firestoreDb;

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

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// ==========================================

export function subscribeToFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: any) => void
): Unsubscribe | null {
  if (!db) return null;
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        })) as T[];
        onData(items);
      },
      (error) => {
        console.warn(`[Firebase Realtime] Listener error on ${collectionName}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (e) {
    console.warn(`[Firebase Realtime] Failed to attach listener to ${collectionName}:`, e);
    return null;
  }
}

// ==========================================
// DIRECT FIRESTORE CRUD OPERATIONS
// ==========================================

// Direct Firestore write for orders
export async function saveOrderToFirestore(order: Order, customerInfo?: Partial<Customer>): Promise<boolean> {
  if (!db) return false;
  try {
    const cleanedOrder = cleanForFirestore({
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, "orders", order.id), cleanedOrder, { merge: true });

    if (customerInfo && order.customerId) {
      await setDoc(doc(db, "customers", order.customerId), cleanForFirestore({
        id: order.customerId,
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress,
        notes: order.notes ? `Booking: ${order.notes}` : "Customer portal booking",
        createdAt: customerInfo.createdAt || new Date().toISOString()
      }), { merge: true });
    }

    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save order to Firestore:", err);
    return false;
  }
}

// Direct Firestore write for order status updates
export async function updateOrderStatusInFirestore(
  orderId: string,
  status: string,
  driverId?: string,
  proofOfDelivery?: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (proofOfDelivery !== undefined) {
      updateData.proofOfDelivery = proofOfDelivery;
    }
    if (driverId !== undefined) {
      updateData.driverId = driverId || "";
    }

    await setDoc(doc(db, "orders", orderId), cleanForFirestore(updateData), { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to update order status in Firestore:", err);
    return false;
  }
}

// Direct Firestore write for order items, weighing, dates, and workflow updates
export async function updateOrderDetailsInFirestore(orderId: string, updatedData: any): Promise<boolean> {
  if (!db) return false;
  try {
    const cleaned = cleanForFirestore({
      ...updatedData,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, "orders", orderId), cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to update order details in Firestore:", err);
    return false;
  }
}

// Direct Firestore write for customers
export async function saveCustomerToFirestore(customer: Customer): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "customers", customer.id), cleanForFirestore(customer), { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save customer to Firestore:", err);
    return false;
  }
}

// Direct Firestore write for drivers
export async function saveDriverToFirestore(driver: Driver): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "drivers", driver.id), cleanForFirestore(driver), { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save driver to Firestore:", err);
    return false;
  }
}

// Direct Firestore delete for drivers
export async function deleteDriverFromFirestore(driverId: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "drivers", driverId));
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to delete driver from Firestore:", err);
    return false;
  }
}

// Direct Firestore write for services
export async function saveServiceToFirestore(service: ServiceItem): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "services", service.id), cleanForFirestore(service), { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save service to Firestore:", err);
    return false;
  }
}

// Direct Firestore write for payments
export async function savePaymentToFirestore(payment: any, updatedOrder?: Order): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "payments", payment.id), cleanForFirestore({
      ...payment,
      date: payment.date || new Date().toISOString()
    }), { merge: true });

    if (updatedOrder) {
      await setDoc(doc(db, "orders", updatedOrder.id), cleanForFirestore({
        ...updatedOrder,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    }

    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save payment to Firestore:", err);
    return false;
  }
}

// Direct Firestore write for reviews
export async function saveReviewToFirestore(review: any): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "reviews", review.id), cleanForFirestore(review), { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save review to Firestore:", err);
    return false;
  }
}

// Direct Batch Initial Seeding if Firestore is empty
export async function seedFirestoreIfEmpty(
  customers: Customer[],
  drivers: Driver[],
  services: ServiceItem[],
  orders: Order[],
  payments: Payment[],
  reviews: Review[]
): Promise<boolean> {
  if (!db) return false;
  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    if (ordersSnap.empty) {
      console.log("[Firebase Client] Seeding initial data to Firestore...");
      const batch = writeBatch(db);
      for (const c of customers) batch.set(doc(db, "customers", c.id), cleanForFirestore(c));
      for (const d of drivers) batch.set(doc(db, "drivers", d.id), cleanForFirestore(d));
      for (const s of services) batch.set(doc(db, "services", s.id), cleanForFirestore(s));
      for (const o of orders) batch.set(doc(db, "orders", o.id), cleanForFirestore(o));
      for (const p of payments) batch.set(doc(db, "payments", p.id), cleanForFirestore(p));
      for (const r of reviews) batch.set(doc(db, "reviews", r.id), cleanForFirestore(r));
      await batch.commit();
      console.log("[Firebase Client] Initial seeding complete!");
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[Firebase Client] Note on initial seeding:", err);
    return false;
  }
}

