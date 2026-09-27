import React, { useState, useEffect } from "react";
import { Order, Driver, OrderStatus, ServiceItem, OrderItem } from "../types";
import { generateWhatsAppMessage, openWhatsAppChat } from "../utils/whatsapp";
import {
  generateOrderConfirmationEmail,
  generateStatusUpdateEmail,
  DEFAULT_COMPANY
} from "../utils/emailTemplates";
import {
  Truck,
  Phone,
  Mail,
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
  Printer,
  Inbox,
  Eye,
  RefreshCw,
  Scale
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
  const [activeOrder, setActiveOrder] = useState<Order>(order);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [driverId, setDriverId] = useState<string>(order.driverId || "");
  const [proof, setProof] = useState<string>(order.proofOfDelivery || "");
  const [deliveryDate, setDeliveryDate] = useState<string>(order.deliveryDate || "");
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState<string>(order.deliveryTimeWindow || "");

  // Edit Items & Pricing Mode (for facility staff after weighing laundry)
  const [isEditingItems, setIsEditingItems] = useState<boolean>(false);
  const [editableItems, setEditableItems] = useState<OrderItem[]>(
    order.items && order.items.length > 0 ? order.items.map(item => ({ ...item })) : []
  );
  const [editableDiscount, setEditableDiscount] = useState<number>(order.discount || 0);
  const [isSavingItems, setIsSavingItems] = useState<boolean>(false);
  const [itemSaveSuccess, setItemSaveSuccess] = useState<string | null>(null);

  // Pre-delivery invoice sending dialog
  const [showInvoiceDialog, setShowInvoiceDialog] = useState<boolean>(false);
  const [invoiceCustomMessage, setInvoiceCustomMessage] = useState<string>("");
  const [isSendingInvoice, setIsSendingInvoice] = useState<boolean>(false);
  const [invoiceSuccessMessage, setInvoiceSuccessMessage] = useState<string | null>(null);
  const [invoiceErrorMessage, setInvoiceErrorMessage] = useState<string | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState<boolean>(false);

  // Sync state when order prop updates
  useEffect(() => {
    setActiveOrder(order);
    setStatus(order.status);
    setDriverId(order.driverId || "");
    setProof(order.proofOfDelivery || "");
    setDeliveryDate(order.deliveryDate || "");
    setDeliveryTimeWindow(order.deliveryTimeWindow || "");
    setEditableItems(order.items && order.items.length > 0 ? order.items.map(it => ({ ...it })) : []);
    setEditableDiscount(order.discount || 0);
  }, [order]);

  // General Delivery Update SMS dialog
  const [showSmsDialog, setShowSmsDialog] = useState<boolean>(false);
  const [smsCustomMessage, setSmsCustomMessage] = useState<string>("");
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [smsSuccessMessage, setSmsSuccessMessage] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  // Email Notification Dialog state
  const [showEmailDialog, setShowEmailDialog] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>(order.customerEmail || "");
  const [emailType, setEmailType] = useState<'order_confirmation' | 'status_update' | 'invoice' | 'custom'>('order_confirmation');
  const [emailCustomSubject, setEmailCustomSubject] = useState<string>("");
  const [emailCustomNote, setEmailCustomNote] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Customer email editing
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [tempEmail, setTempEmail] = useState<string>(order.customerEmail || "");

  const assignedDriver = drivers.find(d => d.id === driverId) || (activeOrder.driverName ? { name: activeOrder.driverName } : null);

  // WhatsApp notification state (auto-placed when status changes to Ready for Delivery)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState<boolean>(order.status === 'Ready for Delivery');
  const [whatsappMessage, setWhatsappMessage] = useState<string>(
    generateWhatsAppMessage(activeOrder, activeOrder.status, assignedDriver?.name)
  );
  const [whatsappSentSuccess, setWhatsappSentSuccess] = useState<boolean>(false);

  const handleStatusChange = (newStatus: OrderStatus) => {
    setStatus(newStatus);
    const msg = generateWhatsAppMessage(activeOrder, newStatus, assignedDriver?.name);
    setWhatsappMessage(msg);
    if (newStatus === 'Ready for Delivery') {
      setShowWhatsAppDialog(true);
    }
  };

  // Generate standard pre-delivery invoice text
  const itemsText = activeOrder.items && activeOrder.items.length > 0
    ? activeOrder.items.map(it => `• ${it.serviceName} (${it.quantity} ${it.unit}): KSh ${it.subtotal.toLocaleString()}`).join("\n")
    : "• Pending facility weighing & itemization";

  const defaultInvoiceSmsText = `✨ Sparkle Spins PRE-DELIVERY INVOICE
Order: ${activeOrder.orderNumber}
Customer: ${activeOrder.customerName}
Delivery: ${activeOrder.deliveryDate} (${activeOrder.deliveryTimeWindow})
${assignedDriver?.name ? `Assigned Rider: ${assignedDriver.name}` : ""}

Itemized Breakdown:
${itemsText}

Subtotal: KSh ${activeOrder.subtotal.toLocaleString()}
${activeOrder.discount > 0 ? `Discount: -KSh ${activeOrder.discount.toLocaleString()}\n` : ""}TOTAL DUE ON DELIVERY: KSh ${activeOrder.total.toLocaleString()}

*Note: Payment is collected on delivery via M-Pesa or Cash, NOT on pickup.
Thank you for choosing Sparkle Spins!`;

  const defaultFormattedSms = `Hello ${activeOrder.customerName}, Sparkle Spins update for Order ${activeOrder.orderNumber}: Status is '${status}'. Delivery scheduled: ${deliveryDate || activeOrder.deliveryDate} (${deliveryTimeWindow || activeOrder.deliveryTimeWindow}).${
    assignedDriver?.name ? ` Assigned Rider: ${assignedDriver.name}.` : ""
  }${activeOrder.balanceDue > 0 ? ` Total Due on Delivery: KSh ${activeOrder.balanceDue.toLocaleString()}.` : ' Status: Paid in full.'} Thank you for choosing Sparkle Spins!`;

  // Handle Saving Status & Driver Changes
  const handleSave = async () => {
    onUpdateStatus(activeOrder.id, status, driverId || undefined, proof);
    if (onUpdateOrderDetails && (deliveryDate !== activeOrder.deliveryDate || deliveryTimeWindow !== activeOrder.deliveryTimeWindow)) {
      await onUpdateOrderDetails(activeOrder.id, {
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
        success = await onSendInvoice(activeOrder.id, message);
      } else {
        const res = await fetch(`/api/orders/${activeOrder.id}/send-invoice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customMessage: message })
        });
        success = res.ok;
      }

      if (success) {
        setInvoiceSuccessMessage(`Pre-delivery invoice successfully sent to ${activeOrder.customerPhone}`);
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
  const cleanPhone = activeOrder.customerPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(invoiceCustomMessage.trim() || defaultInvoiceSmsText)}`;

  // Handle email notification dispatch
  const handleSendOrderEmail = async () => {
    if (!emailRecipient.trim()) {
      setEmailErrorMessage("Please provide a recipient email address.");
      return;
    }
    setIsSendingEmail(true);
    setEmailErrorMessage(null);
    setEmailSuccessMessage(null);

    try {
      const res = await fetch("/api/notifications/send-order-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.id,
          type: emailType,
          recipientEmail: emailRecipient.trim(),
          customSubject: emailCustomSubject.trim() || undefined,
          customNote: emailCustomNote.trim() || undefined,
          sendAdminCopy: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch email notification");
      }

      if (data.order) {
        setActiveOrder(data.order);
      }

      setEmailSuccessMessage(`✨ Order notification email successfully dispatched to ${emailRecipient.trim()}`);
      setTimeout(() => {
        setEmailSuccessMessage(null);
        setShowEmailDialog(false);
      }, 2500);
    } catch (err: any) {
      setEmailErrorMessage(err.message || "Failed to dispatch email notification");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // General Delivery Update SMS dialog
  const handleSendSms = async () => {
    setIsSendingSms(true);
    setSmsError(null);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/send-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customMessage: smsCustomMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch SMS");
      }

      setSmsSuccessMessage(`SMS successfully dispatched to ${activeOrder.customerPhone}`);
      setTimeout(() => {
        setShowSmsDialog(false);
        setSmsSuccessMessage(null);
      }, 2200);
    } catch (err: any) {
      setSmsError(err.message || "Failed to dispatch status SMS");
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleSaveCustomerEmail = async () => {
    if (onUpdateOrderDetails) {
      await onUpdateOrderDetails(activeOrder.id, {
        customerEmail: tempEmail.trim()
      });
      setActiveOrder(prev => ({ ...prev, customerEmail: tempEmail.trim() }));
      setEmailRecipient(tempEmail.trim());
      setIsEditingEmail(false);
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
      const qty = Math.max(0.01, Number(value) || 0);
      updated[index].quantity = qty;
      updated[index].subtotal = Math.round(qty * updated[index].unitPrice);
    } else if (field === 'unitPrice') {
      const price = Math.max(0, Number(value) || 0);
      updated[index].unitPrice = price;
      updated[index].subtotal = Math.round(updated[index].quantity * price);
    } else {
      updated[index][field] = value;
    }
    setEditableItems(updated);
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    const matched = services.find(s => s.id === serviceId);
    if (!matched) return;
    const updated = [...editableItems];
    updated[index].serviceId = matched.id;
    updated[index].serviceName = matched.name;
    updated[index].unit = matched.unit;
    updated[index].unitPrice = matched.price;
    updated[index].subtotal = Math.round(updated[index].quantity * matched.price);
    setEditableItems(updated);
  };

  const handleAddWeight = (index: number, delta: number) => {
    const updated = [...editableItems];
    const currentQty = Number(updated[index].quantity) || 0;
    const newQty = Math.max(0.1, Math.round((currentQty + delta) * 10) / 10);
    updated[index].quantity = newQty;
    updated[index].subtotal = Math.round(newQty * updated[index].unitPrice);
    setEditableItems(updated);
  };

  const handleAddNewItem = () => {
    const defaultService = services[0];
    setEditableItems([
      ...editableItems,
      {
        serviceId: defaultService?.id || "custom",
        serviceName: defaultService?.name || "Wash & Fold (Standard Bag)",
        unit: defaultService?.unit || "kg",
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
    const subtotal = editableItems.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
    const discount = Number(editableDiscount) || 0;
    const total = Math.max(0, subtotal - discount);
    const amountPaid = activeOrder.amountPaid || 0;
    const balanceDue = Math.max(0, total - amountPaid);
    let paymentStatus: 'Unpaid' | 'Partial' | 'Paid' = "Unpaid";
    if (balanceDue === 0 && total > 0 && amountPaid >= total) {
      paymentStatus = "Paid";
    } else if (amountPaid > 0) {
      paymentStatus = "Partial";
    }

    const locallyUpdated: Order = {
      ...activeOrder,
      items: editableItems,
      subtotal,
      discount,
      total,
      balanceDue,
      paymentStatus,
      updatedAt: new Date().toISOString()
    };

    setActiveOrder(locallyUpdated);
    setWhatsappMessage(generateWhatsAppMessage(locallyUpdated, status, assignedDriver?.name));

    if (!onUpdateOrderDetails) {
      setIsEditingItems(false);
      return;
    }

    setIsSavingItems(true);
    setItemSaveSuccess(null);
    try {
      const savedResult = await onUpdateOrderDetails(activeOrder.id, {
        items: editableItems,
        discount: editableDiscount
      });
      if (savedResult) {
        setActiveOrder(savedResult);
      }
      setItemSaveSuccess("Pricing and items successfully updated! You can now send the updated pre-delivery invoice.");
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
              <div className="font-extrabold text-slate-900 text-sm">{activeOrder.customerName}</div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <a
                  href={`tel:${activeOrder.customerPhone}`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> {activeOrder.customerPhone}
                </a>

                {isEditingEmail ? (
                  <div className="flex items-center gap-1 mt-1 w-full">
                    <input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      placeholder="customer@email.com"
                      className="text-xs px-2 py-1 bg-white border border-slate-300 rounded-lg flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomerEmail}
                      className="text-[10px] bg-blue-600 text-white font-bold px-2 py-1 rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(false)}
                      className="text-[10px] text-slate-500 hover:bg-slate-200 px-2 py-1 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{activeOrder.customerEmail || <span className="text-slate-400 italic">No email saved</span>}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempEmail(activeOrder.customerEmail || "");
                        setIsEditingEmail(true);
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-semibold ml-1 cursor-pointer"
                    >
                      {activeOrder.customerEmail ? "Edit" : "+ Add"}
                    </button>
                  </div>
                )}
              </div>

              {activeOrder.notes && (
                <p className="text-[11px] text-slate-500 mt-2 bg-white p-2 rounded-lg border border-slate-200">
                  <strong>Notes:</strong> {activeOrder.notes}
                </p>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pickup / Delivery Address</span>
              <div className="text-xs text-slate-700 font-medium flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{activeOrder.customerAddress}</span>
              </div>
            </div>
          </div>

          {/* Dedicated Order Email Notification Center */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-blue-50/70 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Order Email Notification Hub
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Send automated or custom confirmation, status updates & receipts to client & ops.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeOrder.emailSent ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Email Dispatched
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Pending Dispatch
                  </span>
                )}
              </div>
            </div>

            {activeOrder.emailSentAt && (
              <div className="text-[11px] text-indigo-900 font-medium bg-white/80 p-2 rounded-xl border border-indigo-100 flex items-center justify-between">
                <span>✓ Last notification sent on {new Date(activeOrder.emailSentAt).toLocaleString()}</span>
                {activeOrder.emailHistory && activeOrder.emailHistory.length > 0 && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {activeOrder.emailHistory.length} notification(s) logged
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEmailType("order_confirmation");
                  setEmailRecipient(activeOrder.customerEmail || "");
                  setShowEmailDialog(prev => !prev);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-indigo-200" />
                <span>{showEmailDialog ? "Close Email Panel" : "Dispatch Email Notification"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailType("status_update");
                  setEmailRecipient(activeOrder.customerEmail || "");
                  setShowEmailDialog(true);
                }}
                className="bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Send Status Update Email</span>
              </button>
            </div>
          </div>

          {/* Interactive Email Dispatch Dialog */}
          {showEmailDialog && (
            <div className="bg-white rounded-2xl border-2 border-indigo-500 p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    ✉️
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Send Order Email Notification</h4>
                    <p className="text-[11px] text-slate-500">To: {activeOrder.customerName} (#{activeOrder.orderNumber})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailDialog(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {emailSuccessMessage ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{emailSuccessMessage}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Notification Type Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Notification Template</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setEmailType('order_confirmation')}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                          emailType === 'order_confirmation'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[10px] opacity-80 uppercase">Template 1</div>
                        <div>Order Confirmation</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEmailType('status_update')}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                          emailType === 'status_update'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[10px] opacity-80 uppercase">Template 2</div>
                        <div>Status Update ({status})</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEmailType('invoice')}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                          emailType === 'invoice'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[10px] opacity-80 uppercase">Template 3</div>
                        <div>Official Invoice</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEmailType('custom')}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                          emailType === 'custom'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-[10px] opacity-80 uppercase">Template 4</div>
                        <div>Custom Notice</div>
                      </button>
                    </div>
                  </div>

                  {/* Recipient Email Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Recipient Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                        placeholder="e.g. customer@domain.com"
                        className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Custom Note or Subject */}
                  {emailType === 'status_update' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Optional Status Note / Rider Message</label>
                      <input
                        type="text"
                        value={emailCustomNote}
                        onChange={(e) => setEmailCustomNote(e.target.value)}
                        placeholder="e.g. Clothes are freshly folded and rider Samuel is en route."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800"
                      />
                    </div>
                  )}

                  {emailType === 'custom' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Custom Email Message Body</label>
                      <textarea
                        rows={4}
                        value={emailCustomNote}
                        onChange={(e) => setEmailCustomNote(e.target.value)}
                        placeholder="Type custom notification to client..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800"
                      />
                    </div>
                  )}

                  {emailErrorMessage && (
                    <div className="text-xs text-rose-600 flex items-center gap-1.5 p-2 bg-rose-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{emailErrorMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(!showPreviewModal)}
                      className="px-3 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl flex items-center gap-1.5 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showPreviewModal ? "Hide Live Template Preview" : "Preview HTML Template"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEmailDialog(false)}
                        className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSendingEmail}
                        onClick={handleSendOrderEmail}
                        className="px-4 py-2 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSendingEmail ? "Dispatching Email..." : "Send Email Notification"}
                      </button>
                    </div>
                  </div>

                  {/* Live HTML Preview Box */}
                  {showPreviewModal && (
                    <div className="mt-3 p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Live Email Render Preview</span>
                        <span className="text-indigo-600 font-mono">Sparkle Spins Template</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 max-h-64 overflow-y-auto text-xs space-y-2 text-slate-800">
                        <div className="font-bold text-indigo-700">Subject: {
                          emailType === 'order_confirmation'
                            ? `✨ Order Confirmation #${activeOrder.orderNumber} - Sparkle Spins Laundry`
                            : emailType === 'status_update'
                            ? `👕 Order Update: #${activeOrder.orderNumber} is now ${status}`
                            : `🧾 Official Invoice: #${activeOrder.orderNumber}`
                        }</div>
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-700 space-y-1">
                          <p><strong>To:</strong> {emailRecipient || 'customer@example.com'}</p>
                          <p><strong>Order Ref:</strong> {activeOrder.orderNumber}</p>
                          <p><strong>Scheduled Pickup:</strong> {activeOrder.pickupDate} ({activeOrder.pickupTimeWindow})</p>
                          <p><strong>Estimated Delivery:</strong> {activeOrder.deliveryDate} ({activeOrder.deliveryTimeWindow})</p>
                          <p><strong>Total Due:</strong> KES {activeOrder.total.toLocaleString()} (Pay on delivery)</p>
                          {emailCustomNote && <p className="text-indigo-600"><strong>Note:</strong> {emailCustomNote}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

              {activeOrder.invoiceSent ? (
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

            {activeOrder.invoiceSent && activeOrder.invoiceSentAt && (
              <p className="text-[11px] text-emerald-800 font-medium bg-white/70 p-2 rounded-xl border border-emerald-200">
                ✓ Itemized price was dispatched to <strong className="text-emerald-950">{activeOrder.customerPhone}</strong> on {new Date(activeOrder.invoiceSentAt).toLocaleString()}.
              </p>
            )}

            {!activeOrder.invoiceSent && (
              <p className="text-xs text-amber-900 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-200">
                {activeOrder.items && activeOrder.items.length === 0 ? (
                  <>
                    ⚠️ The client placed a doorstep pickup order without upfront pricing. <strong>Please click &quot;Weigh / Edit Items &amp; Price&quot; below</strong> to enter the measured weights, services, and final price before dispatching the invoice SMS.
                  </>
                ) : (
                  <>
                    The client placed this order without seeing final prices. Send this invoice now so they inspect their exact bill (Total: <strong>KSh {activeOrder.total.toLocaleString()}</strong>) prior to rider arrival.
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
                {activeOrder.invoiceSent ? "Resend / Share Invoice" : "Send Invoice to Client"}
              </button>

              <button
                type="button"
                onClick={() => onOpenInvoice(activeOrder)}
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
              <div className="font-bold text-slate-900">{activeOrder.pickupDate}</div>
              <div className="text-slate-600 mt-0.5">{activeOrder.pickupTimeWindow}</div>
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
              <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>Facility Laundry Weighing & Itemization Station</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Pick catalog service or type custom items</span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {editableItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        {/* Service catalog picker / Name */}
                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                            Service / Garment Type
                          </label>
                          {services.length > 0 && (
                            <select
                              value={item.serviceId}
                              onChange={(e) => handleServiceSelect(idx, e.target.value)}
                              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 mb-1.5 focus:bg-white"
                            >
                              <option value="custom">-- Select Catalog Service --</option>
                              {services.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.unit}) - KSh {s.price.toLocaleString()}
                                </option>
                              ))}
                            </select>
                          )}
                          <input
                            type="text"
                            value={item.serviceName}
                            onChange={(e) => handleItemFieldChange(idx, 'serviceName', e.target.value)}
                            placeholder="Item description"
                            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:bg-white"
                          />
                        </div>

                        {/* Quantity / Measured Weight */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                            Weight / Qty ({item.unit})
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                            className="w-full text-xs font-black bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-center focus:bg-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Unit Price (KSh)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemFieldChange(idx, 'unitPrice', e.target.value)}
                            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-right focus:bg-white"
                          />
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="sm:col-span-2 flex items-center justify-between gap-1">
                          <div className="text-right flex-1">
                            <span className="text-[10px] font-bold text-slate-400 block">Subtotal</span>
                            <span className="text-xs font-black text-indigo-700">
                              KSh {item.subtotal.toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={editableItems.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                            title="Remove line item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Weight Adjuster Presets */}
                      <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Quick Weight Scale (Kg):
                        </span>
                        {[0.5, 1, 2, 3, 5, 8, 10].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => handleItemFieldChange(idx, 'quantity', w)}
                            className="text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            {w} kg
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddWeight(idx, 0.5)}
                          className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md cursor-pointer ml-auto"
                        >
                          +0.5 kg
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddWeight(idx, 1.0)}
                          className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md cursor-pointer"
                        >
                          +1.0 kg
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white border border-indigo-200 hover:bg-indigo-50 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Laundry / Garment Item
                  </button>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 font-bold">Discount (KSh):</span>
                      <input
                        type="number"
                        min="0"
                        value={editableDiscount}
                        onChange={(e) => setEditableDiscount(Number(e.target.value) || 0)}
                        className="w-20 text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 text-right focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                      <span className="text-slate-600 text-xs font-medium">Recalculated Total: </span>
                      <strong className="text-sm font-black text-indigo-900">KSh {editedTotal.toLocaleString()}</strong>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingItems}
                      onClick={handleSaveItemsAndPricing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSavingItems ? "Saving Prices..." : "Save Updated Prices"}</span>
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
                    {activeOrder.items && activeOrder.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-3.5 text-center text-slate-500">
                          <p className="font-bold text-amber-700 mb-1">⚠️ Items pending pickup &amp; weighing</p>
                          <p className="text-[11px] text-slate-500">
                            The customer scheduled a pickup without pricing. Click &quot;Weigh / Edit Items &amp; Price&quot; above to add weighed laundry bags or dry cleaning items.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      (activeOrder.items || []).map((item, idx) => (
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
              <div className="text-2xl font-black text-slate-900">KSh {activeOrder.total.toLocaleString()}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Status</span>
              <div className={`text-xs font-bold ${activeOrder.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-700'}`}>
                {activeOrder.paymentStatus} • Due on Delivery: <strong>KSh {activeOrder.balanceDue.toLocaleString()}</strong>
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
                type="button"
                onClick={() => setShowWhatsAppDialog(prev => !prev)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Send WhatsApp Notification"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                WhatsApp
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(activeOrder);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </div>

          {/* WhatsApp Notification Dialog */}
          {showWhatsAppDialog && (
            <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <span className="text-base">🟢</span>
                  <span>WhatsApp Notification (Ready for Delivery / Status Update)</span>
                </div>
                <span className="text-xs text-slate-500">{order.customerPhone}</span>
              </div>

              {whatsappSentSuccess ? (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp message successfully dispatched / opened for {order.customerName}!</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                      Pre-composed WhatsApp Template (Auto-placed when status is Ready for Delivery):
                    </label>
                    <textarea
                      rows={5}
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      className="w-full text-xs font-mono p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppDialog(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openWhatsAppChat(order.customerPhone, whatsappMessage);
                        setWhatsappSentSuccess(true);
                        setTimeout(() => {
                          setShowWhatsAppDialog(false);
                          setWhatsappSentSuccess(false);
                        }, 2000);
                      }}
                      className="px-4 py-2 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Press to Send WhatsApp Message
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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
                  onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
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
