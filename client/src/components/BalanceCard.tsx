import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, RefreshCw, Zap, Database } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface BalanceCardProps {
  balance: number | null;
  isCached: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  isCached,
  isLoading,
  onRefresh,
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevBalanceRef.current !== null && balance !== null && prevBalanceRef.current !== balance) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1400);
      return () => clearTimeout(timer);
    }
    prevBalanceRef.current = balance;
  }, [balance]);

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border shadow-md flex flex-col justify-between h-full relative overflow-hidden transition-all duration-500 ${
        isPulsing
          ? 'bg-gradient-to-br from-emerald-50 via-white to-blue-50/60 border-emerald-400 ring-2 ring-emerald-300/60 shadow-emerald-500/10'
          : 'bg-gradient-to-br from-white via-white to-blue-50/50 border-slate-200 bg-white'
      }`}
    >
      {/* Decorative top-right accent */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-3.5 rounded-2xl border shadow-sm shrink-0 transition-colors duration-300 ${
              isPulsing
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-slate-600">Available Balance</h3>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">INR</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Primary Checking ••••0001</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
          title="Refresh real-time balance"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="my-3 relative z-10">
        <div
          className={`text-5xl sm:text-6xl font-extrabold tracking-tight font-sans transition-all duration-300 ${
            isPulsing ? 'text-emerald-700 scale-[1.01]' : 'text-slate-900'
          }`}
        >
          {isLoading && balance === null ? (
            <span className="text-slate-300 animate-pulse">₹---.--</span>
          ) : (
            formatCurrency(balance)
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 font-semibold flex items-center space-x-1.5">
          <span>Source of Truth:</span>
          <strong className="text-slate-900 font-bold">PostgreSQL 15</strong>
          <span className="text-slate-400">• Row-Locked Transaction</span>
        </p>
      </div>

      {/* Status Footer Badge */}
      <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between text-xs sm:text-sm relative z-10">
        <div className="flex items-center">
          {isCached ? (
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300">
              <Zap className="w-4 h-4 mr-1.5 fill-amber-500 text-amber-500" />
              Redis Cache Hit (TTL: 60s)
            </span>
          ) : (
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <Database className="w-4 h-4 mr-1.5 text-emerald-600" />
              PostgreSQL Direct Fresh
            </span>
          )}
        </div>

        <span className="text-slate-400 text-xs font-semibold hidden sm:inline">Instant cache invalidation upon withdrawal</span>
      </div>
    </div>
  );
};
