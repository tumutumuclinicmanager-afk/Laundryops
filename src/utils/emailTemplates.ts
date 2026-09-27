// HTML Email Templates for Sparkle Spins Laundry Operations
import { Order, OrderStatus } from '../types';

export interface CompanyInfo {
  name: string;
  phone: string;
  email: string;
  location: string;
  operatingHours: string;
  mpesaTill?: string;
  website?: string;
}

export const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Sparkle Spins Laundry & Dry Cleaners',
  phone: '+254 712 345678',
  email: 'sparklespinslaundry@gmail.com',
  location: 'Tumutumu Hospital Road & Karatina Town, Nyeri County, Kenya',
  operatingHours: 'Mon - Sun: 7:00 AM - 8:00 PM',
  mpesaTill: '5421890 (Buy Goods: SPARKLE SPINS LAUNDRY)',
  website: 'https://sparklespins.co.ke'
};

export function getStatusColor(status: OrderStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case 'New':
      return { bg: '#3b82f6', text: '#ffffff', label: 'Order Received' };
    case 'Pickup Scheduled':
      return { bg: '#6366f1', text: '#ffffff', label: 'Pickup Scheduled' };
    case 'Picked Up':
      return { bg: '#8b5cf6', text: '#ffffff', label: 'Picked Up by Rider' };
    case 'In Process':
      return { bg: '#f59e0b', text: '#ffffff', label: 'Washing & Sanitizing in Process' };
    case 'Ready for Delivery':
      return { bg: '#10b981', text: '#ffffff', label: 'Ready for Delivery' };
    case 'Out for Delivery':
      return { bg: '#06b6d4', text: '#ffffff', label: 'Out for Delivery' };
    case 'Delivered':
    case 'Completed':
      return { bg: '#059669', text: '#ffffff', label: 'Successfully Delivered' };
    default:
      return { bg: '#6b7280', text: '#ffffff', label: status };
  }
}

