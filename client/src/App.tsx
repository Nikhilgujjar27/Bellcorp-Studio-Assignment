import React from 'react';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-fintech-bg text-fintech-text flex flex-col selection:bg-fintech-blue-soft selection:text-fintech-blue">
      <Navbar user={user} onLogout={logout} />

      <main className="flex-1">
        {!isAuthenticated || !user ? (
          <LoginPage onLoginSuccess={login} />
        ) : (
          <DashboardPage user={user} />
        )}
      </main>

      <footer className="border-t border-fintech-border py-6 text-center text-xs text-fintech-muted bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 font-semibold">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-fintech-green"></span>
            <span>ApexBank ATM Terminal System • Concurrency-Safe Financial Engine</span>
          </div>
          <span className="text-fintech-subtle font-mono text-[11px]">PostgreSQL (Row Locks) • Redis Cache • MongoDB Audit</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
