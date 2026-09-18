import React, { useState } from 'react';
import { Order, ServiceItem, Review } from '../types';
import GhostFibers from './GhostFibers';
import { Sparkles, Star, ArrowRight, ChevronRight, User, LogIn, MapPin, Phone, CheckCircle2, Truck, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';

interface CustomerLandingPageProps {
  orders: Order[];
  services: ServiceItem[];
  reviews: Review[];
  onOpenCustomerPortal: () => void;
  onOpenLogin: () => void;
  onCreateOrder: () => void;
  onPlaceOrder?: (orderData: any) => Promise<Order | null>;
}

export const CustomerLandingPage: React.FC<CustomerLandingPageProps> = ({
  services,
  reviews,
  onOpenCustomerPortal,
  onOpenLogin,
  onPlaceOrder
}) => {
  // Order form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultDeliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTimeWindow, setPickupTimeWindow] = useState("09:00 AM - 11:00 AM");
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate);
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState("02:00 PM - 04:00 PM");

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const timeSlots = [
    "08:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM",
    "01:00 PM - 03:00 PM",
    "03:00 PM - 05:00 PM",
    "05:00 PM - 07:00 PM"
  ];

  const scrollToBooking = () => {
    const el = document.getElementById("book-order");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setOrderError("Please enter your name, phone number, and pickup address.");
      return;
    }

    if (!onPlaceOrder) return;

    setSubmittingOrder(true);
    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        pickupDate,
        pickupTimeWindow,
        deliveryDate,
        deliveryTimeWindow,
        notes: notes.trim(),
        items: []
      };

      const created = await onPlaceOrder(orderPayload);
      if (created) {
        setConfirmedOrder(created);
        setNotes("");
        window.scrollTo({ top: 400, behavior: "smooth" });
      } else {
        setOrderError("Failed to book pickup. Please check your connection and try again.");
      }
    } catch (err: any) {
      setOrderError(err.message || "An unexpected error occurred while placing your order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Full-Screen Low-Opacity Animated Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <GhostFibers
          lineColor="#38bdf8"
          glowColor="#6366f1"
          speed={0.15}
          scale={2.2}
          layers={5}
          brightness={2.2}
          blueBoost={1.4}
          grain={0.03}
        />
      </div>

      {/* Ambient Gradient Overlay */}
      <div className="fixed inset-0 bg-slate-950/80 z-0 pointer-events-none" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/90 backdrop-blur-md flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Sparkle Spins
              </span>
              <span className="block text-[10px] text-indigo-300 font-medium tracking-widest uppercase">
                Premium Laundry Co.
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#service-areas" className="hover:text-white transition-colors">Service Areas</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#book-order" className="hover:text-white transition-colors text-indigo-400 font-semibold">Book Pickup</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 backdrop-blur-md transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              <span>Staff Portal</span>
            </button>
            <button
              onClick={onOpenCustomerPortal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>My Account</span>
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="min-h-[80vh] flex items-center justify-center pt-12 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 tracking-wide uppercase backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Serving PCEA Tumutumu Hospital & Karatina Area</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Immaculate Garments. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
                Zero Effort.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
              Schedule a contactless pickup in 60 seconds. Our master artisans clean, press, and deliver your wardrobe fresh to your door with pristine care.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={scrollToBooking}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Schedule Free Pickup</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-800/80">
              <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
                <div className="text-2xl font-bold text-white mb-1">100%</div>
                <div className="text-xs text-slate-400">Eco-Friendly Solvents</div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
                <div className="text-2xl font-bold text-white mb-1">24h</div>
                <div className="text-xs text-slate-400">Standard Turnaround</div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
                <div className="text-2xl font-bold text-white mb-1">4.9 ★</div>
                <div className="text-xs text-slate-400">Customer Rating</div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
                <div className="text-2xl font-bold text-white mb-1">Free</div>
                <div className="text-xs text-slate-400">Doorstep Pickup & Drop</div>
              </div>
            </div>
          </div>
        </header>

        {/* Schedule Pickup Booking Section (Integrated directly into the landing page) */}
        <section id="book-order" className="py-20 px-6 max-w-5xl mx-auto w-full">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3.5 py-1 rounded-full border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                Instant Pickup Scheduler
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Schedule Your Free Pickup</h2>
              <p className="text-sm text-slate-300">
                Provide your collection address and convenient time windows. Pay upon secure delivery (M-Pesa or Cash).
              </p>
            </div>

            {confirmedOrder ? (
              <div className="bg-slate-950 rounded-2xl border border-emerald-500/40 p-6 sm:p-8 space-y-6 text-slate-100">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Pickup Successfully Scheduled!</h3>
                  <p className="text-sm text-slate-300">
                    Thank you, <strong className="text-white">{confirmedOrder.customerName}</strong>. Your pickup request has been received.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Order Reference:</span>
                    <strong className="text-indigo-400 font-mono">{confirmedOrder.orderNumber}</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Scheduled Pickup:</span>
                    <strong className="text-white">{confirmedOrder.pickupDate} ({confirmedOrder.pickupTimeWindow})</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Pickup Address:</span>
                    <strong className="text-white text-right max-w-xs">{confirmedOrder.customerAddress}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Payment Terms:</span>
                    <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                      Pay on Delivery (M-Pesa / Cash)
                    </span>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmedOrder(null)}
                    className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    Book Another Pickup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-6">
                {orderError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
                    {orderError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Dr. Jane Karimi"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Phone Number (M-Pesa / WhatsApp) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. +254 712 345678"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Pickup Address (Tumutumu Hospital, Karatina Town, etc.) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <textarea
                      required
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. PCEA Tumutumu Hospital Staff Quarters / Karatina Town near Equity Bank"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Pickup Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Pickup Time Window</label>
                    <select
                      value={pickupTimeWindow}
                      onChange={(e) => setPickupTimeWindow(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot} className="bg-slate-900 text-white">
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Special Instructions / Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Extra starch for shirts, handle silks with care"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{submittingOrder ? "Scheduling Pickup..." : "Confirm & Schedule Free Pickup"}</span>
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Service Areas Section */}
        <section id="service-areas" className="py-24 px-6 max-w-7xl mx-auto w-full border-t border-slate-900/50">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-3">Operational Zones</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Tumutumu & Karatina Coverage</h3>
            <p className="text-sm text-slate-400 mt-3">Free contactless doorstep pickup and delivery in and around PCEA Tumutumu Hospital and the greater Karatina area.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Primary Hub
                </span>
                <span className="text-xs text-slate-400 font-mono">Express</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">PCEA Tumutumu Hospital Area</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Dedicated rapid pickup and delivery for hospital staff quarters, medical personnel, and residences surrounding Tumutumu.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                <span>Free Pickup</span>
                <span className="text-indigo-400 font-semibold">Daily 7AM - 8PM</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-600/10 rounded-full blur-2xl group-hover:bg-sky-600/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Zone
                </span>
                <span className="text-xs text-slate-400 font-mono">Standard</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Karatina Town & CBD</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Comprehensive coverage across Karatina commercial center, residential apartments, and surrounding estates.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                <span>Free Pickup</span>
                <span className="text-indigo-400 font-semibold">Daily 8AM - 7PM</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl group-hover:bg-cyan-600/20 transition-all pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Zone
                </span>
                <span className="text-xs text-slate-400 font-mono">Scheduled</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Mathira & Surrounding Suburbs</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Door-to-door laundry collection and drop-off across neighboring residential communities and homesteads.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                <span>Free Pickup</span>
                <span className="text-indigo-400 font-semibold">Daily 8AM - 6PM</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-3">Seamless Process</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">How Sparkle Spins Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md relative">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 font-bold text-lg rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                01
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Schedule in 60 Seconds</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Choose your preferred pickup and delivery time windows. Select your detergent preferences and folding instructions.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md relative">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 font-bold text-lg rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                02
              </div>
              <h4 className="text-xl font-bold text-white mb-3">We Collect From Doorstep</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our professional driver arrives with custom branded garment bags. No need to sort or weigh — we handle it all with care.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md relative">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 font-bold text-lg rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                03
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Delivered Fresh & Pressed</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Impeccably washed, hand-pressed, and neatly folded garments delivered right to your doorstep within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* Services Section (No Prices) */}
        <section id="services" className="py-24 px-6 w-full border-t border-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-3">Professional Care</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Our Services</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all backdrop-blur-md">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {service.category}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{service.name}</h4>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">{service.description}</p>
                  </div>
                  <button
                    onClick={scrollToBooking}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-white/10 hover:border-indigo-600 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Book Service</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Customer Reviews */}
        <section className="py-24 px-6 max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-3">Testimonials</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Loved by Busy Professionals</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed italic">"{rev.comment}"</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                  <span className="font-semibold text-white text-sm">{rev.customerName}</span>
                  <span className="text-xs text-slate-500">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-12 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-white">Sparkle Spins Laundry Co.</span>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={onOpenCustomerPortal} className="hover:text-white transition-colors cursor-pointer">
                Customer Portal
              </button>
              <button onClick={onOpenLogin} className="hover:text-white transition-colors cursor-pointer">
                Staff / Admin Login
              </button>
            </div>

            <div className="text-xs text-slate-600">
              © {new Date().getFullYear()} Sparkle Spins. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
