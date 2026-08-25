import React from 'react';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {isAuthenticated && user && (
        <Navbar user={user} onLogout={logout} />
      )}

      <main className="flex-1 flex flex-col">
        {!isAuthenticated || !user ? (
          <LoginPage onLoginSuccess={login} />
        ) : (
          <DashboardPage user={user} />
        )}
      </main>

      {isAuthenticated && user && (
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 font-semibold">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>ATM Simulation System • Bellcorp Studio</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">PostgreSQL (Row Locks) • Redis Cache • MongoDB Audit</span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
