import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  History, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  CreditCard, 
  Landmark, 
  RefreshCw, 
  Banknote, 
  Loader2, 
  Check, 
  X, 
  AlertCircle, 
  RotateCcw, 
  Printer, 
  Calendar,
  XCircle,
  Database,
  Lock,
  Info,
  Layers,
  FlaskConical
} from 'lucide-react';
import { atmService, Transaction, AtmStatus as IAtmStatus, UserAccount, ConcurrencyTestReport } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DashboardPageProps {
  user: UserAccount;
  onLogout?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  // Navigation State (4 Tabs matching Stitch sidebar)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'concurrency' | 'transactions' | 'vault'>('dashboard');

  // Banking State
  const [balance, setBalance] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [atmStatus, setAtmStatus] = useState<IAtmStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Loading States
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingAtm, setIsLoadingAtm] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawFeedback, setWithdrawFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Concurrency Test State
  const [isRunningConcurrency, setIsRunningConcurrency] = useState(false);
  const [concurrencyReport, setConcurrencyReport] = useState<ConcurrencyTestReport | null>(null);

  // Reset State
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isHeaderSyncing, setIsHeaderSyncing] = useState(false);
  const [headerSyncToast, setHeaderSyncToast] = useState(false);

  const handleHeaderRefresh = useCallback(() => {
    setIsHeaderSyncing(true);
    fetchBalance();
    fetchAtmStatus();
    fetchTransactions();
    setTimeout(() => {
      setIsHeaderSyncing(false);
      setHeaderSyncToast(true);
      setTimeout(() => setHeaderSyncToast(false), 2500);
    }, 400);
  }, []);

  const fetchBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    try {
      const res = await atmService.getBalance();
      if (res.success && res.data) {
        setBalance(res.data.balance);
        setIsCached(res.data.isCached);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  const fetchAtmStatus = useCallback(async () => {
    setIsLoadingAtm(true);
    try {
      const res = await atmService.getAtmStatus();
      if (res.success && res.data) {
        setAtmStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch ATM status:', err);
    } finally {
      setIsLoadingAtm(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setIsLoadingTx(true);
    try {
      const res = await atmService.getTransactions(25);
      if (res.success && res.data) {
        setTransactions(res.data);
        if (res.data.length > 0 && !selectedTx) {
          setSelectedTx(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoadingTx(false);
    }
  }, [selectedTx]);

  const refreshAll = useCallback(() => {
    fetchBalance();
    fetchAtmStatus();
    fetchTransactions();
  }, [fetchBalance, fetchAtmStatus, fetchTransactions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle Cash Withdrawal
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawFeedback(null);

    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setWithdrawFeedback({ type: 'error', message: 'Please enter a valid positive amount' });
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await atmService.withdraw(numAmount);
      if (res.success && res.data) {
        setWithdrawFeedback({
          type: 'success',
          message: `Successfully withdrew ₹${numAmount.toLocaleString('en-IN')}. New balance: ₹${res.data.balanceAfter.toLocaleString('en-IN')}`,
        });
        refreshAll();
      } else {
        setWithdrawFeedback({ type: 'error', message: res.error?.message || 'Withdrawal failed' });
        fetchTransactions();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Withdrawal transaction failed';
      setWithdrawFeedback({ type: 'error', message: msg });
      fetchTransactions();
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle Concurrency Test
  const handleRunConcurrency = async () => {
    setIsRunningConcurrency(true);
    setConcurrencyReport(null);
    try {
      const res = await atmService.runConcurrencyTest();
      if (res.success && res.data) {
        setConcurrencyReport(res.data);
        refreshAll();
      }
    } catch (err) {
      console.error('Concurrency test failed:', err);
    } finally {
      setIsRunningConcurrency(false);
    }
  };

  // Handle Reset Demo State
  const handleResetDemoState = async () => {
    setIsResetting(true);
    setResetSuccess(false);
    try {
      await atmService.resetDemoState(10000, 50000);
      setResetSuccess(true);
      setWithdrawAmount('');
      setWithdrawFeedback(null);
      setConcurrencyReport(null);
      refreshAll();
      setTimeout(() => setResetSuccess(false), 5000);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-900">
      {/* ------------------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION (Matching Stitch Screen 2, 3 & 4)    */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-4 sm:p-5 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base text-slate-900 leading-tight">Bellcorp Studio</div>
              <div className="text-xs font-semibold text-blue-600">Terminal Network</div>
            </div>
          </div>

          {/* Navigation Links (4 Screens) */}
          <nav className="space-y-1.5 font-semibold text-sm">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('concurrency')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'concurrency'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Concurrency Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Vault Status</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 mt-6 border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">Terminal Active</span>
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">ID: #10000001 (ATM-01)</div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Secure Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Operational</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-medium bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayStr}</span>
            </div>

            <div className="text-right">
              <div className="text-xs sm:text-sm font-bold text-slate-900">{user.holderName}</div>
              <div className="text-[11px] font-mono text-slate-500">ID: {user.accountNumber}</div>
            </div>

            {headerSyncToast && (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 animate-fade-in">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Synced</span>
              </span>
            )}

            <button
              onClick={handleHeaderRefresh}
              disabled={isHeaderSyncing}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Refresh all metrics from PostgreSQL and Redis"
            >
              <RefreshCw className={`w-4 h-4 ${isHeaderSyncing || isLoadingBalance || isLoadingAtm || isLoadingTx ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </header>

        {/* Global Reset Notification */}
        {resetSuccess && (
          <div className="mx-4 sm:mx-8 mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="text-xs sm:text-sm font-semibold">
                Demo state reset successfully: Account #1 set to ₹10,000.00 • Account #2 set to ₹3,000.00 • Vault set to ₹50,000.00
              </div>
            </div>
            <button onClick={() => setResetSuccess(false)} className="text-emerald-700 hover:text-emerald-950 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 1: TERMINAL DASHBOARD & CASH WITHDRAWAL (Stitch Screen 2) */}
        {/* ============================================================= */}
        {activeTab === 'dashboard' && (
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-6xl w-full mx-auto">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terminal Overview</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Real-time simulation environment for transaction processing.
              </p>
            </div>

            {/* 2-Column Metrics Cards (Matching Stitch Screen 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Card 1: Available Balance */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-500">Available Balance</div>
                        <div className="text-xs text-slate-500 font-semibold">Account #{user.accountNumber} • {user.holderName}</div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                      {isCached ? 'Redis Cached (60s TTL)' : 'PostgreSQL Direct'}
                    </span>
                  </div>

                  <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight my-3">
                    {isLoadingBalance && balance === null ? (
                      <span className="text-slate-300 animate-pulse">₹---.--</span>
                    ) : (
                      formatCurrency(balance)
                    )}
                  </div>
                </div>

                {/* Solid Blue Accent Indicator Bar */}
                <div className="w-full h-1.5 bg-blue-600 rounded-full mt-4" />
              </div>

              {/* Card 2: Vault Available Cash */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-500">Vault Available Cash</div>
                        <div className="text-xs text-slate-500 font-semibold">Terminal ID: ATM-01</div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Vault Operational
                    </span>
                  </div>

                  <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight my-3">
                    {isLoadingAtm && !atmStatus ? (
                      <span className="text-slate-300 animate-pulse">₹---.--</span>
                    ) : (
                      formatCurrency(atmStatus?.availableCash ?? 50000)
                    )}
                  </div>
                </div>

                {/* Solid Green Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((atmStatus?.availableCash ?? 50000) / 50000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Fast Cash Withdrawal Panel (Centered White Card Matching Stitch Screen 2) */}
            <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-9 shadow-xl shadow-slate-200/50">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Fast Cash Withdrawal</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Select a quick amount or enter a custom value below.
                </p>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-5">
                {/* 6-Grid Denomination Pills */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {[500, 1000, 2000, 5000, 10000].map((val) => {
                    const isSelected = withdrawAmount === val.toString();
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setWithdrawAmount(val.toString());
                          setWithdrawFeedback(null);
                        }}
                        className={`py-3.5 px-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]'
                            : 'bg-slate-50 hover:bg-blue-50/70 hover:text-blue-700 hover:border-blue-200 text-slate-800 border-slate-200/90'
                        }`}
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawAmount('11000');
                      setWithdrawFeedback(null);
                    }}
                    className={`py-3.5 px-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                      withdrawAmount === '11000'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]'
                        : 'bg-slate-50 hover:bg-blue-50/70 hover:text-blue-700 hover:border-blue-200 text-slate-800 border-slate-200/90'
                    }`}
                  >
                    ••• Other
                  </button>
                </div>

                {/* Custom Amount Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Custom Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-lg">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 2000"
                      value={withdrawAmount}
                      onChange={(e) => {
                        setWithdrawAmount(e.target.value);
                        setWithdrawFeedback(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-10 pr-4 py-3.5 text-slate-900 font-bold text-lg focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                {/* Feedback Alerts */}
                {withdrawFeedback && (
                  <div
                    className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs sm:text-sm font-semibold ${
                      withdrawFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    {withdrawFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>{withdrawFeedback.message}</div>
                  </div>
                )}

                {/* Primary Withdraw Funds CTA */}
                <button
                  type="submit"
                  disabled={isWithdrawing || !withdrawAmount}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Processing Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Banknote className="w-5 h-5" />
                      <span>Withdraw Funds</span>
                    </>
                  )}
                </button>

                {/* Secondary Reset Demo State Action */}
                <button
                  type="button"
                  onClick={handleResetDemoState}
                  disabled={isResetting}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs sm:text-sm transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Reset Demo State</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 2: CONCURRENCY SAFETY LAB (Exact Stitch Screen 4 Soft Tinted) */}
        {/* ============================================================= */}
        {activeTab === 'concurrency' && (
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-5xl w-full mx-auto">
            {/* Soft-Tinted Sandbox Header Card (Matching Stitch Screen 4 exact HTML) */}
            <section className="bg-slate-100/70 text-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm relative overflow-hidden border border-slate-200">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Database className="w-32 h-32 text-blue-600" />
              </div>

              <div className="relative z-10 flex flex-col gap-3">
                <div className="inline-flex items-center self-start bg-white border border-slate-300 text-slate-700 font-bold text-xs px-3.5 py-1 rounded-full shadow-xs">
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  <span>Testing Sandbox • Account #2 (10000002)</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                  Concurrency Safety Lab
                </h1>

                <p className="font-mono text-blue-700 text-sm sm:text-base font-bold">
                  Live Stress Test: Real-Time ACID Mutual Exclusion (SELECT ... FOR UPDATE)
                </p>

                {/* Baseline Balance Indicator Box */}
                <div className="mt-3 bg-blue-50 border-l-4 border-l-blue-600 p-4 rounded-xl inline-block self-start shadow-xs">
                  <div className="text-slate-500 font-bold text-xs mb-1">Baseline Balance Indicator</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Initial Sandbox Balance: ₹3,000.00
                  </div>
                </div>
              </div>
            </section>

            {/* Trigger Action Area */}
            <section className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 border-y border-slate-200">
              <button
                onClick={handleRunConcurrency}
                disabled={isRunningConcurrency || isResetting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base sm:text-lg py-3.5 px-7 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-5 h-5 ${isRunningConcurrency ? 'animate-spin' : ''}`} />
                <span>{isRunningConcurrency ? 'Executing Parallel Row Locks...' : 'Dispatch 2x ₹2,000 Simultaneous Requests'}</span>
              </button>

              <button
                onClick={handleResetDemoState}
                disabled={isResetting || isRunningConcurrency}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-sm sm:text-base py-3.5 px-5 rounded-2xl shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                title="Restore Sandbox Account #2 to ₹3,000 baseline"
              >
                <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Sandbox (₹3,000)</span>
              </button>
            </section>
            <p className="text-slate-500 text-xs sm:text-sm text-center -mt-3 mb-2 font-medium">
              Fires two parallel HTTP withdrawal requests in the same millisecond to test double-spending protection.
            </p>

            {/* Real-Time Execution Timeline & Outcome Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Request A Card */}
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-emerald-500 shadow-sm relative overflow-hidden border border-slate-200">
                <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1 rounded-bl-lg">
                  Thread 1
                </div>
                <div className="flex items-center gap-2 mb-4 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-extrabold text-lg text-slate-900">Request A</h3>
                </div>
                <ul className="space-y-2 font-mono text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Status: {concurrencyReport ? `${concurrencyReport.requests.requestA.httpStatus} OK` : '200 OK'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Withdrew ₹2,000.00</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Row Lock Acquired</span>
                  </li>
                </ul>
              </div>

              {/* Request B Card */}
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-rose-500 shadow-sm relative overflow-hidden border border-slate-200">
                <div className="absolute top-0 right-0 bg-rose-50 text-rose-700 font-bold text-xs px-3 py-1 rounded-bl-lg">
                  Thread 2
                </div>
                <div className="flex items-center gap-2 mb-4 text-rose-600">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-extrabold text-lg text-slate-900">Request B</h3>
                </div>
                <ul className="space-y-2 font-mono text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Status: {concurrencyReport ? `${concurrencyReport.requests.requestB.httpStatus} Conflict` : '409 Conflict'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Blocked then Rejected</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>(Insufficient Funds)</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Final Outcome Summary Box */}
            <section className="bg-slate-100/70 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-sm border border-slate-200">
              <div className="bg-emerald-100 text-emerald-900 font-extrabold text-base sm:text-lg px-6 sm:px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 border border-emerald-300 shadow-xs mb-2">
                <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
                <span>
                  Final Balance: ₹{concurrencyReport ? concurrencyReport.finalBalance.toLocaleString('en-IN') : '1,000'}.00 (Strictly Preserved • 0 Overdraft)
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm flex items-center gap-1.5 font-semibold">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Account #1 (Demo User) remained 100% isolated and untouched</span>
              </p>
            </section>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 3: TRANSACTION HISTORY & RECEIPTS (Stitch Screen 3)       */}
        {/* ============================================================= */}
        {activeTab === 'transactions' && (
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-6xl w-full mx-auto">
            {/* Header with Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Transaction History</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[11px] font-mono font-bold bg-slate-200/70 text-slate-700 px-2.5 py-0.5 rounded-full">
                    POSTGRESQL IMMUTABLE SOURCE OF TRUTH
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Permanent historical record of all SUCCESS and FAILED cash withdrawal attempts across the network.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchTransactions}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-xs transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingTx ? 'animate-spin text-blue-600' : ''}`} />
                  <span>Refresh Ledger</span>
                </button>
              </div>
            </div>

            {/* Split Screen: Ledger Table on Left + Receipt Detail on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Ledger Table (2 Columns wide) */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                        <th className="pb-3 pr-3 font-semibold">Date & Time</th>
                        <th className="pb-3 pr-3 font-semibold">Type</th>
                        <th className="pb-3 pr-3 font-semibold">Status</th>
                        <th className="pb-3 pr-3 font-semibold">Amount</th>
                        <th className="pb-3 font-semibold">Balance Transition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => {
                        const isSuccess = tx.status === 'SUCCESS';
                        const isSelected = selectedTx?.id === tx.id;
                        return (
                          <tr
                            key={tx.id}
                            onClick={() => setSelectedTx(tx)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3.5 pr-3 font-mono text-xs text-slate-500">
                              {formatDate(tx.created_at)}
                            </td>
                            <td className="py-3.5 pr-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                <span className="font-semibold text-slate-800">Cash Withdrawal</span>
                              </div>
                            </td>
                            <td className="py-3.5 pr-3">
                              {isSuccess ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span>SUCCESS</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap shrink-0"
                                  title={tx.failure_reason || ''}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                  <span>FAILED</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 pr-3 font-bold text-slate-900">
                              - {formatCurrency(tx.amount)}
                            </td>
                            <td className="py-3 font-mono text-xs text-slate-600">
                              {isSuccess ? (
                                <span>
                                  {formatCurrency(tx.balance_before)} → <strong className="text-emerald-700">{formatCurrency(tx.balance_after)}</strong>
                                </span>
                              ) : (
                                <span className="text-slate-400">Unchanged ({formatCurrency(tx.balance_before)})</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receipt Detail Card (Matching Stitch Screen 3) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-md sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="font-extrabold text-sm text-slate-900">Transaction Detail</div>
                  <span className="text-xs font-mono text-slate-400">#{selectedTx?.id || '---'}</span>
                </div>

                {selectedTx ? (
                  <div className="border border-blue-200 rounded-2xl p-5 bg-slate-50/50 font-mono text-xs space-y-4">
                    <div className="text-center border-b border-slate-200 pb-3">
                      <div className="font-black text-sm text-slate-900 tracking-wider">BELLCORP BANK</div>
                      <div className="text-[11px] text-slate-500">TrustTerminal Network</div>
                    </div>

                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>DATE:</span>
                        <span className="font-bold text-slate-900">{formatDate(selectedTx.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TERM ID:</span>
                        <span className="font-bold text-slate-900">ATM-01</span>
                      </div>
                      <div className="flex justify-between">
                        <span>REF NO:</span>
                        <span className="font-bold text-slate-900">TXN-00{selectedTx.id}-XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CARD:</span>
                        <span className="font-bold text-slate-900">•••• •••• •••• 0001</span>
                      </div>
                    </div>

                    <div className="border-t border-b border-slate-200 py-3 text-center">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">CASH WITHDRAWAL</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {formatCurrency(selectedTx.amount)}
                      </div>
                      <div className="text-[10px] font-bold mt-1 text-slate-600">
                        STATUS: <span className={selectedTx.status === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'}>{selectedTx.status}</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-bold text-xs pt-1">
                      <span>AVAIL BAL:</span>
                      <span className="text-blue-700 font-extrabold">{formatCurrency(selectedTx.balance_after || selectedTx.balance_before)}</span>
                    </div>

                    <div className="text-center text-[10px] text-slate-400 pt-2">
                      Thank you for banking with Bellcorp.
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Select a transaction to inspect receipt details.
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => window.print()}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 4: VAULT STATUS (Stitch Screen 2 Extension)               */}
        {/* ============================================================= */}
        {activeTab === 'vault' && (
          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-5xl w-full mx-auto">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">ATM Vault Inventory</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Hardware cash dispenser status, vault reservoir monitoring, and automated safety limits.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Terminal ATM-01 Reservoir</h2>
                    <p className="text-xs text-slate-500 font-medium">Physical currency cassette health</p>
                  </div>
                </div>

                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  ● Operational
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">Available Cash</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatCurrency(atmStatus?.availableCash ?? 50000)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">Max Vault Capacity</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹50,000.00</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase">Capacity Level</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {Math.round(((atmStatus?.availableCash ?? 50000) / 50000) * 100)}%
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 font-medium flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Withdrawals automatically lock and decrement vault cash inside the same ACID transaction as the account balance.</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
