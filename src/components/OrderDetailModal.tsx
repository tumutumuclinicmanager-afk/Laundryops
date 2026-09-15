import React, { useState } from "react";
import { Order, Driver, OrderStatus, ServiceItem, OrderItem } from "../types";
import {
  Truck,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  Send,
  MessageSquare,
  AlertCircle,
  Edit3,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Printer
} from "lucide-react";

interface OrderDetailModalProps {
  order: Order;
  drivers: Driver[];
  services?: ServiceItem[];
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, driverId?: string, proofOfDelivery?: string) => void;
  onUpdateOrderDetails?: (orderId: string, updatedData: any) => Promise<any>;
  onSendInvoice?: (orderId: string, customMessage?: string) => Promise<boolean>;
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
  services = [],
  onClose,
  onUpdateStatus,
  onUpdateOrderDetails,
  onSendInvoice,
  onOpenPaymentModal,
  onOpenInvoice
}) => {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [driverId, setDriverId] = useState<string>(order.driverId || "");
  const [proof, setProof] = useState<string>(order.proofOfDelivery || "");
  const [deliveryDate, setDeliveryDate] = useState<string>(order.deliveryDate || "");
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState<string>(order.deliveryTimeWindow || "");

  // Pre-delivery invoice sending dialog
  const [showInvoiceDialog, setShowInvoiceDialog] = useState<boolean>(false);
  const [invoiceCustomMessage, setInvoiceCustomMessage] = useState<string>("");
  const [isSendingInvoice, setIsSendingInvoice] = useState<boolean>(false);
  const [invoiceSuccessMessage, setInvoiceSuccessMessage] = useState<string | null>(null);
  const [invoiceErrorMessage, setInvoiceErrorMessage] = useState<string | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState<boolean>(false);

  // Edit Items & Pricing Mode (for facility staff after weighing laundry)
  const [isEditingItems, setIsEditingItems] = useState<boolean>(false);
  const [editableItems, setEditableItems] = useState<OrderItem[]>(
    order.items.map(item => ({ ...item }))
  );
  const [editableDiscount, setEditableDiscount] = useState<number>(order.discount || 0);
  const [isSavingItems, setIsSavingItems] = useState<boolean>(false);
  const [itemSaveSuccess, setItemSaveSuccess] = useState<string | null>(null);

  // General Delivery Update SMS dialog
  const [showSmsDialog, setShowSmsDialog] = useState<boolean>(false);
  const [smsCustomMessage, setSmsCustomMessage] = useState<string>("");
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [smsSuccessMessage, setSmsSuccessMessage] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const assignedDriver = drivers.find(d => d.id === driverId) || (order.driverName ? { name: order.driverName } : null);

  // Generate standard pre-delivery invoice text
  const itemsText = order.items.length > 0
    ? order.items.map(it => `• ${it.serviceName} (${it.quantity} ${it.unit}): KSh ${it.subtotal.toLocaleString()}`).join("\n")
    : "• Pending facility weighing & itemization";

  const defaultInvoiceSmsText = `✨ Sparkle Spins PRE-DELIVERY INVOICE
Order: ${order.orderNumber}
Customer: ${order.customerName}
Delivery: ${order.deliveryDate} (${order.deliveryTimeWindow})
${assignedDriver?.name ? `Assigned Rider: ${assignedDriver.name}` : ""}

Itemized Breakdown:
${itemsText}

Subtotal: KSh ${order.subtotal.toLocaleString()}
${order.discount > 0 ? `Discount: -KSh ${order.discount.toLocaleString()}\n` : ""}TOTAL DUE ON DELIVERY: KSh ${order.total.toLocaleString()}

*Note: Payment is collected on delivery via M-Pesa or Cash, NOT on pickup.
Thank you for choosing Sparkle Spins!`;

  const defaultFormattedSms = `Hello ${order.customerName}, Sparkle Spins update for Order ${order.orderNumber}: Status is '${status}'. Delivery scheduled: ${deliveryDate || order.deliveryDate} (${deliveryTimeWindow || order.deliveryTimeWindow}).${
    assignedDriver?.name ? ` Assigned Rider: ${assignedDriver.name}.` : ""
  }${order.balanceDue > 0 ? ` Total Due on Delivery: KSh ${order.balanceDue.toLocaleString()}.` : ' Status: Paid in full.'} Thank you for choosing Sparkle Spins!`;

  // Handle Saving Status & Driver Changes
  const handleSave = async () => {
    onUpdateStatus(order.id, status, driverId || undefined, proof);
    if (onUpdateOrderDetails && (deliveryDate !== order.deliveryDate || deliveryTimeWindow !== order.deliveryTimeWindow)) {
      await onUpdateOrderDetails(order.id, {
        deliveryDate,
        deliveryTimeWindow,
        status,
        driverId: driverId || "",
        proofOfDelivery: proof
      });
    }
    onClose();
  };

  // Handle Sending Pre-Delivery Invoice to Client
  const handleDispatchInvoice = async () => {
    setIsSendingInvoice(true);
    setInvoiceErrorMessage(null);
    try {
      const message = invoiceCustomMessage.trim() || defaultInvoiceSmsText;
      let success = false;

      if (onSendInvoice) {
        success = await onSendInvoice(order.id, message);
      } else {
        const res = await fetch(`/api/orders/${order.id}/send-invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customMessage: message })
        });
        success = res.ok;
      }

      if (success) {
        setInvoiceSuccessMessage(`Pre-delivery invoice successfully sent to ${order.customerPhone}`);
        setTimeout(() => {
          setShowInvoiceDialog(false);
          setInvoiceSuccessMessage(null);
        }, 2200);
      } else {
        setInvoiceErrorMessage("Failed to dispatch invoice SMS. Please try again.");
      }
    } catch (err: any) {
      setInvoiceErrorMessage(err.message || "Failed to dispatch invoice SMS");
    } finally {
      setIsSendingInvoice(false);
    }
  };

  // Copy invoice text to clipboard
  const handleCopyInvoice = () => {
    const text = invoiceCustomMessage.trim() || defaultInvoiceSmsText;
    navigator.clipboard.writeText(text);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  // WhatsApp share link
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(invoiceCustomMessage.trim() || defaultInvoiceSmsText)}`;

  // Handle general SMS notification
  const handleSendSms = async () => {
    setIsSendingSms(true);
    setSmsError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/send-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customMessage: smsCustomMessage.trim() || defaultFormattedSms
        })
      });

      if (res.ok) {
        setSmsSuccessMessage(`Update SMS dispatched to ${order.customerPhone}`);
        setTimeout(() => {
          setShowSmsDialog(false);
          setSmsSuccessMessage(null);
        }, 2200);
      } else {
        setSmsError("Failed to dispatch SMS notification");
      }
    } catch (err: any) {
      setSmsError(err.message || "Failed to dispatch SMS notification");
    } finally {
      setIsSendingSms(false);
    }
  };

  // Item editing calculations
  const calculateEditedTotals = () => {
    const subtotal = editableItems.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
    const total = Math.max(0, subtotal - Number(editableDiscount));
    return { subtotal, total };
  };

  const { subtotal: editedSubtotal, total: editedTotal } = calculateEditedTotals();

  const handleItemFieldChange = (index: number, field: 'quantity' | 'unitPrice' | 'serviceName' | 'unit', value: any) => {
    const updated = [...editableItems];
    if (field === 'quantity') {
      const qty = Math.max(0.1, Number(value) || 0);
      updated[index].quantity = qty;
      updated[index].subtotal = qty * updated[index].unitPrice;
    } else if (field === 'unitPrice') {
      const price = Math.max(0, Number(value) || 0);
      updated[index].unitPrice = price;
      updated[index].subtotal = updated[index].quantity * price;
    } else {
      updated[index][field] = value;
    }
    setEditableItems(updated);
  };

  const handleAddNewItem = () => {
    const defaultService = services[0];
    setEditableItems([
      ...editableItems,
      {
        serviceId: defaultService?.id || "custom",
        serviceName: defaultService?.name || "Additional Laundry Item",
        unit: defaultService?.unit || "item",
        quantity: 1,
        unitPrice: defaultService?.price || 150,
        subtotal: defaultService?.price || 150
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (editableItems.length <= 1) return;
    setEditableItems(editableItems.filter((_, i) => i !== index));
  };

  const handleSaveItemsAndPricing = async () => {
    if (!onUpdateOrderDetails) {
      setIsEditingItems(false);
      return;
    }
    setIsSavingItems(true);
    setItemSaveSuccess(null);
    try {
      await onUpdateOrderDetails(order.id, {
        items: editableItems,
        discount: editableDiscount
      });
      setItemSaveSuccess("Pricing and items updated! You can now send the updated invoice to the client.");
      setTimeout(() => {
        setIsEditingItems(false);
        setItemSaveSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert("Failed to update items: " + err.message);
    } finally {
      setIsSavingItems(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 max-h-[92vh] overflow-y-auto border border-slate-100">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">Order {order.orderNumber}</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Sparkle Spins
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Created on {new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 pt-5">
          {/* Customer & Address Card */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Customer Details</span>
              <div className="font-extrabold text-slate-900 text-sm">{order.customerName}</div>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold mt-1 inline-flex items-center gap-1"
              >
                <Phone className="w-3 h-3" /> {order.customerPhone}
              </a>
              {order.notes && (
                <p className="text-[11px] text-slate-500 mt-2 bg-white p-2 rounded-lg border border-slate-200">
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pickup / Delivery Address</span>
              <div className="text-xs text-slate-700 font-medium flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{order.customerAddress}</span>
              </div>
            </div>
          </div>

          {/* PRE-DELIVERY INVOICE BANNER (Crucial feature: payment on delivery, send price before delivery) */}
          <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3 ${
            order.invoiceSent
              ? "bg-emerald-50/70 border-emerald-300"
              : "bg-amber-50/80 border-amber-300 shadow-sm"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${order.invoiceSent ? "text-emerald-600" : "text-amber-600"}`} />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Pre-Delivery Invoice to Client
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Payment is on delivery. Client must receive the invoice before rider delivery.
                  </p>
                </div>
              </div>

              {order.invoiceSent ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full self-start sm:self-auto border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Invoice Sent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-200 text-amber-900 px-3 py-1 rounded-full self-start sm:self-auto border border-amber-300 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  Invoice Pending
                </span>
              )}
            </div>

            {order.invoiceSent && order.invoiceSentAt && (
              <p className="text-[11px] text-emerald-800 font-medium bg-white/70 p-2 rounded-xl border border-emerald-200">
                ✓ Itemized price was dispatched to <strong className="text-emerald-950">{order.customerPhone}</strong> on {new Date(order.invoiceSentAt).toLocaleString()}.
              </p>
            )}

            {!order.invoiceSent && (
              <p className="text-xs text-amber-900 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-200">
                {order.items.length === 0 ? (
                  <>
                    ⚠️ The client placed a doorstep pickup order without upfront pricing. <strong>Please click &quot;Weigh / Edit Items &amp; Price&quot; below</strong> to enter the measured weights, services, and final price before dispatching the invoice SMS.
                  </>
                ) : (
                  <>
                    The client placed this order without seeing final prices. Send this invoice now so they inspect their exact bill (Total: <strong>KSh {order.total.toLocaleString()}</strong>) prior to rider arrival.
                  </>
                )}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowInvoiceDialog(prev => !prev)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                {order.invoiceSent ? "Resend / Share Invoice" : "Send Invoice to Client"}
              </button>

              <button
                type="button"
                onClick={() => onOpenInvoice(order)}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                View / Print Formal PDF
              </button>
            </div>
          </div>

          {/* Interactive Invoice Dispatch Modal / Dialog */}
          {showInvoiceDialog && (
            <div className="bg-white rounded-2xl border-2 border-blue-400 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    📱
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Send Pre-Delivery Invoice to Client</h4>
                    <p className="text-[11px] text-slate-500">Recipient: {order.customerName} ({order.customerPhone})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInvoiceDialog(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {invoiceSuccessMessage ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{invoiceSuccessMessage}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Invoice Message Preview (Editable)
                      </label>
                      <button
                        type="button"
                        onClick={() => setInvoiceCustomMessage(defaultInvoiceSmsText)}
                        className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Reset Template
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={invoiceCustomMessage || defaultInvoiceSmsText}
                      onChange={(e) => setInvoiceCustomMessage(e.target.value)}
                      className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 leading-relaxed resize-none"
                    />
                  </div>

                  {invoiceErrorMessage && (
                    <div className="text-xs text-rose-600 flex items-center gap-1.5 p-2 bg-rose-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{invoiceErrorMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyInvoice}
                        className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedInvoice ? "Copied!" : "Copy Text"}
                      </button>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        Share on WhatsApp
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInvoiceDialog(false)}
                        className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSendingInvoice}
                        onClick={handleDispatchInvoice}
                        className="px-4 py-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSendingInvoice ? "Dispatching..." : "Send SMS Invoice to Client"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200/80 p-3.5 rounded-xl bg-slate-50/50">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Pickup Schedule</span>
              <div className="font-bold text-slate-900">{order.pickupDate}</div>
              <div className="text-slate-600 mt-0.5">{order.pickupTimeWindow}</div>
            </div>
            <div className="border border-slate-200/80 p-3.5 rounded-xl bg-slate-50/50">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Delivery Schedule</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800"
                />
                <input
                  type="text"
                  value={deliveryTimeWindow}
                  onChange={(e) => setDeliveryTimeWindow(e.target.value)}
                  placeholder="e.g. 02:00 PM - 04:00 PM"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Items Breakdown & Facility Weighing / Adjusting */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Garment Items & Pricing Breakdown
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isEditingItems ? "Adjust exact measured weights and prices after facility inspection" : "Verified items for this order"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isEditingItems && editableItems.length === 0) {
                    const defaultService = services[0];
                    setEditableItems([
                      {
                        serviceId: defaultService?.id || "custom",
                        serviceName: defaultService?.name || "Wash & Fold (Standard Bag)",
                        unit: defaultService?.unit || "kg",
                        quantity: 1,
                        unitPrice: defaultService?.price || 150,
                        subtotal: defaultService?.price || 150
                      }
                    ]);
                  }
                  setIsEditingItems(prev => !prev);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isEditingItems
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                }`}
              >
                <Edit3 className="w-3 h-3" />
                {isEditingItems ? "Cancel Editing" : "Weigh / Edit Items & Price"}
              </button>
            </div>

            {itemSaveSuccess && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{itemSaveSuccess}</span>
              </div>
            )}

            {isEditingItems ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editableItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-2xs">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Item Name</label>
                        <input
                          type="text"
                          value={item.serviceName}
                          onChange={(e) => handleItemFieldChange(idx, 'serviceName', e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Quantity / Kg</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-center"
                        />
                      </div>

                      <div className="w-20">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 text-center"
                        />
                      </div>

                      <div className="w-28">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Unit Price (KSh)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemFieldChange(idx, 'unitPrice', e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-right"
                        />
                      </div>

                      <div className="w-24 text-right">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Subtotal</label>
                        <span className="text-xs font-extrabold text-blue-700 block py-1.5">
                          KSh {item.subtotal.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={editableItems.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer mt-3 sm:mt-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Discount (KSh):</span>
                      <input
                        type="number"
                        min="0"
                        value={editableDiscount}
                        onChange={(e) => setEditableDiscount(Number(e.target.value) || 0)}
                        className="w-20 text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 text-right"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500">Calculated Total: </span>
                      <strong className="text-sm font-black text-slate-900">KSh {editedTotal.toLocaleString()}</strong>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingItems}
                      onClick={handleSaveItemsAndPricing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingItems ? "Saving..." : "Save Updated Prices"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                      <th className="py-2.5 px-3.5">Service / Garment</th>
                      <th className="py-2.5 px-3 text-center">Qty / Weight</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {order.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-3.5 text-center text-slate-500">
                          <p className="font-bold text-amber-700 mb-1">⚠️ Items pending pickup &amp; weighing</p>
                          <p className="text-[11px] text-slate-500">
                            The customer scheduled a pickup without pricing. Click &quot;Weigh / Edit Items &amp; Price&quot; above to add weighed laundry bags or dry cleaning items.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/40">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">{item.serviceName}</td>
                          <td className="py-2.5 px-3 text-center text-slate-700 font-medium">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">KSh {item.unitPrice.toLocaleString()}</td>
                          <td className="py-2.5 px-3.5 text-right font-black text-slate-900">KSh {item.subtotal.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Price</span>
              <div className="text-2xl font-black text-slate-900">KSh {order.total.toLocaleString()}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Status</span>
              <div className={`text-xs font-bold ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-700'}`}>
                {order.paymentStatus} • Due on Delivery: <strong>KSh {order.balanceDue.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowSmsDialog(prev => !prev)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Send Delivery Status Update SMS"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                Status SMS
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(order);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </div>

          {/* General SMS Dialog */}
          {showSmsDialog && (
            <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Send Status Notification SMS</span>
                </div>
                <span className="text-xs text-slate-500">{order.customerPhone}</span>
              </div>

              {smsSuccessMessage ? (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{smsSuccessMessage}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Status SMS text:</label>
                    <textarea
                      rows={3}
                      value={smsCustomMessage || defaultFormattedSms}
                      onChange={(e) => setSmsCustomMessage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  {smsError && (
                    <div className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{smsError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSmsDialog(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSendingSms}
                      onClick={handleSendSms}
                      className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      {isSendingSms ? "Sending..." : "Send Status SMS"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Workflow & Rider Assignment */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl space-y-4 border border-slate-200/80">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
              Operations & Rider Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Order Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Rider</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Unassigned --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Proof of Delivery / Operational Notes</label>
              <input
                type="text"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="e.g. Received by househelp, left at gate 4, or client verified clothes"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
            >
              Save Workflow Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
