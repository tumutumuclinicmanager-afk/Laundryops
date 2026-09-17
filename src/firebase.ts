import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, Firestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Order, Customer } from "./types";

let firestoreDb: Firestore | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  firestoreDb = getFirestore(app, databaseId);
} catch (err) {
  console.warn("[Firebase Client] Initialization note:", err);
}

export const db = firestoreDb;

// Direct Firestore write for orders as a seamless fallback
export async function saveOrderToFirestore(order: Order, customerInfo?: Partial<Customer>): Promise<boolean> {
  if (!db) return false;
  try {
    // 1. Save order document
    await setDoc(doc(db, "orders", order.id), {
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 2. Save/Update customer document if provided
    if (customerInfo && order.customerId) {
      await setDoc(doc(db, "customers", order.customerId), {
        id: order.customerId,
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress,
        notes: order.notes ? `Booking: ${order.notes}` : "Customer portal booking",
        createdAt: customerInfo.createdAt || new Date().toISOString()
      }, { merge: true });
    }

    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save order to Firestore:", err);
    return false;
  }
}

// Direct Firestore write for reviews as a seamless fallback
export async function saveReviewToFirestore(review: any): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "reviews", review.id), review);
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save review to Firestore:", err);
    return false;
  }
}

// Direct Firestore write for payments as a seamless fallback
export async function savePaymentToFirestore(payment: any, updatedOrder: Order): Promise<boolean> {
  if (!db) return false;
  try {
    // 1. Save payment document
    await setDoc(doc(db, "payments", payment.id), {
      ...payment,
      date: payment.date || new Date().toISOString()
    });

    // 2. Update order document with payment info
    await setDoc(doc(db, "orders", updatedOrder.id), {
      ...updatedOrder,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to save payment to Firestore:", err);
    return false;
  }
}

// Direct Firestore write for order status updates as a seamless fallback
export async function updateOrderStatusInFirestore(orderId: string, status: string, driverId?: string, proofOfDelivery?: string): Promise<boolean> {
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

    await setDoc(doc(db, "orders", orderId), updateData, { merge: true });
    return true;
  } catch (err) {
    console.error("[Firebase Client] Failed to update order status in Firestore:", err);
    return false;
  }
}

