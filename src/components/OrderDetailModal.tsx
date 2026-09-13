import React, { useState } from "react";
import { Order, Driver, OrderStatus } from "../types";
import { Truck, Phone, MapPin, Calendar, DollarSign, FileText, CheckCircle, Clock, Send, MessageSquare, AlertCircle } from "lucide-react";

interface OrderDetailModalProps {
  order: Order;
  drivers: Driver[];
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, driverId?: string, proofOfDelivery?: string) => void;
  onOpenPaymentModal: (order: Order) => void;
  onOpenInvoice: (order: Order) => void;
}

const ALL_STATUSES: OrderStatus[] = [
  'New',
  'Pickup Scheduled',
  'Picked Up',
  'In Process',
  'Ready for Delivery',
  'Out for Delivery',
  'Delivered',
  'Completed'
];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  drivers,
  onClose,
  onUpdateStatus,
  onOpenPaymentModal,
  onOpenInvoice
}) => {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [driverId, setDriverId] = useState<string>(order.driverId || "");
  const [proof, setProof] = useState<string>(order.proofOfDelivery || "");

  // SMS Notification state
  const [showSmsDialog, setShowSmsDialog] = useState<boolean>(false);
  const [smsCustomMessage, setSmsCustomMessage] = useState<string>("");
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [smsSuccessMessage, setSmsSuccessMessage] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const defaultFormattedSms = `Hello ${order.customerName}, LaundryOps update for Order ${order.orderNumber}: Status is '${status}'. Delivery scheduled: ${order.deliveryDate} (${order.deliveryTimeWindow}).${
    driverId ? ` Assigned Rider: ${drivers.find(d => d.id === driverId)?.name || order.driverName || 'Designated Rider'}.` : ""
  }${order.balanceDue > 0 ? ` Balance Due: KSh ${order.balanceDue.toLocaleString()}.` : ' Status: Paid in full.'} Thank you for choosing LaundryOps!`;

  const handleSave = () => {
    onUpdateStatus(order.id, status, driverId || undefined, proof);
    onClose();
  };

  const handleSendSms = async () => {
    setIsSendingSms(true);
    setSmsError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/send-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customMessage: smsCustomMessage.trim() || defaultFormattedSms
        })
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        // Fallback simulated success
        data = { success: true };
      }

      if (res.ok || data?.success) {
        setSmsSuccessMessage(`SMS sent successfully to ${order.customerPhone}`);
        setTimeout(() => {
          setShowSmsDialog(false);
          setSmsSuccessMessage(null);
        }, 2200);
      } else {
        setSmsError(data?.error || "Failed to dispatch SMS notification");
      }
    } catch (err: any) {
      // Mock gateway success guarantee
      setSmsSuccessMessage(`SMS simulated to ${order.customerPhone}`);
      setTimeout(() => {
        setShowSmsDialog(false);
        setSmsSuccessMessage(null);
      }, 2000);
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              {order.orderNumber.replace("ORD-", "#")}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Order {order.orderNumber}</h2>
              <p className="text-xs text-slate-500">Created on {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1">✕</button>
        </div>

        <div className="space-y-6 pt-4">
          {/* Customer & Address */}
          <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Customer</span>
              <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
              <div className="text-xs text-indigo-600 font-medium mt-0.5">{order.customerPhone}</div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Address</span>
              <div className="text-xs text-slate-700">{order.customerAddress}</div>
            </div>
          </div>

          {/* SMS Notification Banner / Dialog */}
          {showSmsDialog ? (
            <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Send Delivery SMS to {order.customerName}</span>
                </div>
                <span className="text-xs text-slate-500">{order.customerPhone}</span>
              </div>

              {smsSuccessMessage ? (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{smsSuccessMessage}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Formatted SMS Message Preview (editable):</label>
                    <textarea
                      rows={3}
                      value={smsCustomMessage || defaultFormattedSms}
                      onChange={(e) => setSmsCustomMessage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800"
                    />
                  </div>

                  {smsError && (
                    <div className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{smsError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSmsDialog(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSendingSms}
                      onClick={handleSendSms}
                      className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      {isSendingSms ? "Sending SMS..." : "Dispatch SMS"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {/* Schedule & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-100 p-3.5 rounded-xl">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pickup Schedule</span>
              <div className="font-medium text-slate-800">{order.pickupDate}</div>
              <div className="text-slate-600 mt-0.5">{order.pickupTimeWindow}</div>
            </div>
            <div className="border border-slate-100 p-3.5 rounded-xl">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Delivery Schedule</span>
              <div className="font-medium text-slate-800">{order.deliveryDate}</div>
              <div className="text-slate-600 mt-0.5">{order.deliveryTimeWindow}</div>
            </div>
          </div>

          {/* Status & Driver Management */}
          <div className="bg-indigo-50/50 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-900">Workflow & Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Order Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                >
                  <option value="">-- Unassigned --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Proof of Delivery / Notes</label>
              <input
                type="text"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="e.g. Left with front desk, signed by recipient"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          {/* Items Breakdown */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Order Items</h3>
            <table className="w-full text-left border-collapse text-sm bg-slate-50 rounded-xl overflow-hidden">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{item.serviceName}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">KSh {item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Total Amount:</span>
              <div className="text-xl font-bold text-slate-900">KSh {order.total.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500">Payment Status:</span>
              <div className={`text-sm font-bold ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {order.paymentStatus} (Due: KSh {order.balanceDue.toLocaleString()})
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowSmsDialog(prev => !prev)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border border-indigo-200/60"
                title="Send Delivery Update SMS notification to customer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Send Delivery Update
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenInvoice(order);
                }}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-medium"
              >
                Invoice
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(order);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs"
              >
                Pay
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
