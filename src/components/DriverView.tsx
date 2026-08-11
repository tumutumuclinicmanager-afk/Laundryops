import React, { useState } from "react";
import { Order, Driver, OrderStatus } from "../types";
import { Truck, Phone, MapPin, CheckCircle, Clock, Navigation, Check, AlertCircle, Camera } from "lucide-react";

interface DriverViewProps {
  orders: Order[];
  drivers: Driver[];
  onUpdateStatus: (orderId: string, status: OrderStatus, driverId?: string, proofOfDelivery?: string) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  orders,
  drivers,
  onUpdateStatus
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || "");
  const [proofNotes, setProofNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');

  const currentDriver = drivers.find(d => d.id === selectedDriverId);
  const driverOrders = orders.filter(o => o.driverId === selectedDriverId);

  const assignedOrders = driverOrders.filter(o => o.status !== 'Completed');
  const completedOrders = driverOrders.filter(o => o.status === 'Completed');

  const handleStatusAdvance = (order: Order) => {
    let nextStatus: OrderStatus = order.status;
    if (order.status === 'Pickup Scheduled') nextStatus = 'Picked Up';
    else if (order.status === 'Picked Up') nextStatus = 'In Process';
    else if (order.status === 'Ready for Delivery') nextStatus = 'Out for Delivery';
    else if (order.status === 'Out for Delivery') nextStatus = 'Delivered';
    else if (order.status === 'Delivered') nextStatus = 'Completed';

    const proof = proofNotes[order.id] || order.proofOfDelivery;
    onUpdateStatus(order.id, nextStatus, order.driverId, proof);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      {/* Driver Mobile Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold bg-indigo-500/50 px-2.5 py-1 rounded-full">
            Driver Mobile App 📱
          </span>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="bg-indigo-800 text-white border border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
            ))}
          </select>
        </div>
        <h1 className="text-xl font-bold">{currentDriver?.name || 'Driver Portal'}</h1>
        <p className="text-xs text-indigo-100 mt-0.5">{currentDriver?.vehicle} • Status: {currentDriver?.status}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-indigo-500/50">
          <div className="bg-indigo-800/50 p-3 rounded-2xl">
            <span className="text-xs text-indigo-200">Pending Stops</span>
            <div className="text-2xl font-bold mt-0.5">{assignedOrders.length}</div>
          </div>
          <div className="bg-indigo-800/50 p-3 rounded-2xl">
            <span className="text-xs text-indigo-200">Completed Today</span>
            <div className="text-2xl font-bold mt-0.5">{completedOrders.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-xs border border-slate-100">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'assigned' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active Stops ({assignedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'completed' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {activeTab === 'assigned' ? (
          assignedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xs">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">All routes completed!</h3>
              <p className="text-xs text-slate-500 mt-1">You have no active pickups or deliveries assigned right now.</p>
            </div>
          ) : (
            assignedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {order.orderNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{order.customerName}</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    order.status === 'Out for Delivery' ? 'bg-orange-50 text-orange-700' :
                    order.status === 'Pickup Scheduled' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Customer Contact & Address */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-900">Address:</span>
                      <p className="text-slate-600 mt-0.5">{order.customerAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 pt-1 border-t border-slate-200/60">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${order.customerPhone}`} className="text-indigo-600 font-medium hover:underline">
                      Call {order.customerPhone}
                    </a>
                  </div>
                  <div className="text-slate-600 pt-1 border-t border-slate-200/60">
                    <span className="font-medium">Window:</span> {order.status.includes('Delivery') ? order.deliveryTimeWindow : order.pickupTimeWindow}
                  </div>
                  {order.notes && (
                    <div className="italic text-slate-500 pt-1 border-t border-slate-200/60">
                      Note: {order.notes}
                    </div>
                  )}
                </div>

                {/* Proof of Delivery / Pickup Note */}
                {(order.status === 'Out for Delivery' || order.status === 'Delivered' || order.status === 'Picked Up') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proof of Delivery / Confirmation Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Left with concierge, signed by John"
                      value={proofNotes[order.id] !== undefined ? proofNotes[order.id] : (order.proofOfDelivery || "")}
                      onChange={(e) => setProofNotes({ ...proofNotes, [order.id]: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleStatusAdvance(order)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {order.status === 'Pickup Scheduled' && 'Mark as Picked Up'}
                  {order.status === 'Picked Up' && 'Move to In Process'}
                  {order.status === 'In Process' && 'Mark Ready for Delivery'}
                  {order.status === 'Ready for Delivery' && 'Start Out for Delivery'}
                  {order.status === 'Out for Delivery' && 'Mark as Delivered'}
                  {order.status === 'Delivered' && 'Complete Order'}
                </button>
              </div>
            ))
          )
        ) : (
          completedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xs">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">No completed orders yet</h3>
              <p className="text-xs text-slate-500 mt-1">Orders marked as completed will appear here.</p>
            </div>
          ) : (
            completedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-2 opacity-75">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {order.orderNumber} (Completed)
                  </span>
                  <span className="text-xs text-slate-500">${order.total.toFixed(2)}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{order.customerName}</h4>
                <p className="text-xs text-slate-500">{order.customerAddress}</p>
                {order.proofOfDelivery && (
                  <p className="text-xs bg-slate-50 p-2 rounded-xl text-slate-600 mt-2">
                    ✓ Proof: {order.proofOfDelivery}
                  </p>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
