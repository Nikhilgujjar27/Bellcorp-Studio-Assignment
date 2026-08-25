import React from 'react';
import { Landmark, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AtmStatus as IAtmStatus } from '../services/api';

interface AtmStatusProps {
  status: IAtmStatus | null;
  isLoading: boolean;
}

const MAX_VAULT_CAPACITY = 50000;

export const AtmStatus: React.FC<AtmStatusProps> = ({ status, isLoading }) => {
  const cash = status?.availableCash ?? 0;
  const isHealthy = cash > 10000;
  const isLow = cash <= 10000 && cash > 0;
  const capacityPct = Math.min(100, Math.max(0, Math.round((cash / MAX_VAULT_CAPACITY) * 100)));

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col justify-between h-full relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/40">
      {/* Decorative top-right accent */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-100/60 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 relative z-10 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-slate-600">ATM Vault Status</h3>
              <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                ID #{status?.id || 1}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Terminal Cash Reservoir</p>
          </div>
        </div>

        <div className="shrink-0">
          {isHealthy && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
              Operational
            </span>
          )}
          {isLow && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap">
              <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
              Low Cash
            </span>
          )}
        </div>
      </div>

      {/* Vault Amount & Capacity Bar */}
      <div className="my-3 relative z-10">
        <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-sans">
          {isLoading && !status ? (
            <span className="text-slate-300 animate-pulse">₹---.--</span>
          ) : (
            formatCurrency(cash)
          )}
        </div>
        
        {/* Vault Capacity Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 font-bold">
            <span>Vault Capacity Level</span>
            <span className="font-extrabold text-slate-900">{capacityPct}% ({formatCurrency(cash)} / ₹50k)</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between text-xs sm:text-sm text-slate-500 relative z-10 font-medium">
        <span>Last Vault Audit Sync</span>
        <span className="font-bold text-slate-700">{status?.updatedAt ? formatDate(status.updatedAt) : 'Synchronized'}</span>
      </div>
    </div>
  );
};
