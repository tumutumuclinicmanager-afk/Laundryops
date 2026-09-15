import React, { useState } from "react";
import { ServiceItem, Order, Review } from "../types";
import {
  Sparkles,
  Truck,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Plus,
  Minus,
  MessageSquare,
  ArrowRight,
  LogIn,
  HeartHandshake,
  Tag,
  Check,
  Send,
  AlertCircle
} from "lucide-react";

interface CustomerPageProps {
  services: ServiceItem[];
  reviews: Review[];
  onPlaceOrder: (orderData: any) => Promise<Order | null>;
  onAddReview: (reviewData: { customerName: string; rating: number; comment: string; serviceUsed?: string }) => Promise<boolean>;
  onGoToLogin: () => void;
  onGoToDashboard?: () => void;
  isLoggedIn?: boolean;
  currentUserRole?: 'admin' | 'driver';
  onBackToDashboard?: () => void;
}

const FALLBACK_SERVICES: ServiceItem[] = [
  { id: "s1", name: "Wash & Fold (Standard Bag)", category: "Wash & Fold", price: 150, unit: "kg" },
  { id: "s2", name: "Wash & Fold (Heavy/Bedding)", category: "Wash & Fold", price: 250, unit: "kg" },
  { id: "s3", name: "Executive Suit (Dry Clean)", category: "Dry Cleaning", price: 1200, unit: "item" },
  { id: "s4", name: "Dress Shirt (Dry Clean & Press)", category: "Ironing", price: 350, unit: "item" },
  { id: "s5", name: "Curtains & Drapes (Deep Clean)", category: "Special Care", price: 400, unit: "kg" },
  { id: "s6", name: "Bed Duvet / Comforter", category: "Special Care", price: 1800, unit: "item" }
];

