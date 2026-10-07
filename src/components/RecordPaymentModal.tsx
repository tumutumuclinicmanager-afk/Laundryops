import React, { useState } from "react";
import { Order } from "../types";
import { DollarSign, CheckCircle, CreditCard, Banknote, Smartphone, Check, AlertCircle, RefreshCw } from "lucide-react";

interface RecordPaymentModalProps {
  order: Order;
  onClose: () => void;
  onSubmitPayment: (paymentData: { orderId: string; amount: number; method: string; reference?: string; notes?: string }) => Promise<boolean | void> | void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  order,
  onClose,
  onSubmitPayment
}) => {
  const initialPayAmount = order.balanceDue > 0 ? order.balanceDue : (order.total > 0 ? order.total : 500);
  const [amount, setAmount] = useState<string>(initialPayAmount.toString());
  const [method, setMethod] = useState<'M-Pesa' | 'Cash' | 'Bank Transfer' | 'Card'>('M-Pesa');
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;

  const handleSelectPreset = (presetAmt: number) => {
    setAmount(presetAmt.toString());
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than KSh 0.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      await onSubmitPayment({
        orderId: order.id,
        amount: numAmount,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("[Record Payment Error]", err);
      setErrorMessage(err?.message || "Failed to record payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              💵
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Record Payment</h2>
              <p className="text-xs text-slate-500 font-medium">
                Order <strong className="text-blue-600">{order.orderNumber}</strong> • {order.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Order Balance Summary Card */}
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4 rounded-2xl border border-slate-200/80 mb-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Total Bill</span>
              <span className="text-xs font-black text-slate-800">KSh {order.total.toLocaleString()}</span>
            </div>
            <div className="border-x border-slate-200 px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Paid So Far</span>
              <span className="text-xs font-black text-emerald-600">KSh {order.amountPaid.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-0.5">Balance Due</span>
              <span className="text-sm font-black text-rose-600">KSh {order.balanceDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Payment Successfully Settled!</h3>
            <p className="text-xs text-slate-600">
              KSh {numAmount.toLocaleString()} via <strong>{method}</strong> has been recorded and synced to Firebase.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick 1-Click Preset Buttons */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                ⚡ 1-Click Settlement Presets:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {order.balanceDue > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(order.balanceDue)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        numAmount === order.balanceDue
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      Full Balance (KSh {order.balanceDue.toLocaleString()})
                    </button>

                    {order.balanceDue > 400 ? (
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(Math.round(order.balanceDue / 2))}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          numAmount === Math.round(order.balanceDue / 2)
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        50% (KSh {Math.round(order.balanceDue / 2).toLocaleString()})
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(order.total || 300)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          numAmount === (order.total || 300)
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Total Bill
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectPreset(order.total > 0 ? order.total : 500)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        numAmount === (order.total > 0 ? order.total : 500) && numAmount !== order.balanceDue
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {order.total > 0 ? `Total (KSh ${order.total.toLocaleString()})` : "Standard KSh 500"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(300)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        numAmount === 300 ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      KSh 300
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(500)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        numAmount === 500 ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      KSh 500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(1000)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        numAmount === 1000 ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      KSh 1,000
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount Received (KSh) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">KSh</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Payment Method Selector Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'M-Pesa', label: '🟢 M-Pesa', icon: Smartphone },
                  { id: 'Cash', label: '💵 Cash', icon: Banknote },
                  { id: 'Card', label: '💳 Card', icon: CreditCard },
                  { id: 'Bank Transfer', label: '🏦 Bank', icon: DollarSign }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      method === m.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {method === 'M-Pesa' ? 'M-Pesa Ref (e.g. QK838...)' : 'Receipt / Ref Code'}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={method === 'M-Pesa' ? 'e.g. SH9482710' : 'e.g. REC-1029'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid on delivery to rider"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || numAmount <= 0}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Settling Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm KSh {numAmount.toLocaleString()} Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

