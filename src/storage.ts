import fs from "fs";
import type { StoredWallet, Account } from "./types.js";

const FILE = "wallet.json";

export function walletExists(): boolean {
  return fs.existsSync(FILE);
}

export function saveWallet(
  mnemonic: string,
  accounts: Account[]
): void {
  const wallet: StoredWallet = {
    mnemonic,
    accounts
  };

  fs.writeFileSync(
    FILE,
    JSON.stringify(wallet, null, 2),
    { mode: 0o600 }
  );
}

export function loadWallet(): StoredWallet {
  if (!walletExists()) {
    throw new Error("Wallet does not exist");
  }

  const data = fs.readFileSync(FILE, "utf8");

  const wallet = JSON.parse(data) as {
    mnemonic: string;
    accounts?: Account[];
  };

  // Migrate old wallet.json files that only stored the mnemonic.
  if (!wallet.accounts) {
    wallet.accounts = [
      {
        index: 0,
        name: "Main"
      }
    ];

    saveWallet(wallet.mnemonic, wallet.accounts);
  }

  return {
    mnemonic: wallet.mnemonic,
    accounts: wallet.accounts
  };
}