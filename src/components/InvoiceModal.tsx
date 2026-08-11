import React from "react";
import { Order } from "../types";
import { Printer, Download, CheckCircle2, FileText } from "lucide-react";

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl my-8 relative">
        {/* Top actions bar (hidden during print) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              🧺
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Invoice #{order.orderNumber}</h3>
              <p className="text-xs text-slate-500">Generated for {order.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="mt-6 space-y-6 text-slate-800">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">LaundryOps & Dry Cleaning</h1>
              <p className="text-xs text-slate-500 mt-0.5">Professional Pickup & Delivery Service</p>
              <p className="text-xs text-slate-500">support@laundryops.co.ke • +254 700 123456</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-indigo-600">INVOICE</div>
              <div className="text-xs font-mono text-slate-600 mt-0.5">{order.orderNumber}</div>
              <div className="text-xs text-slate-500 mt-1">Date: {new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Customer & Order Meta */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Billed To:</span>
              <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
              <div className="text-slate-600 mt-0.5">{order.customerPhone}</div>
              <div className="text-slate-600 mt-0.5">{order.customerAddress}</div>
            </div>
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Service Schedule:</span>
              <div className="text-slate-700"><span className="font-medium">Pickup:</span> {order.pickupDate} ({order.pickupTimeWindow})</div>
              <div className="text-slate-700 mt-0.5"><span className="font-medium">Delivery:</span> {order.deliveryDate} ({order.deliveryTimeWindow})</div>
              {order.driverName && (
                <div className="text-slate-700 mt-0.5"><span className="font-medium">Driver:</span> {order.driverName}</div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-2">Service Description</th>
                <th className="py-2.5 px-2 text-center">Unit Price</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-2 font-medium text-slate-900">{item.serviceName}</td>
                  <td className="py-3 px-2 text-center text-slate-600">KSh {item.unitPrice.toLocaleString()}</td>
                  <td className="py-3 px-2 text-center text-slate-600">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-2 text-right font-semibold text-slate-900">KSh {item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Payment Status */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">KSh {order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-KSh {order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-indigo-600">KSh {order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-600">KSh {order.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                <span>Balance Due:</span>
                <span className={order.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}>
                  KSh {order.balanceDue.toLocaleString()} ({order.paymentStatus})
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            <p>Thank you for trusting LaundryOps with your garments! For questions, call our support line.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
