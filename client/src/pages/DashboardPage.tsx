import React, { useState, useEffect, useCallback } from 'react';
import { BalanceCard } from '../components/BalanceCard';
import { WithdrawForm } from '../components/WithdrawForm';
import { AtmStatus } from '../components/AtmStatus';
import { TransactionHistory } from '../components/TransactionHistory';
import { ConcurrencyDemo } from '../components/ConcurrencyDemo';
import { atmService, Transaction, AtmStatus as IAtmStatus, UserAccount } from '../services/api';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  user: UserAccount;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [atmStatus, setAtmStatus] = useState<IAtmStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingAtm, setIsLoadingAtm] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
      const res = await atmService.getTransactions(15);
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoadingTx(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchBalance();
    fetchAtmStatus();
    fetchTransactions();
  }, [fetchBalance, fetchAtmStatus, fetchTransactions]);

  const handleResetComplete = useCallback(() => {
    setFormResetKey((prev) => prev + 1);
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleWithdraw = async (amount: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    setIsWithdrawing(true);
    try {
      const res = await atmService.withdraw(amount);
      if (res.success && res.data) {
        refreshAll();
        return {
          success: true,
          message: `Successfully withdrew ₹${amount.toLocaleString('en-IN')}. New balance: ₹${res.data.balanceAfter.toLocaleString('en-IN')}`,
        };
      }
      return { success: false, error: res.error?.message || 'Withdrawal failed' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Withdrawal transaction failed';
      fetchTransactions();
      return { success: false, error: errorMsg };
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Welcoming Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, {user.holderName}
            </h2>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live Session
            </span>
          </div>
          <p className="text-xs sm:text-base text-slate-600 font-medium">
            Your account is secure and ready. Protected by PostgreSQL row-level locks.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-extrabold text-blue-700">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>256-bit Row Locked</span>
          </div>
          <button
            onClick={refreshAll}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
            title="Refresh all metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingBalance || isLoadingAtm || isLoadingTx ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Row: Balance Card & ATM Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <BalanceCard
            balance={balance}
            isCached={isCached}
            isLoading={isLoadingBalance}
            onRefresh={fetchBalance}
          />
        </div>
        <div>
          <AtmStatus status={atmStatus} isLoading={isLoadingAtm} />
        </div>
      </div>

      {/* Concurrency Safety Lab Highlight Section */}
      <div>
        <ConcurrencyDemo
          onTestComplete={refreshAll}
          onResetComplete={handleResetComplete}
        />
      </div>

      {/* Main Operations Grid: Withdrawal Form & Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <WithdrawForm
            onWithdraw={handleWithdraw}
            isWithdrawing={isWithdrawing}
            userBalance={balance}
            atmCash={atmStatus?.availableCash ?? null}
            resetKey={formResetKey}
          />
        </div>

        <div>
          <TransactionHistory
            transactions={transactions}
            isLoading={isLoadingTx}
          />
        </div>
      </div>
    </div>
  );
};
