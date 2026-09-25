import type {
  WalletData,
  Account,
  Transaction
} from "./types";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    url,
    options
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Request failed"
    );
  }

  return data;
}

export async function getWallet(): Promise<WalletData> {
  return request<WalletData>(
    "/api/wallet"
  );
}

export async function createAccount(
  name: string
): Promise<Account> {
  return request<Account>(
    "/api/accounts",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name
      })
    }
  );
}

export async function sendSol(
  index: number,
  recipient: string,
  amount: string
) {
  return request<{
    hash: string;
    fee: string;
    feeSol: string;
    success: boolean;
  }>(
    "/api/send",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        index,
        recipient,
        amount
      })
    }
  );
}

export async function getTransactions(
  index: number
): Promise<{
  transactions: Transaction[];
}> {
  return request(
    `/api/accounts/${index}/transactions`
  );
}
