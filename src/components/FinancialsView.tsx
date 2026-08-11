import React, { useState } from "react";
import { Order, Payment, Reports } from "../types";
import { DollarSign, FileText, CreditCard, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2, Search } from "lucide-react";

interface FinancialsViewProps {
  orders: Order[];
  payments: Payment[];
  reports: Reports | null;
  onOpenPaymentModal: (order: Order) => void;
  onOpenInvoice: (order: Order) => void;
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({
  orders,
  payments,
  reports,
  onOpenPaymentModal,
  onOpenInvoice
}) => {
  const [activeTab, setActiveTab] = useState<'outstanding' | 'payments' | 'invoices'>('outstanding');
  const [searchQuery, setSearchQuery] = useState("");

  const unpaidOrders = orders.filter(o => o.paymentStatus !== "Paid");

  const filteredUnpaid = unpaidOrders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerPhone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financials & Revenue Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor incoming revenue, outstanding customer balances, and payment records.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {reports && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Total Revenue Collected</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">KSh {reports.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">From {payments.length} recorded payments</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Outstanding Balances</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">KSh {reports.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-amber-600 font-medium mt-1">{unpaidOrders.length} orders pending payment</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Completed Orders</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">{reports.completedOrders} / {reports.totalOrders}</div>
            <p className="text-xs text-indigo-600 font-medium mt-1">Fulfillment rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
              <span>Top Payment Method</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-xl font-bold text-slate-900 truncate">
              {Object.entries(reports.revenueByMethod).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0]?.[0] || 'Cash'}
            </div>
            <p className="text-xs text-purple-600 font-medium mt-1">Most preferred by customers</p>
          </div>
        </div>
      )}

      {/* Subtabs & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('outstanding')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'outstanding' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Outstanding Balances ({unpaidOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'payments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payment History ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoices & Billing
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'outstanding' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          {filteredUnpaid.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">All orders are fully paid!</h3>
              <p className="text-sm text-slate-500 mt-1">There are no outstanding customer balances right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Order Total</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Balance Due</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUnpaid.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-4 px-4 font-semibold text-indigo-600">{order.orderNumber}</td>
                      <td className="py-4 px-4 font-medium text-slate-900">
                        {order.customerName}
                        <div className="text-xs text-slate-500">{order.customerPhone}</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900">KSh {order.total.toLocaleString()}</td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">KSh {order.amountPaid.toLocaleString()}</td>
                      <td className="py-4 px-4 text-rose-600 font-bold">KSh {order.balanceDue.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          order.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenInvoice(order)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all"
                          >
                            Invoice
                          </button>
                          <button
                            onClick={() => onOpenPaymentModal(order)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-all shadow-xs"
                          >
                            Record Payment
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No payments recorded</h3>
              <p className="text-sm text-slate-500 mt-1">Payments recorded against orders will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Payment ID</th>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Reference / Notes</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-4 px-4 font-mono text-xs text-slate-500">{p.id}</td>
                      <td className="py-4 px-4 font-semibold text-indigo-600">{p.orderNumber}</td>
                      <td className="py-4 px-4 font-medium text-slate-900">{p.customerName}</td>
                      <td className="py-4 px-4">
                        <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-medium">
                          {p.method}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {p.reference && <span className="font-mono font-medium text-slate-800">{p.reference}</span>}
                        {p.notes && <div className="text-slate-500 mt-0.5">{p.notes}</div>}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">{new Date(p.date).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-600">+KSh {p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">All Order Invoices</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click invoice to view printable breakdown or download.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Pickup Date</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-all">
                    <td className="py-4 px-4 font-semibold text-indigo-600">{order.orderNumber}</td>
                    <td className="py-4 px-4 font-medium text-slate-900">{order.customerName}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">{order.pickupDate}</td>
                    <td className="py-4 px-4 font-semibold text-slate-900">KSh {order.total.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                        order.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onOpenInvoice(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
