import React, { useState } from "react";
import { Customer, Driver, ServiceItem, OrderItem } from "../types";
import { Plus, Trash2, Calendar, User, Truck, DollarSign } from "lucide-react";

interface CreateOrderModalProps {
  customers: Customer[];
  drivers: Driver[];
  services: ServiceItem[];
  onClose: () => void;
  onSaveOrder: (orderData: any) => void;
  onAddCustomerInline: (customer: { name: string; phone: string; address: string }) => Promise<Customer>;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  customers,
  drivers,
  services,
  onClose,
  onSaveOrder,
  onAddCustomerInline
}) => {
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  
  // New customer fields
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split("T")[0]);
  const [pickupTimeWindow, setPickupTimeWindow] = useState("09:00 AM - 11:00 AM");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState("02:00 PM - 04:00 PM");
  const [driverId, setDriverId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");

  // Order items selected
  const [selectedItems, setSelectedItems] = useState<Array<{ serviceId: string; quantity: number }>>([
    { serviceId: services[0]?.id || "", quantity: 5 }
  ]);

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { serviceId: services[0]?.id || "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'serviceId' | 'quantity', value: any) => {
    const updated = [...selectedItems];
    if (field === 'quantity') {
      updated[index].quantity = Math.max(0.1, Number(value));
    } else {
      updated[index].serviceId = value;
    }
    setSelectedItems(updated);
  };

  // Calculate Subtotal & Total
  const subtotal = selectedItems.reduce((sum, item) => {
    const s = services.find(serv => serv.id === item.serviceId);
    return sum + (s ? s.price * item.quantity : 0);
  }, 0);

  const total = Math.max(0, subtotal - Number(discount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let custId = selectedCustomerId;

    if (isNewCustomer) {
      if (!newCustName || !newCustPhone || !newCustAddress) {
        alert("Please fill in all new customer details.");
        return;
      }
      const created = await onAddCustomerInline({
        name: newCustName,
        phone: newCustPhone,
        address: newCustAddress
      });
      custId = created.id;
    }

    if (!custId) {
      alert("Please select or add a customer.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please add at least one service item.");
      return;
    }

    onSaveOrder({
      customerId: custId,
      pickupDate,
      pickupTimeWindow,
      deliveryDate,
      deliveryTimeWindow,
      driverId: driverId || undefined,
      items: selectedItems,
      discount: Number(discount),
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Create New Laundry Order / Pickup</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Information</label>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                {isNewCustomer ? "← Select Existing Customer" : "+ Add New Customer"}
              </button>
            </div>

            {isNewCustomer ? (
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Rachel Green"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup / Delivery Address</label>
                  <textarea
                    required
                    rows={2}
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Street, apartment, buzzer code..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone} ({c.address})</option>
                ))}
              </select>
            )}
          </div>

          {/* Schedule & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pickup Window</span>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                <select
                  value={pickupTimeWindow}
                  onChange={(e) => setPickupTimeWindow(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                  <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery Window</span>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                <select
                  value={deliveryTimeWindow}
                  onChange={(e) => setDeliveryTimeWindow(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                  <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assign Driver */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Assign Driver (Optional)</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
            >
              <option value="">-- Unassigned (Assign Later) --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
              ))}
            </select>
          </div>

          {/* Services & Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Services & Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service Item
              </button>
            </div>

            <div className="space-y-2">
              {selectedItems.map((item, index) => {
                const sItem = services.find(s => s.id === item.serviceId);
                const itemTotal = sItem ? sItem.price * item.quantity : 0;

                return (
                  <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                    <select
                      value={item.serviceId}
                      onChange={(e) => handleItemChange(index, 'serviceId', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} (KSh {s.price.toLocaleString()} / {s.unit})
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-center"
                      />
                    </div>

                    <div className="w-28 text-right font-semibold text-sm text-slate-900">
                      KSh {itemTotal.toLocaleString()}
                    </div>

                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">KSh {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Discount (KSh):</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-sm"
              />
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-200">
              <span>Total Due:</span>
              <span className="text-indigo-600">KSh {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Order Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Special Instructions / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave with concierge, extra fabric softener"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              Create Order & Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
