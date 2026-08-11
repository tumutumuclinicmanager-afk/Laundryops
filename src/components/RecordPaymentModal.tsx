import React, { useState } from "react";
import { Order } from "../types";
import { DollarSign, CreditCard } from "lucide-react";

interface RecordPaymentModalProps {
  order: Order;
  onClose: () => void;
  onSubmitPayment: (paymentData: { orderId: string; amount: number; method: string; reference?: string; notes?: string }) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  onClose,
  onSubmitPayment
}) => {
  const [amount, setAmount] = useState(order.balanceDue > 0 ? order.balanceDue.toString() : order.total.toString());
  const [method, setMethod] = useState<'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Card'>('Mobile Money');
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    onSubmitPayment({
      orderId: order.id,
      amount: payAmt,
      method,
      reference,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">Order {order.orderNumber} • {order.customerName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1">✕</button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl mb-4 space-y-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Order Total:</span>
            <span className="font-semibold text-slate-900">KSh {order.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Already Paid:</span>
            <span className="font-semibold text-emerald-600">KSh {order.amountPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="font-semibold text-slate-800">Balance Due:</span>
            <span className="font-bold text-rose-600">KSh {order.balanceDue.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (KSh)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Mobile Money">Mobile Money (M-Pesa / Venmo / Zelle)</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Credit / Debit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Transaction ID (Optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN-984321"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid upon delivery"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Confirm & Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
