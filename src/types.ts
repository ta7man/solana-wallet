export interface Account {
  index: number;
  name: string;
}

export interface StoredWallet {
  mnemonic: string;
  accounts: Account[];
}