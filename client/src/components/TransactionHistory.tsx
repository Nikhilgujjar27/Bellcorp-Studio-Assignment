import React from 'react';
import { History, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { Transaction } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading,
}) => {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3.5">
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 shadow-sm shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                Transaction & Audit History
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">PostgreSQL financial ledger</p>
            </div>
          </div>

          <span className="text-xs sm:text-sm font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {transactions.length} Records
          </span>
        </div>

        {/* Loading State */}
        {isLoading && transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs sm:text-sm flex items-center justify-center space-x-2">
            <Clock className="w-5 h-5 animate-spin text-blue-600" />
            <span>Fetching ledger records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs sm:text-sm font-semibold bg-slate-50 rounded-2xl border border-slate-200 p-6">
            No transaction records found for this account.
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[400px] pr-1">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b border-slate-200 text-slate-600 uppercase tracking-wider text-xs font-black">
                    <th className="pb-3 pr-3 font-black">Tx ID</th>
                    <th className="pb-3 pr-3 font-black">Amount</th>
                    <th className="pb-3 pr-3 font-black">Status</th>
                    <th className="pb-3 pr-3 font-black">Balance Flow</th>
                    <th className="pb-3 font-black">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isSuccess = tx.status === 'SUCCESS';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 pr-3 font-mono font-bold text-slate-500 text-xs">
                          #{tx.id}
                        </td>
                        <td className="py-3.5 pr-3 font-black text-slate-900 font-sans text-sm sm:text-base">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3.5 pr-3">
                          {isSuccess ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                              SUCCESS
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-300"
                              title={tx.failure_reason || 'Failed'}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                              FAILED {tx.failure_reason ? `(${tx.failure_reason})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-3 font-semibold text-slate-700 text-xs sm:text-sm">
                          {isSuccess ? (
                            <div className="flex items-center space-x-1.5">
                              <span>{formatCurrency(tx.balance_before)}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <strong className="text-emerald-700 font-extrabold">{formatCurrency(tx.balance_after)}</strong>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">Unchanged ({formatCurrency(tx.balance_before)})</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-500 text-xs font-medium">
                          {formatDate(tx.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Adaptive Cards View */}
            <div className="sm:hidden space-y-3">
              {transactions.map((tx) => {
                const isSuccess = tx.status === 'SUCCESS';
                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-500">#{tx.id}</span>
                        <span className="text-base font-black text-slate-900">{formatCurrency(tx.amount)}</span>
                      </div>
                      {isSuccess ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          FAILED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1.5 border-t border-slate-200 font-semibold">
                      <div>
                        {isSuccess ? (
                          <div className="flex items-center space-x-1.5">
                            <span>{formatCurrency(tx.balance_before)}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-emerald-700 font-bold">{formatCurrency(tx.balance_after)}</strong>
                          </div>
                        ) : (
                          <span>Balance: {formatCurrency(tx.balance_before)}</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(tx.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
