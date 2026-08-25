export interface Account {
  id: number;
  account_number: string;
  holder_name: string;
  pin_hash: string;
  balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface Atm {
  id: number;
  available_cash: number;
  updated_at: Date;
}

export interface Withdrawal {
  id: number;
  account_id: number;
  atm_id: number;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  failure_reason: string | null;
  balance_before: number | null;
  balance_after: number | null;
  created_at: Date;
}

export interface UserPayload {
  accountId: number;
  accountNumber: string;
  holderName: string;
}

export interface WithdrawalResult {
  withdrawalId: number;
  accountId: number;
  atmId: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  atmAvailableCashAfter: number;
  status: 'SUCCESS';
  timestamp: string;
}
