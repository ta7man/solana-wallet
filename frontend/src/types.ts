export interface Account {
  index: number;
  name: string;
  address: string;
  balance: string;
  balanceSol: string;
}

export interface WalletData {
  accounts: Account[];
}

export interface Transaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  success: boolean;
}
