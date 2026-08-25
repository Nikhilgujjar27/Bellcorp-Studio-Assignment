import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('atm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are calling /auth/login
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('atm_token');
        localStorage.removeItem('atm_user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface UserAccount {
  id: number;
  accountNumber: string;
  holderName: string;
  balance?: number;
}

export interface Transaction {
  id: number;
  account_id: number;
  atm_id: number;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  failure_reason: string | null;
  balance_before: number | null;
  balance_after: number | null;
  created_at: string;
}

export interface AtmStatus {
  id: number;
  availableCash: number;
  updatedAt: string;
}

export interface ConcurrencyRequestResult {
  name: string;
  amount: number;
  requestStatus: 'SUCCESS' | 'FAILED';
  httpStatus: number;
  result: string;
}

export interface ConcurrencyTestReport {
  initialBalance: number;
  initialAtmCash: number;
  withdrawalAmount: number;
  successfulWithdrawals: number;
  failedWithdrawals: number;
  finalBalance: number;
  finalAtmCash: number;
  isConcurrencySafe: boolean;
  durationMs: number;
  requests: {
    requestA: ConcurrencyRequestResult;
    requestB: ConcurrencyRequestResult;
  };
}

export const authService = {
  login: async (accountNumber: string, pin: string) => {
    const res = await api.post<ApiResponse<{ token: string; account: UserAccount }>>('/auth/login', {
      accountNumber,
      pin,
    });
    return res.data;
  },
};

export const atmService = {
  getBalance: async () => {
    const res = await api.get<ApiResponse<{ balance: number; isCached: boolean; account: UserAccount }>>('/account/balance');
    return res.data;
  },
  getTransactions: async (limit: number = 20) => {
    const res = await api.get<ApiResponse<Transaction[]>>(`/transactions?limit=${limit}`);
    return res.data;
  },
  withdraw: async (amount: number, atmId: number = 1) => {
    const res = await api.post<ApiResponse<{
      withdrawalId: number;
      accountId: number;
      atmId: number;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      atmAvailableCashAfter: number;
      status: 'SUCCESS';
      timestamp: string;
    }>>('/withdraw', { amount, atmId });
    return res.data;
  },
  getAtmStatus: async (atmId: number = 1) => {
    const res = await api.get<ApiResponse<AtmStatus>>(`/atm/status?atmId=${atmId}`);
    return res.data;
  },
  resetDemoState: async (balance: number = 3000, atmCash: number = 50000) => {
    const res = await api.post<ApiResponse<{ balance: number; atmCash: number }>>('/dev/reset-seed', {
      balance,
      atmCash,
    });
    return res.data;
  },
  runConcurrencyTest: async () => {
    const res = await api.post<ApiResponse<ConcurrencyTestReport>>('/dev/concurrency-test');
    return res.data;
  },
};
