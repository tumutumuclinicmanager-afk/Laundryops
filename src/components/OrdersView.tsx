import React, { useState } from "react";
import { Order, Driver, OrderStatus } from "../types";
import { Search, Filter, Plus, Truck, Calendar, DollarSign, FileText, CheckCircle, ChevronRight, User, Phone, MapPin, Package, Send, ExternalLink, Zap, Check } from "lucide-react";
import { openWhatsAppChat } from "../utils/whatsapp";

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

  // Determine the last active rider (or default available rider) for fast 1-click dispatch
  const lastAssignedDriverId = orders.find(o => Boolean(o.driverId))?.driverId;
  const lastActiveDriver = drivers.find(d => d.id === lastAssignedDriverId) || drivers.find(d => d.status === 'Available') || drivers[0];

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
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-bold">New</span>;
      case 'Pickup Scheduled':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">Pickup Scheduled</span>;
      case 'Picked Up':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-bold">Picked Up</span>;
      case 'In Process':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-bold">In Process</span>;
      case 'Ready for Delivery':
        return <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-1 rounded-full text-xs font-bold">Ready for Delivery</span>;
      case 'Out for Delivery':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-bold">Out for Delivery</span>;
      case 'Delivered':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">Delivered</span>;
      case 'Completed':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold">Completed</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{status}</span>;
    }
  };

  const handleQuickDispatchRider = (order: Order, driverId: string) => {
    const matched = drivers.find(d => d.id === driverId);
    if (!matched) return;
    const targetStatus: OrderStatus = order.status === 'Ready for Delivery' || order.status === 'In Process' || order.status === 'Picked Up'
      ? 'Out for Delivery'
      : 'Pickup Scheduled';
    onUpdateStatus(order.id, targetStatus, driverId);
  };

  const handleShareRiderWhatsApp = (order: Order, driver: Driver) => {
    const text = `🛵 Sparkle Spins Dispatch Assignment:\nOrder: ${order.orderNumber}\nCustomer: ${order.customerName} (${order.customerPhone})\nAddress: ${order.customerAddress}\nStatus: ${order.status}\nScheduled: ${order.deliveryDate || order.pickupDate}\nAmount to collect on delivery: KSh ${order.balanceDue.toLocaleString()}`;
    openWhatsAppChat(driver.phone, text);
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
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-sm cursor-pointer"
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
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Rider:</span>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Riders</option>
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
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">⚡ Fast Rider Dispatch</th>
                  <th className="py-3.5 px-4">Billing / Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map(order => {
                  const assignedDriver = drivers.find(d => d.id === order.driverId);
                  return (
                    <tr 
                      key={order.id}
                      className="hover:bg-slate-50/60 transition-all cursor-pointer"
                      onClick={() => onSelectOrder(order)}
                    >
                      <td className="py-4 px-4 font-extrabold text-blue-600">
                        {order.orderNumber}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" /> {order.customerPhone}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-slate-900 font-medium">
                          <span className="font-bold text-slate-400">Pickup:</span> {order.pickupDate} ({order.pickupTimeWindow})
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <span className="font-bold text-slate-400">Delivery:</span> {order.deliveryDate}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Simplified 1-Click Rider Dispatch */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!order.driverId ? (
                            <>
                              {lastActiveDriver && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickDispatchRider(order, lastActiveDriver.id)}
                                  title={`1-Click Dispatch to last active rider: ${lastActiveDriver.name}`}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Dispatch ({lastActiveDriver.name.split(' ')[0]})</span>
                                </button>
                              )}

                              <select
                                value=""
                                onChange={(e) => {
                                  const newDriverId = e.target.value;
                                  if (newDriverId) {
                                    handleQuickDispatchRider(order, newDriverId);
                                  }
                                }}
                                className="rounded-lg px-2 py-1.5 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                              >
                                <option value="">Other Rider...</option>
                                {drivers.map(d => (
                                  <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1">
                                <span>🛵</span>
                                <span>{assignedDriver?.name || order.driverName}</span>
                              </span>

                              {assignedDriver && (
                                <button
                                  type="button"
                                  onClick={() => handleShareRiderWhatsApp(order, assignedDriver)}
                                  title={`WhatsApp dispatch details to ${assignedDriver.name}`}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <select
                                value={order.driverId}
                                onChange={(e) => {
                                  const newDriverId = e.target.value;
                                  if (newDriverId) {
                                    handleQuickDispatchRider(order, newDriverId);
                                  } else {
                                    onUpdateStatus(order.id, order.status, "");
                                  }
                                }}
                                className="rounded-lg px-1.5 py-1 text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                                title="Change or unassign rider"
                              >
                                <option value="">Unassign</option>
                                {drivers.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Billing & Balance */}
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900">KSh {order.total.toLocaleString()}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold inline-block mt-0.5 ${
                          order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          order.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {order.paymentStatus} {order.balanceDue > 0 && `(Due: KSh ${order.balanceDue.toLocaleString()})`}
                        </span>
                        <div className="mt-1">
                          {order.invoiceSent ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                              ✓ Invoice Sent
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              ⚠️ Invoice Pending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Simplified Actions Column */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {!order.driverId && lastActiveDriver && (
                            <button
                              type="button"
                              onClick={() => handleQuickDispatchRider(order, lastActiveDriver.id)}
                              title={`1-Click Dispatch to ${lastActiveDriver.name}`}
                              className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {order.balanceDue > 0 ? (
                            <button
                              onClick={() => onOpenPaymentModal(order)}
                              title={`Record payment of KSh ${order.balanceDue.toLocaleString()}`}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Pay KSh {order.balanceDue.toLocaleString()}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenInvoice(order)}
                              title="View & Print Official PDF Receipt"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold border border-blue-200"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

