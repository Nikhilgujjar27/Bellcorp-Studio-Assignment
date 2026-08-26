import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Centered Main Content */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-blue-100/70 border border-blue-200 text-blue-600 mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="mb-3">
            <span className="inline-flex items-center text-xs font-semibold bg-slate-200/70 text-slate-700 px-3.5 py-1 rounded-full">
              Bellcorp Studio • Batch 08
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            ATM Simulation Application
          </h1>

          <p className="text-sm text-slate-500 font-normal mt-2">
            Enter your account credentials to begin your secure session.
          </p>
        </div>

        {/* Elevated Authentication Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-7 sm:p-9 shadow-xl shadow-slate-200/60">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Account Number Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
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
                  className="w-full bg-slate-100/70 border border-slate-200/90 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 font-bold text-lg focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
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
                  className="w-full bg-slate-100/70 border border-slate-200/90 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 font-bold text-lg tracking-widest focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
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

            {/* Sign In Primary Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Test Account Helper Switcher */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Available Test Accounts (PIN: 1234)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountNumber('10000001');
                  setPin('1234');
                  setError(null);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  accountNumber === '10000001'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div>Demo User</div>
                <div className="font-mono text-[10px] text-slate-500">10000001 (₹10k)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountNumber('10000003');
                  setPin('1234');
                  setError(null);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  accountNumber === '10000003'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div>Sarah Jenkins</div>
                <div className="font-mono text-[10px] text-slate-500">10000003 (₹25k)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountNumber('10000004');
                  setPin('1234');
                  setError(null);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                  accountNumber === '10000004'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div>Rajesh Kumar</div>
                <div className="font-mono text-[10px] text-slate-500">10000004 (₹5k)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Trust Pill */}
        <div className="mt-6 flex justify-center">
          <div className="bg-slate-200/60 px-4 py-1.5 rounded-full text-xs text-slate-500 font-medium inline-flex items-center gap-1.5 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>256-bit Encrypted Session • Concurrency-Safe PostgreSQL Engine</span>
          </div>
        </div>
      </div>

      {/* Clean Bottom Legal / Certification Footer */}
      <footer className="w-full max-w-5xl mx-auto border-t border-slate-200/80 pt-5 pb-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-medium px-4 gap-2">
        <div>
          © 2026 Bellcorp Studio • Batch 08. All transactions are simulation-only.
        </div>
        <div className="flex items-center space-x-4">
          <span>Security Policy</span>
          <span>•</span>
          <span>Technical Certification</span>
          <span>•</span>
          <span>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
};
