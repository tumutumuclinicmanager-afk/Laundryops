import React, { useState, useEffect, useMemo } from "react";
import { Customer, Driver, ServiceItem, Order, Payment, Stats, Reports, OrderStatus, Review } from "./types";
import {
  initialCustomers,
  initialDrivers,
  initialServices,
  initialOrders,
  initialPayments,
  initialReviews,
  computeStats,
  computeReports
} from "./initialData";
import { Dashboard } from "./components/Dashboard";
import { OrdersView } from "./components/OrdersView";
import { CustomersView } from "./components/CustomersView";
import { FinancialsView } from "./components/FinancialsView";
import { DriverView } from "./components/DriverView";
import { SettingsView } from "./components/SettingsView";
import { CreateOrderModal } from "./components/CreateOrderModal";
import { RecordPaymentModal } from "./components/RecordPaymentModal";
import { InvoiceModal } from "./components/InvoiceModal";
import { OrderDetailModal } from "./components/OrderDetailModal";
import { LoginScreen } from "./components/LoginScreen";
import { CustomerPage } from "./components/CustomerPage";
import { CustomerLandingPage } from "./components/CustomerLandingPage";
import { saveOrderToFirestore, saveReviewToFirestore, savePaymentToFirestore, updateOrderStatusInFirestore } from "./firebase";
import { Truck, Package, Users, DollarSign, Settings, LayoutDashboard, Smartphone, Plus, ShieldCheck, LogOut, User, Globe } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ role: 'admin' | 'driver'; username: string; name: string; driverId?: string } | null>(null);
  const [publicScreen, setPublicScreen] = useState<'customer' | 'login'>('customer');
  const [viewingCustomerPage, setViewingCustomerPage] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'financials' | 'driver' | 'settings'>('dashboard');
  const [viewMode, setViewMode] = useState<'admin' | 'driver'>('admin');

  // App data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Reports | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);

  // Dynamic statistics fallback so Dashboard and Financials never stall
  const effectiveStats: Stats = useMemo(() => {
    if (stats) return stats;
    return computeStats(orders, payments);
  }, [stats, orders, payments]);

  const effectiveReports: Reports = useMemo(() => {
    if (reports) return reports;
    return computeReports(orders, payments, customers.length);
  }, [reports, orders, payments, customers.length]);

  // Modals state
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  const fetchData = async () => {
    try {
      const safeFetch = async (url: string, fallback: any) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return fallback;
          const text = await r.text();
          return JSON.parse(text);
        } catch {
          return fallback;
        }
      };

      const [statsRes, reportsRes, customersRes, driversRes, servicesRes, ordersRes, paymentsRes, reviewsRes] = await Promise.all([
        safeFetch("/api/stats", null),
        safeFetch("/api/reports", null),
        safeFetch("/api/customers", null),
        safeFetch("/api/drivers", null),
        safeFetch("/api/services", null),
        safeFetch("/api/orders", null),
        safeFetch("/api/payments", null),
        safeFetch("/api/reviews", null)
      ]);

      if (statsRes) setStats(statsRes);
      if (reportsRes) setReports(reportsRes);
      if (Array.isArray(customersRes) && customersRes.length > 0) setCustomers(customersRes);
      if (Array.isArray(driversRes) && driversRes.length > 0) setDrivers(driversRes);
      if (Array.isArray(servicesRes) && servicesRes.length > 0) setServices(servicesRes);
      if (Array.isArray(ordersRes) && ordersRes.length > 0) setOrders(ordersRes);
      if (Array.isArray(paymentsRes) && paymentsRes.length > 0) setPayments(paymentsRes);
      if (Array.isArray(reviewsRes) && reviewsRes.length > 0) setReviews(reviewsRes);
    } catch (e) {
      console.warn("Backend data fetch note:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleSaveOrder = async (orderData: any) => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setShowNewOrderModal(false);
        fetchData();
        return;
      }
    } catch (e) {
      console.warn("[Orders] API save order failed, attempting direct fallback:", e);
    }

    // Direct Firestore fallback
    try {
      const newOrd: Order = {
        id: "ord_" + Date.now(),
        orderNumber: "ORD-" + Math.floor(100 + Math.random() * 900),
        customerId: orderData.customerId || "c_" + Date.now(),
        customerName: orderData.customerName || "Customer",
        customerPhone: orderData.customerPhone || "",
        customerAddress: orderData.customerAddress || "",
        status: "New",
        pickupDate: orderData.pickupDate || new Date().toISOString().split("T")[0],
        pickupTimeWindow: orderData.pickupTimeWindow || "09:00 AM - 11:00 AM",
        deliveryDate: orderData.deliveryDate || new Date().toISOString().split("T")[0],
        deliveryTimeWindow: orderData.deliveryTimeWindow || "02:00 PM - 04:00 PM",
        driverId: orderData.driverId || "",
        driverName: orderData.driverName || "",
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        discount: orderData.discount || 0,
        total: orderData.total || 0,
        paymentStatus: "Unpaid",
        amountPaid: 0,
        balanceDue: orderData.total || 0,
        notes: orderData.notes || "",
        invoiceSent: false,
        invoiceSentAt: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveOrderToFirestore(newOrd);
      setOrders(prev => [newOrd, ...prev.filter(o => o.id !== newOrd.id)]);
      setShowNewOrderModal(false);
      fetchData();
    } catch (fallbackErr) {
      console.error("Direct order save failed:", fallbackErr);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, driverId?: string, proofOfDelivery?: string) => {
    let apiSuccess = false;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, driverId, proofOfDelivery })
      });
      if (res.ok) {
        apiSuccess = true;
        fetchData();
        if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
          const updated = await res.json();
          setSelectedOrderForDetail(updated);
        }
      } else {
        console.warn("[Orders] API returned non-ok status for status update, attempting direct Firestore save fallback.");
      }
    } catch (e) {
      console.warn("[Orders] API status update failed, attempting direct Firestore save fallback:", e);
    }

    if (!apiSuccess) {
      try {
        const saved = await updateOrderStatusInFirestore(orderId, status, driverId, proofOfDelivery);
        if (saved) {
          // Immediately update local React state to make the UI update seamlessly
          setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
              const updatedOrder: Order = {
                ...o,
                status,
                updatedAt: new Date().toISOString()
              };
              if (proofOfDelivery !== undefined) {
                updatedOrder.proofOfDelivery = proofOfDelivery;
              }
              if (driverId !== undefined) {
                updatedOrder.driverId = driverId || "";
                if (driverId) {
                  const d = drivers.find(dr => dr.id === driverId);
                  updatedOrder.driverName = d ? d.name : "";
                } else {
                  updatedOrder.driverName = "";
                }
              }

              if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
                setSelectedOrderForDetail(updatedOrder);
              }
              return updatedOrder;
            }
            return o;
          }));
          fetchData();
        } else {
          alert("Failed to update status in Firestore. Please check your connection.");
        }
      } catch (fallbackErr) {
        console.error("Direct order status update fallback failed:", fallbackErr);
        alert("An error occurred while attempting to update the order status.");
      }
    }
  };

  const handleAddCustomer = async (custData: { name: string; phone: string; address: string; notes?: string }) => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custData)
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error("Failed to add customer", e);
    }
  };

  const handleAddCustomerInline = async (custData: { name: string; phone: string; address: string }) => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(custData)
    });
    const newCust = await res.json();
    fetchData();
    return newCust;
  };

  const handleAddService = async (serviceData: any) => {
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData)
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Failed to add service", e);
    }
  };

  const handleAddDriver = async (driverData: any) => {
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverData)
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Failed to add driver", e);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm("Are you sure you want to delete this rider account?")) return;
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error("Failed to delete driver", e);
    }
  };

  const handleSubmitPayment = async (payData: any) => {
    let apiSuccess = false;
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payData)
      });
      if (res.ok) {
        apiSuccess = true;
        setSelectedOrderForPayment(null);
        fetchData();
      } else {
        console.warn("[Payments] API returned non-ok status, attempting direct Firestore save fallback.");
      }
    } catch (e) {
      console.warn("[Payments] API call failed, attempting direct Firestore save fallback:", e);
    }

    // Direct client-side Firestore fallback if the server API failed or returned an error
    if (!apiSuccess) {
      try {
        const orderToPay = orders.find(o => o.id === payData.orderId);
        if (!orderToPay) {
          alert("Error: Associated order not found in state.");
          return;
        }

        const payAmt = Number(payData.amount);
        const newAmountPaid = orderToPay.amountPaid + payAmt;
        const newBalanceDue = Math.max(0, orderToPay.total - newAmountPaid);
        let newPaymentStatus: 'Unpaid' | 'Partial' | 'Paid' = "Unpaid";
        if (newBalanceDue === 0 && orderToPay.total > 0) {
          newPaymentStatus = "Paid";
        } else if (newAmountPaid > 0) {
          newPaymentStatus = "Partial";
        }

        const updatedOrder: Order = {
          ...orderToPay,
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date().toISOString()
        };

        const newPayment: Payment = {
          id: "pay_" + Date.now(),
          orderId: orderToPay.id,
          orderNumber: orderToPay.orderNumber,
          customerName: orderToPay.customerName,
          amount: payAmt,
          method: payData.method || "Cash",
          reference: payData.reference || "",
          date: new Date().toISOString(),
          notes: payData.notes || ""
        };

        const saved = await savePaymentToFirestore(newPayment, updatedOrder);
        if (saved) {
          // Immediately update local React state to make the UI update seamlessly
          setPayments(prev => [newPayment, ...prev.filter(p => p.id !== newPayment.id)]);
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          setSelectedOrderForPayment(null);
          fetchData();
        } else {
          alert("Failed to save payment to Firestore. Please verify your connection.");
        }
      } catch (fallbackErr) {
        console.error("Direct payment save fallback failed:", fallbackErr);
        alert("An error occurred while attempting to save payment.");
      }
    }
  };

  const handleResetSeed = async () => {
    if (!confirm("Reset database back to initial seed data?")) return;
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        fetchData();
        alert("Database reset successfully!");
      }
    } catch (e) {
      console.error("Failed to reset seed", e);
    }
  };

  const handleCustomerPlaceOrder = async (orderData: any): Promise<Order | null> => {
    // 1. Attempt standard backend API call
    try {
      let res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      // If server was temporarily restarting or cold (404/502/503), do a rapid retry
      if (!res.ok && (res.status === 404 || res.status >= 500)) {
        await new Promise(resolve => setTimeout(resolve, 600));
        try {
          const retryRes = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
          });
          if (retryRes.ok) {
            res = retryRes;
          }
        } catch {
          // ignore retry network error and proceed
        }
      }

      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data && data.id) {
            await fetchData();
            return data as Order;
          }
        } catch {
          console.warn("Non-JSON response from /api/orders:", text);
        }
      }
    } catch (apiErr) {
      console.warn("[Customer Booking] API call threw error, initiating direct Firestore fallback:", apiErr);
    }

    // 2. Direct Firestore fallback (ensures booking NEVER fails with 404 error)
    try {
      const fallbackCustomerId = "c_" + Date.now();
      const fallbackOrder: Order = {
        id: "ord_" + Date.now(),
        orderNumber: "ORD-" + Math.floor(100 + Math.random() * 900),
        customerId: fallbackCustomerId,
        customerName: String(orderData.customerName || "Customer").trim(),
        customerPhone: String(orderData.customerPhone || "").trim(),
        customerAddress: String(orderData.customerAddress || "").trim(),
        status: "New",
        pickupDate: orderData.pickupDate || new Date().toISOString().split("T")[0],
        pickupTimeWindow: orderData.pickupTimeWindow || "09:00 AM - 11:00 AM",
        deliveryDate: orderData.deliveryDate || new Date().toISOString().split("T")[0],
        deliveryTimeWindow: orderData.deliveryTimeWindow || "02:00 PM - 04:00 PM",
        driverId: "",
        driverName: "",
        items: Array.isArray(orderData.items) ? orderData.items : [],
        subtotal: 0,
        discount: 0,
        total: 0,
        paymentStatus: "Unpaid",
        amountPaid: 0,
        balanceDue: 0,
        notes: orderData.notes ? String(orderData.notes).trim() : "",
        invoiceSent: false,
        invoiceSentAt: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const fallbackCustomer: Customer = {
        id: fallbackCustomerId,
        name: fallbackOrder.customerName,
        phone: fallbackOrder.customerPhone,
        address: fallbackOrder.customerAddress,
        notes: fallbackOrder.notes ? `Booking: ${fallbackOrder.notes}` : "Customer portal booking",
        createdAt: new Date().toISOString()
      };

      // Persist directly to Firestore database
      await saveOrderToFirestore(fallbackOrder, fallbackCustomer);

      // Update local state immediately so operations dashboard & tracking see it instantly
      setOrders(prev => [fallbackOrder, ...prev.filter(o => o.id !== fallbackOrder.id)]);
      setCustomers(prev => [fallbackCustomer, ...prev.filter(c => c.phone !== fallbackCustomer.phone)]);

      return fallbackOrder;
    } catch (directErr: any) {
      console.error("[Customer Booking] Fallback error:", directErr);
      throw new Error(directErr?.message || "Failed to book pickup. Please check your connection.");
    }
  };

  const handleAddReview = async (reviewData: { customerName: string; rating: number; comment: string; serviceUsed?: string }): Promise<boolean> => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData)
      });
      if (res.ok) {
        const newRev = await res.json();
        setReviews(prev => [newRev, ...prev.filter(r => r.id !== newRev.id)]);
        fetchData();
        return true;
      }
    } catch (e) {
      console.warn("Failed to post review to API, trying direct Firestore save", e);
    }

    // Direct Firestore fallback for reviews
    try {
      const newRev: Review = {
        id: "rev_" + Date.now(),
        customerName: reviewData.customerName.trim(),
        rating: reviewData.rating,
        comment: reviewData.comment.trim(),
        serviceUsed: reviewData.serviceUsed || "Laundry & Garment Care",
        date: new Date().toISOString().split("T")[0],
        verified: true
      };
      await saveReviewToFirestore(newRev);
      setReviews(prev => [newRev, ...prev.filter(r => r.id !== newRev.id)]);
      return true;
    } catch (revErr) {
      console.error("Direct review save failed:", revErr);
      return false;
    }
  };

  const handleUpdateOrderDetails = async (orderId: string, updatedData: any) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        setSelectedOrderForDetail(prev => prev && prev.id === orderId ? updated : prev);
        fetchData();
        return updated;
      }
      throw new Error("Failed to update order");
    } catch (e) {
      console.error("Failed to update order details", e);
      throw e;
    }
  };

  const handleSendInvoice = async (orderId: string, customMessage?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/send-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customMessage })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
          setSelectedOrderForDetail(prev => prev && prev.id === orderId ? data.order : prev);
        }
        fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to send pre-delivery invoice", e);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold animate-pulse">
            ✨
          </div>
          <p className="text-sm font-medium text-slate-600">Loading Sparkle Spins...</p>
        </div>
      </div>
    );
  }

  // If currently previewing Customer Page
  if (viewingCustomerPage) {
    return (
      <CustomerPage
        services={services}
        reviews={reviews}
        onPlaceOrder={handleCustomerPlaceOrder}
        onAddReview={handleAddReview}
        onGoToLogin={() => setPublicScreen('login')}
        onGoToDashboard={() => setViewingCustomerPage(false)}
        isLoggedIn={Boolean(currentUser)}
        currentUserRole={currentUser?.role}
        onBackToDashboard={() => setViewingCustomerPage(false)}
      />
    );
  }

  // Not logged in: Show Customer Landing Page by default, with staff login toggle
  if (!currentUser) {
    if (publicScreen === 'login') {
      return (
        <LoginScreen
          drivers={drivers}
          onGoToCustomerPage={() => setPublicScreen('customer')}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setViewingCustomerPage(false);
            if (user.role === 'driver') {
              setViewMode('driver');
              setActiveTab('driver');
            } else {
              setViewMode('admin');
              setActiveTab('dashboard');
            }
          }}
        />
      );
    }

    return (
      <CustomerLandingPage
        orders={orders}
        services={services}
        reviews={reviews}
        onOpenCustomerPortal={() => setViewingCustomerPage(true)}
        onOpenLogin={() => setPublicScreen('login')}
        onCreateOrder={() => {
          const el = document.getElementById('book-order');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onPlaceOrder={handleCustomerPlaceOrder}
      />
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-sky-100 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200">
              ✨
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xl tracking-tight">Sparkle <span className="text-blue-600">Spins</span></span>
              <span className="text-xs text-blue-600 font-semibold ml-2 bg-blue-50 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                Doorstep Laundry Care
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Admin View) */}
          {viewMode === 'admin' && currentUser.role === 'admin' ? (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-sm font-medium">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'orders' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4 text-blue-600" /> Orders
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'customers' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-blue-600" /> Customers
              </button>
              <button
                onClick={() => setActiveTab('financials')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'financials' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4 text-blue-600" /> Financials
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4 text-blue-600" /> Settings
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl">
                Rider Portal ({currentUser.name})
              </span>
            </div>
          )}

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewingCustomerPage(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-200 shadow-2xs"
              title="Open Customer-Facing Booking & Testimonials Page"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Customer Portal</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => {
                  if (viewMode === 'admin') {
                    setViewMode('driver');
                    setActiveTab('driver');
                  } else {
                    setViewMode('admin');
                    setActiveTab('dashboard');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                {viewMode === 'admin' ? 'Rider View 📱' : 'Admin Dashboard 📊'}
              </button>
            )}

            {viewMode === 'admin' && currentUser.role === 'admin' && (
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-200 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Order
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{currentUser.role}</div>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (for Admin) */}
      {viewMode === 'admin' && currentUser.role === 'admin' && (
        <div className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-30 px-4 py-2 flex justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'orders' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
          >
            <Package className="w-5 h-5" /> Orders
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'customers' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
          >
            <Users className="w-5 h-5" /> Customers
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'financials' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
          >
            <DollarSign className="w-5 h-5" /> Financials
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'settings' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16 md:mb-0">
        {viewMode === 'driver' || currentUser.role === 'driver' ? (
          <DriverView
            orders={orders}
            drivers={drivers}
            currentDriverId={currentUser?.driverId}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={effectiveStats}
                onNavigate={(tab) => setActiveTab(tab as any)}
                onOpenNewOrder={() => setShowNewOrderModal(true)}
                onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
                onUpdateStatus={(ordId, st) => handleUpdateStatus(ordId, st)}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                drivers={drivers}
                onOpenNewOrder={() => setShowNewOrderModal(true)}
                onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
                onUpdateStatus={(ordId, st, drId) => handleUpdateStatus(ordId, st, drId)}
                onOpenPaymentModal={(ord) => setSelectedOrderForPayment(ord)}
                onOpenInvoice={(ord) => setSelectedOrderForInvoice(ord)}
              />
            )}
            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                orders={orders}
                onAddCustomer={handleAddCustomer}
                onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
              />
            )}
            {activeTab === 'financials' && (
              <FinancialsView
                orders={orders}
                payments={payments}
                reports={effectiveReports}
                onOpenPaymentModal={(ord) => setSelectedOrderForPayment(ord)}
                onOpenInvoice={(ord) => setSelectedOrderForInvoice(ord)}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                services={services}
                drivers={drivers}
                onAddService={handleAddService}
                onAddDriver={handleAddDriver}
                onDeleteDriver={handleDeleteDriver}
                onResetSeed={handleResetSeed}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showNewOrderModal && (
        <CreateOrderModal
          customers={customers}
          drivers={drivers}
          services={services}
          onClose={() => setShowNewOrderModal(false)}
          onSaveOrder={handleSaveOrder}
          onAddCustomerInline={handleAddCustomerInline}
        />
      )}

      {selectedOrderForPayment && (
        <RecordPaymentModal
          order={selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onSubmitPayment={handleSubmitPayment}
        />
      )}

      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {selectedOrderForDetail && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          drivers={drivers}
          services={services}
          onClose={() => setSelectedOrderForDetail(null)}
          onUpdateStatus={handleUpdateStatus}
          onUpdateOrderDetails={handleUpdateOrderDetails}
          onSendInvoice={handleSendInvoice}
          onOpenPaymentModal={(ord) => setSelectedOrderForPayment(ord)}
          onOpenInvoice={(ord) => setSelectedOrderForInvoice(ord)}
        />
      )}
    </div>
  );
}
