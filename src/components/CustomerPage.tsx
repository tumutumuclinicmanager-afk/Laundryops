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

  // Handle Order Submit (pricing determined by admin after pickup & weighing)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setOrderError("Please enter your name, phone number, and pickup address.");
      return;
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
        items: [] // Price and items set by admin after facility pickup & weighing
      };

      const created = await onPlaceOrder(orderPayload);
      if (created) {
        setConfirmedOrder(created);
        setReviewName(customerName);
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
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="truncate">Sparkle Spins • Doorstep Laundry & Garment Care</span>
          </div>
          <button
            type="button"
            onClick={onGoToDashboard || onGoToLogin}
            className="text-blue-300 hover:text-white font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px] shrink-0 ml-2"
          >
            Operations & Staff Dashboard &rarr;
          </button>
        </div>
      </div>

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-base shadow-xs shadow-blue-500/20">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none">Sparkle Spins</span>
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">
                  Client Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">Doorstep Laundry & Garment Care</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <a
              href="#book-order"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-2 py-1"
            >
              Book Pickup
            </a>
            <a
              href="#how-it-works"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2 py-1"
            >
              How It Works
            </a>
            <a
              href="#reviews"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2 py-1"
            >
              Testimonials
            </a>

            <button
              type="button"
              onClick={onGoToDashboard || onGoToLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operations</span> Dashboard
            </button>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Staff ({currentUserRole})
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoToLogin}
                className="hidden md:inline-flex bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                Staff Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 1. Schedule a Laundry Pickup (COMES FIRST) */}
      <section id="book-order" className="pt-2 sm:pt-3 pb-8 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        {/* Compact Hero Header - puts form front and center */}
        <div className="mb-3.5 sm:mb-4 text-center max-w-3xl mx-auto space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200/80">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Doorstep Laundry & Garment Care • Book in under 60 seconds
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Schedule a Laundry Pickup
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Choose your collection address, laundry items, and convenient pickup window. Pay on delivery (M-Pesa or Cash).
          </p>

          {/* Inline Trust Highlights - sleek single row */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-0.5 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 text-slate-700">
              <Truck className="w-3.5 h-3.5 text-emerald-600" /> Free Collection
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> 24h - 48h Turnaround
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-slate-700">
              <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" /> Pay on Delivery
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> 4.9★ Customer Rating
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
          <form onSubmit={handleSubmitOrder} className="grid lg:grid-cols-12 gap-5">
            {/* Left Column: Customer Details & Schedule */}
            <div className="lg:col-span-7 space-y-4">
              {/* Step 1: Contact Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Your Contact & Pickup Address</h3>
                    <p className="text-[11px] text-slate-500">We'll use this to coordinate rider collection</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Wanjiku Mwangi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number (M-Pesa / Calls) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. +254 712 345678"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Neighborhood / Estate <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="e.g. Kilimani, Rose Ave, Apt 4B"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                      placeholder="e.g. Gate code #3321, please call before entering, delicate fabrics"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Scheduling Time Slots */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Schedule Pickup & Return Date</h3>
                    <p className="text-[11px] text-slate-500">Pick the time window convenient for you</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  {/* Pickup */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Pickup Date
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      min={todayStr}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-[11px] font-semibold text-slate-500 mt-1">
                      Pickup Window
                    </label>
                    <select
                      value={pickupTimeWindow}
                      onChange={(e) => setPickupTimeWindow(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeSlots.map(slot => (
                        <option key={`pick-${slot}`} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Preferred Delivery Date
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      min={pickupDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-[11px] font-semibold text-slate-500 mt-1">
                      Delivery Window
                    </label>
                    <select
                      value={deliveryTimeWindow}
                      onChange={(e) => setDeliveryTimeWindow(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeSlots.map(slot => (
                        <option key={`del-${slot}`} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Weighing Transparency Card */}
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-200/80 p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    ⚖️
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Post-Pickup Weighing & Transparent Pricing</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-600">No guesswork required when booking online</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Prices are not charged upfront. Our rider collects your laundry bags from your doorstep. At our facility, specialists sort, inspect, and weigh your items on precision scales. You will receive an official itemized <strong>SMS invoice</strong> with the exact verified total before delivery.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <div className="bg-white/80 border border-blue-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Step 1</span>
                    <strong className="text-[11px] text-slate-800 block">Free Pickup</strong>
                    <span className="text-[9px] text-slate-500">At your door</span>
                  </div>
                  <div className="bg-white/80 border border-blue-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Step 2</span>
                    <strong className="text-[11px] text-slate-800 block">Facility Weigh</strong>
                    <span className="text-[9px] text-slate-500">Precision scales</span>
                  </div>
                  <div className="bg-white/80 border border-blue-100 p-2 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Step 3</span>
                    <strong className="text-[11px] text-slate-800 block">SMS Invoice</strong>
                    <span className="text-[9px] text-slate-500">Pay on delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Pickup Request Summary & Placement Button */}
            <div className="lg:col-span-5">
              <div className="sticky top-16 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-md shadow-slate-200/50 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Pickup Request Summary
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Free Collection
                  </span>
                </div>

                {orderError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Booking Key Info */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500 font-medium">Customer:</span>
                    <span className="font-bold text-slate-900 text-right">
                      {customerName.trim() || <span className="text-slate-400 font-normal italic">Enter your name</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500 font-medium">Phone for SMS:</span>
                    <span className="font-bold text-slate-900 text-right">
                      {customerPhone.trim() || <span className="text-slate-400 font-normal italic">Enter phone number</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500 font-medium">Pickup Location:</span>
                    <span className="font-bold text-slate-900 text-right max-w-[180px] truncate">
                      {customerAddress.trim() || <span className="text-slate-400 font-normal italic">Enter address/estate</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500 font-medium">Scheduled Pickup:</span>
                    <span className="font-bold text-blue-700">{pickupDate} ({pickupTimeWindow})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Preferred Return:</span>
                    <span className="font-bold text-slate-800">{deliveryDate} ({deliveryTimeWindow})</span>
                  </div>
                </div>

                {/* Pre-Delivery Invoicing Notice Card */}
                <div className="bg-blue-50/90 rounded-xl p-3 space-y-1.5 text-xs border border-blue-200">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs sm:text-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>How Payment & Invoicing Works</span>
                  </div>
                  <div className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Free Collection:</strong> No pickup or collection bag charges.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Accurate Weighing:</strong> Checked & weighed on calibrated facility scales.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Itemized SMS Invoice:</strong> Exact breakdown texted before return.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Pay on Delivery:</strong> Inspect garments & pay via M-Pesa or Cash.</span>
                    </div>
                  </div>
                </div>

                {/* Amount Due at Booking */}
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Due at Booking:</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700">KSh 0 (Pay on Delivery)</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Scheduling Pickup...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" /> Schedule Laundry Pickup
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-medium">
                  SMS invoice sent after facility weighing • Pay on delivery
                </p>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white border-y border-slate-200 py-12">
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
              <h4 className="font-bold text-slate-900 text-sm">Schedule Pickup Online</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your collection address and convenient time slot. No upfront card or payment required.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl mx-auto flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Weighed & Invoiced via SMS</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rider collects your bags. Our facility weighs and inspects your garments, and texts you an itemized SMS invoice.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl mx-auto flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Delivered Fresh & Pay</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive your fresh garments neatly folded and protected. Settle payment conveniently upon delivery via M-Pesa or Cash.
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