export function generateOrderConfirmationEmail(order: Order, company: CompanyInfo = DEFAULT_COMPANY): { subject: string; html: string; text: string } {
  const subject = `✨ Order Confirmation #${order.orderNumber} - Sparkle Spins Laundry`;

  const itemsRows = (order.items || []).map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; font-weight: 500;">
        ${item.serviceName}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center;">
        ${item.quantity} ${item.unit}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: right;">
        KES ${item.unitPrice.toLocaleString()}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">
        KES ${item.subtotal.toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 36px 32px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.12); padding: 8px 16px; border-radius: 9999px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.2);">
                <span style="color: #c7d2fe; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✨ Tumutumu & Karatina Premium Laundry</span>
              </div>
              <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Sparkle Spins Laundry</h1>
              <p style="color: #e0e7ff; margin: 0; font-size: 15px; font-weight: 400;">Your order pickup has been successfully scheduled!</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 15px; color: #1e293b; font-weight: 600;">Hello, ${order.customerName || 'Valued Customer'} 👋</p>
                <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
                  We have received your laundry pickup request. Our certified driver will arrive at your address during the scheduled time window.
                </p>
              </div>

              <!-- Order Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px; overflow: hidden;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 14px 18px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                    Order Reference
                  </td>
                  <td style="padding: 14px 18px; font-size: 16px; font-weight: 800; color: #4f46e5; text-align: right; font-family: monospace;">
                    ${order.orderNumber}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">📅 Pickup Window</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    ${order.pickupDate} (${order.pickupTimeWindow})
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">🚀 Estimated Delivery</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    ${order.deliveryDate} (${order.deliveryTimeWindow})
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">📍 Pickup Address</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">
                    ${order.customerAddress}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b;">📞 Contact Phone</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">
                    ${order.customerPhone}
                  </td>
                </tr>
                ${order.driverName ? `
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9;">🛵 Assigned Driver</td>
                  <td style="padding: 12px 18px; font-size: 14px; color: #0f172a; font-weight: 600; text-align: right; border-top: 1px solid #f1f5f9;">
                    ${order.driverName}
                  </td>
                </tr>` : ''}
              </table>

              <!-- Itemized Table (if any items) -->
              ${order.items && order.items.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0;">Selected Laundry Services</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                      <th style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Service</th>
                      <th style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #475569; text-align: center; text-transform: uppercase;">Qty</th>
                      <th style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase;">Rate</th>
                      <th style="padding: 10px 16px; font-size: 12px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                  <tfoot>
                    ${order.discount > 0 ? `
                    <tr>
                      <td colspan="3" style="padding: 10px 16px; text-align: right; font-size: 13px; color: #10b981; font-weight: 600;">Discount:</td>
                      <td style="padding: 10px 16px; text-align: right; font-size: 13px; color: #10b981; font-weight: 600;">- KES ${order.discount.toLocaleString()}</td>
                    </tr>` : ''}
                    <tr style="background-color: #f8fafc; border-top: 2px solid #e2e8f0;">
                      <td colspan="3" style="padding: 14px 16px; text-align: right; font-size: 15px; font-weight: 800; color: #0f172a;">Estimated Total:</td>
                      <td style="padding: 14px 16px; text-align: right; font-size: 17px; font-weight: 800; color: #4f46e5;">KES ${order.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              ` : ''}

              <!-- Payment & Hygiene Guarantee -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 700; color: #065f46; margin-bottom: 4px;">
                  💳 Payment on Delivery
                </div>
                <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.4;">
                  You do not need to pay in advance. You can pay via <strong>M-Pesa (Till: ${company.mpesaTill})</strong> or Cash once your garments are cleaned, sanitized, and delivered.
                </p>
              </div>

              ${order.notes ? `
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Special Instructions</div>
                <div style="font-size: 13px; color: #334155; margin-top: 4px;">${order.notes}</div>
              </div>` : ''}

              <!-- Need Help Box -->
              <div style="text-align: center; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e293b;">Need to adjust your pickup time?</p>
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                  Call or WhatsApp us at <strong style="color: #4f46e5;">${company.phone}</strong> or reply to this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #cbd5e1;">${company.name}</p>
              <p style="margin: 0 0 6px 0;">${company.location}</p>
              <p style="margin: 0; color: #64748b;">© ${new Date().getFullYear()} Sparkle Spins Laundry Operations. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Sparkle Spins Laundry - Order Confirmation #${order.orderNumber}
--------------------------------------------------------
Hello ${order.customerName || 'Valued Customer'},

Thank you for booking with Sparkle Spins Laundry!

Order Reference: ${order.orderNumber}
Pickup Date & Time: ${order.pickupDate} (${order.pickupTimeWindow})
Delivery Estimate: ${order.deliveryDate} (${order.deliveryTimeWindow})
Pickup Address: ${order.customerAddress}
Phone: ${order.customerPhone}
Total Amount: KES ${order.total.toLocaleString()}

Payment is due upon delivery via M-Pesa (Till: ${company.mpesaTill}) or Cash.

Need assistance? Call / WhatsApp: ${company.phone}
  `.trim();

  return { subject, html, text };
}

export function generateStatusUpdateEmail(
  order: Order,
  newStatus: OrderStatus,
  customNote?: string,
  company: CompanyInfo = DEFAULT_COMPANY
): { subject: string; html: string; text: string } {
  const statusInfo = getStatusColor(newStatus);
  const subject = `👕 Order Update: #${order.orderNumber} is now ${statusInfo.label}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Status Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 12px 0; font-size: 24px; font-weight: 800;">Sparkle Spins Status Alert</h1>
              <div style="display: inline-block; background-color: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 8px 20px; border-radius: 9999px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                ${statusInfo.label}
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b;">
                Dear <strong>${order.customerName || 'Customer'}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Here is the latest progress on your laundry order <strong>#${order.orderNumber}</strong>:
              </p>

              <!-- Status Detail Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Current Status</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${newStatus}</div>
                    ${customNote ? `<div style="font-size: 14px; color: #334155; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">${customNote}</div>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
                    <strong>Delivery Window:</strong> ${order.deliveryDate} (${order.deliveryTimeWindow})
                  </td>
                </tr>
                ${order.driverName ? `
                <tr>
                  <td style="padding: 12px 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
                    <strong>Assigned Rider:</strong> ${order.driverName}
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 12px 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
                    <strong>Balance Due:</strong> <span style="font-weight: 700; color: ${order.balanceDue === 0 ? '#10b981' : '#f59e0b'};">KES ${order.balanceDue.toLocaleString()} (${order.paymentStatus})</span>
                  </td>
                </tr>
              </table>

              <!-- Support contact -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #475569;">
                  Questions or special drop-off requests? Reach us at <strong style="color: #4f46e5;">${company.phone}</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              © ${new Date().getFullYear()} ${company.name} • ${company.location}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Order Update #${order.orderNumber}
Status: ${newStatus}
Customer: ${order.customerName}
Delivery Schedule: ${order.deliveryDate} (${order.deliveryTimeWindow})
Balance Due: KES ${order.balanceDue.toLocaleString()} (${order.paymentStatus})

${customNote ? `Note: ${customNote}\n` : ''}
Sparkle Spins Laundry (${company.phone})
  `.trim();

  return { subject, html, text };
}

export function generateAdminAlertEmail(
  order: Order,
  eventType: 'new_order' | 'status_change' | 'payment',
  company: CompanyInfo = DEFAULT_COMPANY
): { subject: string; html: string; text: string } {
  const isNew = eventType === 'new_order';
  const cleanPhone = (order.customerPhone || '').replace(/[^0-9]/g, '');
  const subject = isNew
    ? `🚨 [NEW ORDER] #${order.orderNumber} - ${order.customerName} (KES ${order.total.toLocaleString()})`
    : `⚡ [OPS ALERT] #${order.orderNumber} - Status: ${order.status}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.5); border: 1px solid #334155;">
          
          <!-- Admin Urgent Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 28px 24px; text-align: left; color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #ef4444; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;">
                      ${isNew ? '🔥 NEW ORDER PLACED' : '⚡ OPERATIONS UPDATE'}
                    </span>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Order #${order.orderNumber}
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #c7d2fe;">
                      Placed on ${new Date(order.createdAt || Date.now()).toLocaleString()}
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background-color: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 10px 14px; text-align: center;">
                      <div style="font-size: 11px; color: #e0e7ff; text-transform: uppercase; font-weight: 700;">Total Value</div>
                      <div style="font-size: 18px; font-weight: 800; color: #ffffff;">KES ${order.total.toLocaleString()}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick Action Buttons for Admin -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 24px; border-bottom: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 12px; font-weight: 700; color: #475569;">
                    Quick Contact:
                  </td>
                  <td align="right">
                    <a href="tel:${order.customerPhone}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 8px; margin-right: 6px;">
                      📞 Call Customer
                    </a>
                    ${cleanPhone ? `
                    <a href="https://wa.me/${cleanPhone}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 8px;">
                      💬 WhatsApp
                    </a>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Details -->
          <tr>
            <td style="padding: 24px;">
              
              <!-- Customer & Logistics Matrix -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 10px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                      <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        👤 Customer Profile
                      </div>
                      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                        ${order.customerName}
                      </div>
                      <div style="font-size: 13px; color: #4f46e5; font-weight: 600; margin-bottom: 2px;">
                        ${order.customerPhone}
                      </div>
                      <div style="font-size: 12px; color: #64748b;">
                        Email: <strong>${order.customerEmail || 'Not provided'}</strong>
                      </div>
                    </div>
                  </td>

                  <td width="50%" valign="top" style="padding-left: 10px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
                      <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        📍 Pickup Location
                      </div>
                      <div style="font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4;">
                        ${order.customerAddress}
                      </div>
                      <div style="margin-top: 6px;">
                        <span style="display: inline-block; background-color: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                          Status: ${order.status}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Schedule Grid -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" valign="top">
                      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">🚚 Scheduled Pickup</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                        ${order.pickupDate}
                      </div>
                      <div style="font-size: 12px; color: #475569;">
                        Window: <strong>${order.pickupTimeWindow}</strong>
                      </div>
                    </td>
                    <td width="50%" valign="top">
                      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">📦 Target Delivery</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                        ${order.deliveryDate}
                      </div>
                      <div style="font-size: 12px; color: #475569;">
                        Window: <strong>${order.deliveryTimeWindow}</strong>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Services & Items Table -->
              ${order.items && order.items.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                  📋 Requested Items & Pricing
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b;">
                      <th align="left" style="padding: 8px 10px;">Item / Service</th>
                      <th align="center" style="padding: 8px 10px;">Qty</th>
                      <th align="right" style="padding: 8px 10px;">Unit Price</th>
                      <th align="right" style="padding: 8px 10px;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map(it => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">${it.serviceName}</td>
                      <td align="center" style="padding: 8px 10px; color: #475569;">${it.quantity} ${it.unit}</td>
                      <td align="right" style="padding: 8px 10px; color: #64748b;">KES ${it.unitPrice.toLocaleString()}</td>
                      <td align="right" style="padding: 8px 10px; font-weight: 700; color: #0f172a;">KES ${it.subtotal.toLocaleString()}</td>
                    </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr style="border-top: 2px solid #e2e8f0; font-weight: 700;">
                      <td colspan="3" align="right" style="padding: 10px; color: #475569;">Subtotal:</td>
                      <td align="right" style="padding: 10px; color: #0f172a;">KES ${order.subtotal.toLocaleString()}</td>
                    </tr>
                    ${order.discount ? `
                    <tr>
                      <td colspan="3" align="right" style="padding: 4px 10px; color: #10b981;">Discount:</td>
                      <td align="right" style="padding: 4px 10px; color: #10b981;">-KES ${order.discount.toLocaleString()}</td>
                    </tr>` : ''}
                    <tr style="background-color: #eef2ff;">
                      <td colspan="3" align="right" style="padding: 10px; font-size: 14px; font-weight: 800; color: #3730a3;">Total Amount:</td>
                      <td align="right" style="padding: 10px; font-size: 15px; font-weight: 800; color: #3730a3;">KES ${order.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              ` : ''}

              <!-- Customer Special Notes -->
              ${order.notes ? `
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase;">
                  ⚠️ Customer Notes & Special Instructions
                </div>
                <div style="font-size: 13px; color: #78350f; margin-top: 4px; line-height: 1.4;">
                  ${order.notes}
                </div>
              </div>` : ''}

              <!-- Assigned Rider Info -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #334155;">
                <strong>Assigned Rider:</strong> ${order.driverName ? `${order.driverName}` : '<span style="color: #ef4444; font-weight: 700;">Unassigned - Please assign in dashboard</span>'}
                &nbsp;•&nbsp;
                <strong>Payment:</strong> <span style="font-weight: 700; color: ${order.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'};">${order.paymentStatus} (KES ${order.balanceDue.toLocaleString()} Due)</span>
              </div>
            </td>
          </tr>

          <!-- Admin Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 18px 24px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #cbd5e1;">Sparkle Spins Laundry — Automated Operations Dispatch</p>
              <p style="margin: 0; color: #64748b;">This instant alert was automatically dispatched to the admin notification inbox (${company.email}).</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
🚨 [NEW ORDER ALERT] #${order.orderNumber}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail || 'None'}
Pickup: ${order.pickupDate} (${order.pickupTimeWindow})
Address: ${order.customerAddress}
Delivery: ${order.deliveryDate} (${order.deliveryTimeWindow})
Total: KES ${order.total.toLocaleString()} (${order.paymentStatus})
${order.notes ? `Notes: ${order.notes}\n` : ''}
${order.driverName ? `Assigned Rider: ${order.driverName}\n` : 'Rider: Unassigned\n'}
Sparkle Spins Laundry Operations
  `.trim();

  return { subject, html, text };
}
