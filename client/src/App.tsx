import React from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <main className="flex-1 flex flex-col">
        {!isAuthenticated || !user ? (
          <LoginPage onLoginSuccess={login} />
        ) : (
          <DashboardPage user={user} onLogout={logout} />
        )}
      </main>
    </div>
  );
};

export default App;
