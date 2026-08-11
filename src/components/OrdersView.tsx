import React, { useState } from "react";
import { Order, Driver, OrderStatus } from "../types";
import { Search, Filter, Plus, Truck, Calendar, DollarSign, FileText, CheckCircle, ChevronRight, User, Phone, MapPin, Package } from "lucide-react";

interface OrdersViewProps {
  orders: Order[];
  drivers: Driver[];
  onOpenNewOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, driverId?: string) => void;
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

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  drivers,
  onOpenNewOrder,
  onSelectOrder,
  onUpdateStatus,
  onOpenPaymentModal,
  onOpenInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [driverFilter, setDriverFilter] = useState<string>("All");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerAddress.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    const matchesDriver = driverFilter === "All" || (driverFilter === "Unassigned" ? !order.driverId : order.driverId === driverFilter);

    return matchesSearch && matchesStatus && matchesDriver;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'New':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-medium">New</span>;
      case 'Pickup Scheduled':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-medium">Pickup Scheduled</span>;
      case 'Picked Up':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-medium">Picked Up</span>;
      case 'In Process':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-medium">In Process</span>;
      case 'Ready for Delivery':
        return <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 rounded-full text-xs font-medium">Ready for Delivery</span>;
      case 'Out for Delivery':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-medium">Out for Delivery</span>;
      case 'Delivered':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-medium">Delivered</span>;
      case 'Completed':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium">Completed</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order & Delivery Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, track, and assign orders across the complete pickup-to-delivery lifecycle.
          </p>
        </div>
        <button
          onClick={onOpenNewOrder}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Order
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Driver:</span>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Drivers</option>
              <option value="Unassigned">Unassigned Only</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table / Cards */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No orders found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Driver</th>
                  <th className="py-3.5 px-4">Total / Paid</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map(order => (
                  <tr 
                    key={order.id}
                    className="hover:bg-slate-50/60 transition-all cursor-pointer"
                    onClick={() => onSelectOrder(order)}
                  >
                    <td className="py-4 px-4 font-semibold text-indigo-600">
                      {order.orderNumber}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {order.customerPhone}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs text-slate-900">
                        <span className="font-medium">Pickup:</span> {order.pickupDate} ({order.pickupTimeWindow})
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">Delivery:</span> {order.deliveryDate}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={order.driverId || ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const newDriverId = e.target.value;
                          onUpdateStatus(order.id, order.status, newDriverId);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Unassigned</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">KSh {order.total.toLocaleString()}</div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium inline-block mt-0.5 ${
                        order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                        order.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {order.paymentStatus} {order.balanceDue > 0 && `(Due: KSh ${order.balanceDue.toLocaleString()})`}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenInvoice(order)}
                          title="View Invoice"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenPaymentModal(order)}
                          title="Record Payment"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer flex items-center gap-1 text-xs font-medium px-2.5"
                        >
                          Details <ChevronRight className="w-3.5 h-3.5" />
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
    </div>
  );
};
