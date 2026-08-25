import React from 'react';
import { ShieldCheck, LogOut, User, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../services/api';

interface NavbarProps {
  user: UserAccount | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">ATM Simulation</span>
              <span className="text-xs font-extrabold bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Bellcorp Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">Batch 08 Engineering Assignment</p>
          </div>
        </div>

        {/* User Info & Status Badges */}
        {user && (
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Operational System Badge */}
            <div className="hidden md:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Operational</span>
            </div>

            {/* User Account Pill */}
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs sm:text-sm text-slate-900 font-semibold">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900">{user.holderName}</span>
              <span className="text-slate-500 font-mono text-xs hidden sm:inline font-semibold">({user.accountNumber})</span>
            </div>

            {/* Logout Action */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer"
              title="Sign out of ATM session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
