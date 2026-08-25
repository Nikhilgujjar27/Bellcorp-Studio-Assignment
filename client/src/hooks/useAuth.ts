import { useState, useEffect } from 'react';
import { UserAccount } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('atm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('atm_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('atm_token', token);
    } else {
      localStorage.removeItem('atm_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('atm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('atm_user');
    }
  }, [user]);

  const login = (newToken: string, newUser: UserAccount) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('atm_token');
    localStorage.removeItem('atm_user');
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };
};
