import React, { useState } from "react";
import { Order, Driver, OrderStatus } from "../types";
import { Truck, Phone, MapPin, Calendar, DollarSign, FileText, CheckCircle, Clock } from "lucide-react";

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

  const handleSave = () => {
    onUpdateStatus(order.id, status, driverId || undefined, proof);
    onClose();
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
            <div className="flex gap-2">
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
