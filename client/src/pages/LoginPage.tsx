import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, ArrowRight, Loader2, AlertCircle, User } from 'lucide-react';
import { authService, UserAccount } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (token: string, account: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [accountNumber, setAccountNumber] = useState('10000001');
  const [pin, setPin] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authService.login(accountNumber, pin);
      if (res.success && res.data) {
        onLoginSuccess(res.data.token, res.data.account);
      } else {
        setError(res.error?.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid account number or PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setAccountNumber('10000001');
    setPin('1234');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-md w-full my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mb-3 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="mb-2.5">
            <span className="inline-flex items-center text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 px-3 py-0.5 rounded-full">
              Bellcorp Studio • Batch 08
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ATM Simulation Application
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Enter your account credentials to begin your secure session
          </p>
        </div>

        {/* Elevated Authentication Card */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {/* Account Number Input */}
            <div>
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Account Number
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="10000001"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-slate-900 font-bold text-base sm:text-lg focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Secure PIN
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={pin}
                  maxLength={6}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-slate-900 font-bold text-base sm:text-lg tracking-widest focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Large Prominent Authenticate Button Matching Input Proportions */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base sm:text-lg shadow-lg shadow-blue-500/30 transition-all duration-150 flex items-center justify-center space-x-2.5 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Sign In Securely</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Distinct Demo Account Helper Section */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-xs sm:text-sm shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Use Demo Account (10000001 / 1234)</span>
            </button>
          </div>
        </div>

        {/* Security Trust Subtext with Perfect Inline Centering */}
        <div className="text-center text-xs text-slate-500 mt-4 font-medium flex items-center justify-center gap-1.5 flex-wrap">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>256-bit Encrypted Session • Concurrency-Safe PostgreSQL Engine</span>
        </div>
      </div>
    </div>
  );
};
