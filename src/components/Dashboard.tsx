import React from "react";
import { Stats, Order } from "../types";
import { Truck, Package, Clock, DollarSign, AlertCircle, CheckCircle2, ArrowUpRight, Plus, Users, Calendar } from "lucide-react";

interface DashboardProps {
  stats: Stats | null;
  onNavigate: (tab: string) => void;
  onOpenNewOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onNavigate,
  onOpenNewOrder,
  onSelectOrder,
  onUpdateStatus
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status: Order['status']) => {
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
    <div className="space-y-8">
      {/* Top Banner / Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-sky-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage daily pickups, deliveries, and monitor real-time business financials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Order / Pickup
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => onNavigate('orders')}
          className="bg-white p-5 rounded-3xl shadow-sm border border-sky-100 hover:border-blue-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Pickups</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">{stats.todayPickupsCount}</div>
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
              View schedule <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('orders')}
          className="bg-white p-5 rounded-3xl shadow-sm border border-sky-100 hover:border-emerald-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Deliveries</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">{stats.todayDeliveriesCount}</div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              View schedule <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('orders')}
          className="bg-white p-5 rounded-3xl shadow-sm border border-sky-100 hover:border-purple-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Orders In Process</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">{stats.inProgressCount}</div>
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
              Active workflow <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('financials')}
          className="bg-white p-5 rounded-3xl shadow-sm border border-sky-100 hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unpaid / Outstanding</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">KSh {stats.totalOutstanding.toLocaleString()}</div>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              Revenue: KSh {stats.totalRevenue.toLocaleString()} <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Two column layout: Today's Schedule & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Pickups & Deliveries */}
        <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Schedule ({new Date().toLocaleDateString()})
            </h2>
            <button 
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest"
            >
              View All Orders
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pickups Today</h3>
              {stats.todayPickups.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-sky-50/50 p-4 rounded-2xl text-center">No pickups scheduled for today.</p>
              ) : (
                <div className="space-y-2">
                  {stats.todayPickups.map(order => (
                    <div 
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-sky-100 hover:border-blue-300 bg-sky-50/30 hover:bg-blue-50/20 transition-all cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{order.customerName}</span>
                          <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg">{order.orderNumber}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{order.customerAddress}</p>
                        <p className="text-xs text-slate-600 font-bold mt-1">🕒 {order.pickupTimeWindow}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        {order.driverName && (
                          <p className="text-xs text-slate-500 mt-1">Driver: {order.driverName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Deliveries Today</h3>
              {stats.todayDeliveries.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-sky-50/50 p-4 rounded-2xl text-center">No deliveries scheduled for today.</p>
              ) : (
                <div className="space-y-2">
                  {stats.todayDeliveries.map(order => (
                    <div 
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-sky-100 hover:border-emerald-300 bg-sky-50/30 hover:bg-emerald-50/20 transition-all cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{order.customerName}</span>
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">{order.orderNumber}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{order.customerAddress}</p>
                        <p className="text-xs text-slate-600 font-bold mt-1">🕒 {order.deliveryTimeWindow}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        {order.driverName && (
                          <p className="text-xs text-slate-500 mt-1">Driver: {order.driverName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders & Quick Activity */}
        <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Recent Orders
              </h2>
              <button 
                onClick={() => onNavigate('orders')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {stats.recentOrders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-sky-100 hover:border-blue-200 transition-all cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">
                      {order.orderNumber.replace("ORD-", "#")}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{order.customerName}</div>
                      <div className="text-xs text-slate-500">{order.items.length} items • KSh {order.total.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-xl font-bold ${
                      order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                      order.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {order.paymentStatus}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-sky-100 bg-sky-50/50 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-blue-900">Driver Fleet Status</h4>
              <p className="text-xs text-blue-700 mt-0.5">Drivers actively handling routes across the city.</p>
            </div>
            <button
              onClick={() => onNavigate('driver')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200 cursor-pointer"
            >
              Open Driver View 📱
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
