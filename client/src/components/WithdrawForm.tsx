import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, CheckCircle2, AlertCircle, Loader2, Banknote } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface WithdrawFormProps {
  onWithdraw: (amount: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  isWithdrawing: boolean;
  userBalance?: number | null;
  atmCash?: number | null;
  resetKey?: number;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export const WithdrawForm: React.FC<WithdrawFormProps> = ({
  onWithdraw,
  isWithdrawing,
  resetKey,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset internal form state upon Reset Demo State trigger
  useEffect(() => {
    setAmount('');
    setFeedback(null);
  }, [resetKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive withdrawal amount' });
      return;
    }

    // Always dispatch withdrawal to backend to ensure real PostgreSQL ACID transaction,
    // row-level locking, and permanent audit ledger recording even on failure.
    const res = await onWithdraw(numAmount);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message || `Successfully withdrew ${formatCurrency(numAmount)}!` });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Withdrawal failed' });
    }
  };

  const handleQuickSelect = (val: number) => {
    setAmount(val.toString());
    setFeedback(null);
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md">
      {/* Header */}
      <div className="flex items-center space-x-3.5 mb-5">
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-sm shrink-0">
          <Banknote className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
            Withdraw Money
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Atomic PostgreSQL transaction protected by row-level locking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Quick Amount Buttons */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">Quick Amount</label>
            <span className="text-xs text-slate-400 font-medium">Select denomination</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {QUICK_AMOUNTS.map((val) => {
              const isSelected = amount === val.toString();
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickSelect(val)}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]'
                      : 'bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-800 border-slate-200'
                  }`}
                >
                  ₹{val.toLocaleString('en-IN')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div>
          <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
            Or Enter Custom Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-xl">₹</span>
            <input
              type="number"
              min="1"
              max="100000"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setFeedback(null);
              }}
              placeholder="e.g. 1000"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 sm:py-4 text-slate-900 font-extrabold text-lg sm:text-xl focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              disabled={isWithdrawing}
            />
          </div>
        </div>

        {/* Feedback Alerts */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs sm:text-sm font-semibold transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">{feedback.message}</div>
          </div>
        )}

        {/* Prominent High-Contrast Withdraw Cash Button Matching Input Weight */}
        <button
          type="submit"
          disabled={isWithdrawing || !amount}
          className="w-full h-14 mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base sm:text-lg shadow-lg shadow-blue-500/30 transition-all duration-150 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isWithdrawing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Acquiring Lock & Dispensing...</span>
            </>
          ) : (
            <>
              <ArrowDownCircle className="w-5 h-5" />
              <span>Withdraw Cash</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
