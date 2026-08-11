import React, { useState, useEffect } from "react";
import { Customer, Driver, ServiceItem, Order, Payment, Stats, Reports, OrderStatus } from "./types";
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
import { Truck, Package, Users, DollarSign, Settings, LayoutDashboard, Smartphone, Plus, ShieldCheck, LogOut, User } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ role: 'admin' | 'driver'; username: string; name: string; driverId?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'financials' | 'driver' | 'settings'>('dashboard');
  const [viewMode, setViewMode] = useState<'admin' | 'driver'>('admin');

  // App data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Reports | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes, customersRes, driversRes, servicesRes, ordersRes, paymentsRes] = await Promise.all([
        fetch("/api/stats").then(r => r.json()),
        fetch("/api/reports").then(r => r.json()),
        fetch("/api/customers").then(r => r.json()),
        fetch("/api/drivers").then(r => r.json()),
        fetch("/api/services").then(r => r.json()),
        fetch("/api/orders").then(r => r.json()),
        fetch("/api/payments").then(r => r.json())
      ]);

      setStats(statsRes);
      setReports(reportsRes);
      setCustomers(customersRes);
      setDrivers(driversRes);
      setServices(servicesRes);
      setOrders(ordersRes);
      setPayments(paymentsRes);
    } catch (e) {
      console.error("Failed to fetch backend data", e);
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
      }
    } catch (e) {
      console.error("Failed to create order", e);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, driverId?: string, proofOfDelivery?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, driverId, proofOfDelivery })
      });
      if (res.ok) {
        fetchData();
        if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
          const updated = await res.json();
          setSelectedOrderForDetail(updated);
        }
      }
    } catch (e) {
      console.error("Failed to update status", e);
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
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payData)
      });
      if (res.ok) {
        setSelectedOrderForPayment(null);
        fetchData();
      }
    } catch (e) {
      console.error("Failed to submit payment", e);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold animate-pulse">
            🧺
          </div>
          <p className="text-sm font-medium text-slate-600">Loading LaundryOps Manager...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen drivers={drivers} onLoginSuccess={(user) => {
      setCurrentUser(user);
      if (user.role === 'driver') {
        setViewMode('driver');
        setActiveTab('driver');
      } else {
        setViewMode('admin');
        setActiveTab('dashboard');
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-sky-100 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200">
              🧺
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xl tracking-tight">LaundryOps<span className="text-blue-600">Pro</span></span>
              <span className="text-xs text-blue-600 font-semibold ml-2 bg-blue-50 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                Pickup & Delivery
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
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={stats}
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
                reports={reports}
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
          onClose={() => setSelectedOrderForDetail(null)}
          onUpdateStatus={handleUpdateStatus}
          onOpenPaymentModal={(ord) => setSelectedOrderForPayment(ord)}
          onOpenInvoice={(ord) => setSelectedOrderForInvoice(ord)}
        />
      )}
    </div>
  );
}
