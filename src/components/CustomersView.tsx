import React, { useState } from "react";
import { Customer, Order } from "../types";
import { Users, Search, Plus, Phone, MapPin, Calendar, Package, DollarSign } from "lucide-react";

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  onAddCustomer: (customer: { name: string; phone: string; address: string; notes?: string }) => void;
  onSelectOrder: (order: Order) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  onAddCustomer,
  onSelectOrder
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) return;
    onAddCustomer({ name, phone, address, notes });
    setName("");
    setPhone("");
    setAddress("");
    setNotes("");
    setShowAddModal(false);
  };

  const getCustomerOrders = (customerId: string) => {
    return orders.filter(o => o.customerId === customerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer accounts, service addresses, preferences, and order history.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map(customer => {
          const custOrders = getCustomerOrders(customer.id);
          const totalSpent = custOrders.reduce((sum, o) => sum + o.total, 0);

          return (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{customer.name}</h3>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {customer.phone}
                    </p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {custOrders.length} {custOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{customer.address}</span>
                  </div>
                  {customer.notes && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 italic">
                      "{customer.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Lifetime Total:</span>
                <span className="font-bold text-slate-900">${totalSpent.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Customer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Address</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, apartment, gate code..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Preferences / Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Eco-friendly detergent, fragile items"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details & History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                <p className="text-sm text-indigo-600 font-medium mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Address</span>
                <p className="text-sm text-slate-800">{selectedCustomer.address}</p>
                {selectedCustomer.notes && (
                  <p className="text-xs text-slate-600 italic mt-1">Note: {selectedCustomer.notes}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Order History</h3>
                <div className="space-y-2">
                  {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-xl">No orders recorded yet.</p>
                  ) : (
                    getCustomerOrders(selectedCustomer.id).map(order => (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedCustomer(null);
                          onSelectOrder(order);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-indigo-600">{order.orderNumber}</span>
                            <span className="text-xs text-slate-500">{order.pickupDate}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{order.items.length} items • ${order.total.toFixed(2)}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          order.status === 'Completed' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
