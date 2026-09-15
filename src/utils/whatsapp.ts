import { Order, OrderStatus } from "../types";

export function generateWhatsAppMessage(order: Order, status: OrderStatus, driverName?: string): string {
  const cleanStatus = status;
  const isReady = cleanStatus === 'Ready for Delivery';
  const isDelivery = cleanStatus.includes('Delivery') || cleanStatus === 'Completed';

  let header = `✨ *Sparkle Spins Update* ✨`;
  if (isReady) {
    header = `🧺 *Sparkle Spins - Order Ready for Delivery!* 🚚`;
  }

  let body = `Hi *${order.customerName}*, your laundry order *${order.orderNumber}* status is now: *${cleanStatus}*.`;

  if (isReady || isDelivery) {
    body += `\n\n📅 Delivery Date: *${order.deliveryDate}* (${order.deliveryTimeWindow})`;
    if (driverName) {
      body += `\n rider Assigned: *${driverName}*`;
    }
    if (order.balanceDue > 0) {
      body += `\n💰 Total Balance Due on Delivery: *KSh ${order.balanceDue.toLocaleString()}*`;
    } else {
      body += `\n✅ Payment Status: *Paid in Full*`;
    }
  }

  body += `\n\nThank you for choosing Sparkle Spins! For any queries, call +254 700 123456.`;
  return `${header}\n\n${body}`;
}

export function openWhatsAppChat(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
