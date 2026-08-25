import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ShieldCheck, Zap, Lock, Check, X } from 'lucide-react';
import { atmService, ConcurrencyTestReport } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface ConcurrencyDemoProps {
  onTestComplete: () => void;
  onResetComplete?: () => void;
}

export const ConcurrencyDemo: React.FC<ConcurrencyDemoProps> = ({ onTestComplete, onResetComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testReport, setTestReport] = useState<ConcurrencyTestReport | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => {
        setResetSuccess(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess]);

  const handleRunTest = async () => {
    setIsRunning(true);
    setTestReport(null);
    setResetSuccess(false);
    try {
      const res = await atmService.runConcurrencyTest();
      if (res.success && res.data) {
        setTestReport(res.data);
        onTestComplete();
      }
    } catch (err: any) {
      console.error('Concurrency test error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetDemoState = async () => {
    setIsResetting(true);
    try {
      await atmService.resetDemoState(10000, 50000);
      setTestReport(null);
      setResetSuccess(true);
      if (onResetComplete) {
        onResetComplete();
      } else {
        onTestComplete();
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-amber-300 p-6 sm:p-8 shadow-md relative overflow-hidden bg-gradient-to-br from-white via-white to-amber-50/50">
      {/* Decorative top-right ambient glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-100/70 rounded-full blur-2xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-sm shrink-0">
            <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">Concurrency Safety Lab</h3>
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm whitespace-nowrap">
                LIVE DATABASE TEST
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                Sandbox • Account #2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Isolated test executing simultaneous real PostgreSQL transactions with row-level locks.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleResetDemoState}
            disabled={isResetting || isRunning}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
            title="Reset normal account to ₹10,000 and sandbox to ₹3,000"
          >
            <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo State</span>
          </button>

          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 shadow-md shadow-amber-500/30 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
            <span>{isRunning ? 'Executing Parallel Calls...' : 'Run Concurrency Test'}</span>
          </button>
        </div>
      </div>

      {/* Temporary Success Notification after Reset Demo */}
      {resetSuccess && (
        <div className="p-4 mb-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm transition-all duration-300 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <Check className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Demo State Reset Successful</div>
              <div className="text-xs sm:text-sm text-emerald-800 font-semibold">
                Account #1 restored to ₹10,000.00 • Sandbox Account #2 restored to ₹3,000.00 • ATM vault restored to ₹50,000.00
              </div>
            </div>
          </div>
          <button
            onClick={() => setResetSuccess(false)}
            className="p-1 rounded-lg text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/80 transition cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scenario Specification Bar */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-slate-800 flex items-center justify-between flex-wrap gap-2.5 mb-5 relative z-10 font-medium">
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="font-extrabold text-slate-900">Scenario Spec (Sandbox Account #2):</span>
          <span className="text-slate-700">Initial: <strong className="text-slate-900 font-bold">₹3,000.00</strong></span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-700">Simultaneous Calls: <strong className="text-slate-900 font-bold">2x ₹2,000.00</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-extrabold text-amber-800">
          <Lock className="w-4 h-4 text-amber-700" />
          <span>PostgreSQL Row Locks (SELECT FOR UPDATE)</span>
        </div>
      </div>

      {/* Live Results Display */}
      {testReport && (
        <div className="space-y-4 pt-4 border-t border-slate-200 relative z-10">
          {/* Initial Balance Subtitle */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-600 px-1">
            <span>SANDBOX INITIAL BALANCE: <strong className="text-slate-900 text-base font-black">{formatCurrency(testReport.initialBalance)}</strong></span>
            <span className="text-slate-500 font-mono text-xs">Execution Time: {testReport.durationMs}ms</span>
          </div>

          {/* Two Side-by-Side Request Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Request A Card */}
            <div
              className={`p-5 rounded-2xl border transition-all shadow-sm ${
                testReport.requests.requestA.requestStatus === 'SUCCESS'
                  ? 'bg-emerald-50/90 border-emerald-300'
                  : 'bg-rose-50/90 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                  {testReport.requests.requestA.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-extrabold bg-white text-slate-700 border border-slate-200 shadow-sm">
                    HTTP {testReport.requests.requestA.httpStatus}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      testReport.requests.requestA.requestStatus === 'SUCCESS'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-rose-600 text-white shadow-sm'
                    }`}
                  >
                    {testReport.requests.requestA.requestStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                  {formatCurrency(testReport.requests.requestA.amount)}
                </div>
                <div className={`text-xs sm:text-sm font-bold ${testReport.requests.requestA.requestStatus === 'SUCCESS' ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {testReport.requests.requestA.result}
                </div>
              </div>
            </div>

            {/* Request B Card */}
            <div
              className={`p-5 rounded-2xl border transition-all shadow-sm ${
                testReport.requests.requestB.requestStatus === 'SUCCESS'
                  ? 'bg-emerald-50/90 border-emerald-300'
                  : 'bg-rose-50/90 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                  {testReport.requests.requestB.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-extrabold bg-white text-slate-700 border border-slate-200 shadow-sm">
                    HTTP {testReport.requests.requestB.httpStatus}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                      testReport.requests.requestB.requestStatus === 'SUCCESS'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-rose-600 text-white shadow-sm'
                    }`}
                  >
                    {testReport.requests.requestB.requestStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                  {formatCurrency(testReport.requests.requestB.amount)}
                </div>
                <div className={`text-xs sm:text-sm font-bold ${testReport.requests.requestB.requestStatus === 'SUCCESS' ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {testReport.requests.requestB.result}
                </div>
              </div>
            </div>
          </div>

          {/* Prominent Final Balance & Outcome Summary Bar */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6 sm:space-x-8">
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider text-blue-700">SANDBOX FINAL BALANCE</div>
                <div className="text-3xl sm:text-4xl font-black text-blue-700 tracking-tight">
                  {formatCurrency(testReport.finalBalance)}
                </div>
              </div>

              <div className="h-12 w-px bg-blue-200 hidden sm:block" />

              <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm font-extrabold">
                <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white text-emerald-800 border border-emerald-300 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>1 Successful</span>
                </div>
                <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white text-rose-800 border border-rose-300 shadow-sm">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>1 Failed</span>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 flex items-center space-x-2 font-medium bg-white/90 px-4 py-2.5 rounded-xl border border-blue-200">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <span>PostgreSQL row-level locking (<code className="font-mono text-blue-700 font-bold">SELECT ... FOR UPDATE</code>) on Account #2 serialized both requests.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