export const CustomerPage: React.FC<CustomerPageProps> = ({
  services,
  reviews,
  onPlaceOrder,
  onAddReview,
  onGoToLogin,
  onGoToDashboard,
  isLoggedIn,
  currentUserRole,
  onBackToDashboard
}) => {
  const availableServices = (services && services.length > 0) ? services : FALLBACK_SERVICES;

  // Order form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Dates & windows
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultDeliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTimeWindow, setPickupTimeWindow] = useState("09:00 AM - 11:00 AM");
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate);
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState("02:00 PM - 04:00 PM");

  // Selected items: map serviceId -> quantity (Default to 1 item of first service so order is ready)
  const [quantities, setQuantities] = useState<Record<string, number>>({ "s1": 1 });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewService, setReviewService] = useState("Wash & Fold");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewFilter, setReviewFilter] = useState<string>("All");

  const timeSlots = [
    "08:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM",
    "01:00 PM - 03:00 PM",
    "03:00 PM - 05:00 PM",
    "05:00 PM - 07:00 PM"
  ];

  // Helper to adjust item quantity
  const handleQuantityChange = (serviceId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  // Quick preset loader
  const handleApplyPreset = (presetName: string) => {
    const updated: Record<string, number> = { ...quantities };
    if (presetName === "wash_bag") {
      const s = availableServices.find(item => item.name.toLowerCase().includes("wash & fold")) || availableServices[0];
      if (s) updated[s.id] = (updated[s.id] || 0) + 1;
    } else if (presetName === "wash_fold_5kg") {
      const s = availableServices.find(item => item.name.toLowerCase().includes("wash & fold") && !item.name.toLowerCase().includes("heavy")) || availableServices[0];
      if (s) updated[s.id] = (updated[s.id] || 0) + 5;
    } else if (presetName === "suits_dryclean") {
      const s = availableServices.find(item => item.name.toLowerCase().includes("suit")) || availableServices[1] || availableServices[0];
      if (s) updated[s.id] = (updated[s.id] || 0) + 2;
    } else if (presetName === "duvet") {
      const s = availableServices.find(item => item.name.toLowerCase().includes("duvet") || item.name.toLowerCase().includes("comforter")) || availableServices[availableServices.length - 1];
      if (s) updated[s.id] = (updated[s.id] || 0) + 1;
    }
    setQuantities(updated);
  };

  // Calculate items list
  const selectedItemsList = Object.entries(quantities)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([serviceId, qty]) => {
      const numQty = Number(qty);
      const service = availableServices.find(s => s.id === serviceId);
      const unitPrice = service?.price || 150;
      return {
        serviceId,
        serviceName: service?.name || "General Laundry Care",
        unit: service?.unit || "bag",
        quantity: numQty,
        unitPrice,
        subtotal: unitPrice * numQty
      };
    });

  // Handle Order Submit
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setOrderError("Please enter your name, phone number, and pickup address.");
      return;
    }

    // Resilient fallback if user unchecked all items: default to 1 laundry bag
    let itemsToSubmit = selectedItemsList;
    if (itemsToSubmit.length === 0) {
      const defaultS = availableServices[0] || FALLBACK_SERVICES[0];
      itemsToSubmit = [{
        serviceId: defaultS.id,
        serviceName: defaultS.name,
        unit: defaultS.unit,
        quantity: 1,
        unitPrice: defaultS.price,
        subtotal: defaultS.price
      }];
    }

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
        items: itemsToSubmit
      };

      const created = await onPlaceOrder(orderPayload);
      if (created) {
        setConfirmedOrder(created);
        setReviewName(customerName);
        setQuantities({ "s1": 1 });
        setNotes("");
        // Scroll to top of confirmation
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setOrderError("Failed to book pickup. Please check your connection and try again.");
      }
    } catch (err: any) {
      setOrderError(err.message || "An unexpected error occurred while placing your order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Handle Review Submit
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess(false);

    if (!reviewName.trim() || !reviewComment.trim()) {
      setReviewError("Please provide your name and your feedback comment.");
      return;
    }

    setSubmittingReview(true);
    try {
      const success = await onAddReview({
        customerName: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
        serviceUsed: reviewService
      });

      if (success) {
        setReviewSuccess(true);
        setReviewComment("");
        setTimeout(() => setReviewSuccess(false), 6000);
      } else {
        setReviewError("Failed to submit review. Please try again.");
      }
    } catch (err: any) {
      setReviewError(err.message || "Could not post your review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === "All") return true;
    if (reviewFilter === "5-Stars") return r.rating === 5;
    if (reviewFilter === "Wash & Fold") return r.serviceUsed?.toLowerCase().includes("wash");
    if (reviewFilter === "Dry Cleaning") return r.serviceUsed?.toLowerCase().includes("dry");
    return true;
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "4.9";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Operations Quick Access Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sparkle Spins • Doorstep Laundry & Garment Care in Nairobi Environs</span>
          </div>
          <button
            type="button"
            onClick={onGoToDashboard || onGoToLogin}
            className="text-blue-300 hover:text-white font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            Operations & Staff Dashboard &rarr;
          </button>
        </div>
      </div>

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">Sparkle Spins</span>
                <span className="text-[11px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Customer Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Doorstep Laundry & Garment Care</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#book-order"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-2.5 py-1.5"
            >
              Book Pickup
            </a>
            <a
              href="#services"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2.5 py-1.5"
            >
              Services
            </a>
            <a
              href="#reviews"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2.5 py-1.5"
            >
              Testimonials
            </a>

            <button
              type="button"
              onClick={onGoToDashboard || onGoToLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operations</span> Dashboard
            </button>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Staff ({currentUserRole})
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoToLogin}
                className="hidden md:inline-flex bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                Staff Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 1. Schedule a Laundry Pickup (COMES FIRST) */}
      <section id="book-order" className="py-8 sm:py-10 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        {/* Banner with Value Propositions & Trust Metrics */}
        <div className="mb-8 text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-800 text-xs font-semibold px-3.5 py-1 rounded-full border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Doorstep Laundry & Garment Care • Book in under 60 seconds
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Schedule a Laundry Pickup
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Choose your collection address, laundry items, and convenient pickup window. Pay on delivery (M-Pesa or Cash).
          </p>

          {/* Key Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2 text-xs font-bold text-slate-700">
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <Truck className="w-4 h-4 text-emerald-600" /> Free Doorstep Collection
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <Clock className="w-4 h-4 text-blue-600" /> 24h - 48h Turnaround
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <HeartHandshake className="w-4 h-4 text-indigo-600" /> Pay on Delivery
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> 4.9★ Customer Rating
            </span>
          </div>
        </div>

        {/* Order Confirmation Screen if created */}
        {confirmedOrder ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border-2 border-emerald-200 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Order Confirmed & Pickup Scheduled!</h3>
              <p className="text-sm text-slate-600">
                Thank you, <strong className="text-slate-900">{confirmedOrder.customerName}</strong>. Your laundry pickup request has been received by our operations team.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2.5">
                <span className="text-xs text-slate-500 font-medium">Order Reference:</span>
                <span className="text-sm font-black text-blue-700 font-mono">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2.5">
                <span className="text-xs text-slate-500 font-medium">Scheduled Pickup:</span>
                <span className="text-xs font-bold text-slate-900">{confirmedOrder.pickupDate} ({confirmedOrder.pickupTimeWindow})</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2.5">
                <span className="text-xs text-slate-500 font-medium">Delivery Address:</span>
                <span className="text-xs font-bold text-slate-900 text-right max-w-xs">{confirmedOrder.customerAddress}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2.5">
                <span className="text-xs text-slate-500 font-medium">Phone Number:</span>
                <span className="text-xs font-bold text-slate-900">{confirmedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2.5">
                <span className="text-xs text-slate-500 font-medium">Payment Terms:</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Pay on Delivery (M-Pesa or Cash)
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-500 font-medium">Pre-Delivery Invoice:</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                  Will be sent to your phone before rider arrives
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
              <p className="font-extrabold flex items-center gap-1.5 text-blue-950">
                <Sparkles className="w-4 h-4 text-blue-600" /> What happens next?
              </p>
              <p className="text-blue-800 leading-relaxed">
                1. Our rider will arrive during your scheduled window to collect your garments. No payment is required at pickup.
              </p>
              <p className="text-blue-800 leading-relaxed">
                2. Our facility team will weigh and inspect your garments, then send you an official itemized invoice via SMS/WhatsApp before delivery.
              </p>
              <p className="text-blue-800 leading-relaxed">
                3. You inspect your fresh garments upon delivery and pay via M-Pesa or Cash.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmedOrder(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer text-center"
              >
                Place Another Order
              </button>
              <a
                href="#reviews"
                className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold py-3 rounded-xl text-xs sm:text-sm transition-all text-center cursor-pointer"
              >
                Leave Feedback / Review
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Customer Details & Schedule */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Contact Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Your Contact & Pickup Address</h3>
                    <p className="text-[11px] text-slate-500">We'll use this to coordinate rider collection</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Wanjiku Mwangi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number (M-Pesa / Calls) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. +254 712 345678"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Neighborhood / Estate <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="e.g. Kilimani, Rose Ave, Apt 4B"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pickup Notes or Gate Code (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Gate code #3321, please call before entering, separate delicate fabrics"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Scheduling Time Slots */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Schedule Pickup & Return Date</h3>
                    <p className="text-[11px] text-slate-500">Pick the time window convenient for you</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Pickup */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Pickup Date
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      min={todayStr}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-[11px] font-semibold text-slate-500 mt-2">
                      Pickup Window
                    </label>
                    <select
                      value={pickupTimeWindow}
                      onChange={(e) => setPickupTimeWindow(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeSlots.map(slot => (
                        <option key={`pick-${slot}`} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Preferred Delivery Date
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      min={pickupDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                    </input>
                    <label className="block text-[11px] font-semibold text-slate-500 mt-2">
                      Delivery Window
                    </label>
                    <select
                      value={deliveryTimeWindow}
                      onChange={(e) => setDeliveryTimeWindow(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeSlots.map(slot => (
                        <option key={`del-${slot}`} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Choose Services */}
              <div id="services" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Select Laundry Services</h3>
                      <p className="text-[11px] text-slate-500">Choose what you need cleaned & pressed</p>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Quick Select:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("wash_bag")}
                      className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-100 cursor-pointer"
                    >
                      +1 Laundry Bag
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("wash_fold_5kg")}
                      className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-100 cursor-pointer"
                    >
                      +5kg Wash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("suits_dryclean")}
                      className="text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                    >
                      +2 Suits
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("duvet")}
                      className="text-[11px] font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-200 hover:bg-purple-100 cursor-pointer"
                    >
                      +1 Duvet
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {availableServices.map(service => {
                    const count = quantities[service.id] || 0;
                    return (
                      <div
                        key={service.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          count > 0 ? "border-blue-500 bg-blue-50/40 shadow-xs" : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {service.category}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5">{service.name}</h4>
                          </div>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                            Billed per {service.unit}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">
                            {count > 0 ? `${count} ${service.unit}${count > 1 && service.unit === 'item' ? 's' : ''} selected` : "Select quantity"}
                          </span>
                          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(service.id, -1)}
                              disabled={count === 0}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-900">{count}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(service.id, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Placement Button */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-md shadow-slate-200/50 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    Order Summary
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedItemsList.length} item{selectedItemsList.length === 1 ? '' : 's'}
                  </span>
                </div>

                {orderError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{orderError}</span>
                  </div>
                )}

                {selectedItemsList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">No services selected yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Click the <strong className="text-slate-600">+</strong> button on services on the left to add items.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedItemsList.map((item) => (
                      <div key={item.serviceId} className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                        <div>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm block">{item.serviceName}</span>
                          <span className="text-[11px] text-slate-400">
                            Quantity requested: {item.quantity} {item.unit}{item.quantity > 1 && item.unit === 'item' ? 's' : ''}
                          </span>
                        </div>
                        <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pre-Delivery Invoicing Notice Card */}
                <div className="bg-blue-50/90 rounded-2xl p-4 space-y-3 text-xs border border-blue-200">
                  <div className="flex items-center gap-2 font-black text-blue-950 text-sm">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Invoicing & Payment on Delivery</span>
                  </div>
                  <div className="space-y-2 text-slate-700 text-xs leading-relaxed">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Doorstep Collection & Delivery:</strong> 100% FREE.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Protective Packaging:</strong> Complimentary fresh covers.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Pre-Delivery Invoice:</strong> After pickup, we inspect and weigh your items at the facility and text you the itemized invoice before delivery.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Pay on Delivery:</strong> Payment is collected upon delivery, NOT on pickup (M-Pesa or Cash).</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Booking Your Pickup...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" /> Book Pickup (Pay on Delivery)
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* How It Works Section */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">Simple 3-Step Laundry Experience</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">From dirty clothes to crisp delivery in just 24-48 hours</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl mx-auto flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Schedule Online</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pick your address, items and preferred collection time slot. Takes less than a minute with no account setup.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl mx-auto flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Rider Collects</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our uniformed rider arrives at your doorstep with heavy-duty laundry bags and confirms your items.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl mx-auto flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Delivered Fresh</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive your fresh garments neatly folded, hung and protected. Settle payment conveniently via M-Pesa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback / Review & Testimonials Section */}
      <section id="reviews" className="py-14 max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Customer Feedback & Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Real Stories From Happy Customers
          </h2>
          <p className="text-slate-500 text-sm">
            Read authentic reviews from clients who trust us with their weekly laundry and delicate dry cleaning.
          </p>
        </div>

        {/* Aggregate Ratings & Testimonial Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="text-center border-r border-slate-200 pr-5">
              <span className="text-4xl font-black text-slate-900 block">{averageRating}</span>
              <div className="flex text-amber-400 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">Out of 5.0 Stars</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Over 140+ Customers Served</h3>
              <p className="text-xs text-slate-500">
                100% verified doorstep pickups with 98% on-time delivery rate across Nairobi and environs.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {["All", "5-Stars", "Wash & Fold", "Dry Cleaning"].map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setReviewFilter(filter)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  reviewFilter === filter
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Check className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-[11px] flex items-center justify-center">
                    {rev.customerName.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 leading-tight">{rev.customerName}</h5>
                    {rev.serviceUsed && (
                      <span className="text-[10px] text-slate-400 block">{rev.serviceUsed}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Leave a Review / Feedback Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl mx-auto flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Leave Your Feedback</h3>
            <p className="text-xs text-slate-500">
              Used our laundry service? Help us improve and let other neighbors know about your experience!
            </p>
          </div>

          {reviewSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thank you! Your testimonial has been published and added to our reviews above.</span>
            </div>
          )}

          {reviewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{reviewError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                Your Overall Rating
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || reviewRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 block text-center mt-1">
                {reviewRating === 5 && "Exceptional service (5/5)"}
                {reviewRating === 4 && "Great service (4/5)"}
                {reviewRating === 3 && "Average service (3/5)"}
                {reviewRating === 2 && "Needs improvement (2/5)"}
                {reviewRating === 1 && "Poor experience (1/5)"}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="e.g. Joy K."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Used
                </label>
                <select
                  value={reviewService}
                  onChange={(e) => setReviewService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white font-medium"
                >
                  <option value="Wash & Fold">Wash & Fold</option>
                  <option value="Suit Dry Cleaning">Suit Dry Cleaning</option>
                  <option value="Ironing & Pressing">Ironing & Pressing</option>
                  <option value="Bed Duvet Cleaning">Bed Duvet Cleaning</option>
                  <option value="Full Laundry Service">Full Laundry Service</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Review & Comments <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the collection speed, clothes freshness, ironing quality, and delivery rider?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {submittingReview ? (
                "Submitting Review..."
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit Review
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span>✨</span> Sparkle Spins
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Reliable laundry, dry cleaning, and garment care with scheduled doorstep collection and delivery.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Operational Hours</h5>
            <p>Monday – Saturday: 7:00 AM – 8:00 PM</p>
            <p>Sunday: 9:00 AM – 5:00 PM</p>
            <p className="text-slate-400 pt-1">Dispatch Hotline: +254 700 000 000</p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Internal Team</h5>
            <p className="text-slate-400">Dispatch riders and administrative staff can sign in to manage operations:</p>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onGoToDashboard || onGoToLogin}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5" /> Operations Dashboard
                </button>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-slate-800/80 text-center text-slate-400">
          © {new Date().getFullYear()} Sparkle Spins. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
