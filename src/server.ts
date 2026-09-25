import "dotenv/config";

import express from "express";
import cors from "cors";

import {
  loadWallet,
  saveWallet
} from "./storage.js";

import {
  getAddress,
  getBalance,
  lamportsToSol,
  sendSol,
  waitForTransaction
} from "./wallet.js";

const app = express();

const PORT = 3001;

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

function getWallet() {
  return loadWallet();
}

app.get("/api/wallet", async (_req, res) => {
  try {
    const wallet = getWallet();

    const accounts = [];

    for (const account of wallet.accounts) {
      const address = await getAddress(
        wallet.mnemonic,
        account.index
      );

      const balance = await getBalance(
        wallet.mnemonic,
        account.index
      );

      accounts.push({
        index: account.index,
        name: account.name,
        address,
        balance: balance.toString(),
        balanceSol: lamportsToSol(balance)
      });
    }

    res.json({
      accounts
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error
        ? error.message
        : "Failed to load wallet"
    });
  }
});

app.post("/api/accounts", async (req, res) => {
  try {
    const wallet = getWallet();

    const name =
      typeof req.body.name === "string" &&
      req.body.name.trim()
        ? req.body.name.trim()
        : `Account ${wallet.accounts.length}`;

    let index = 0;

    if (wallet.accounts.length > 0) {
      index =
        Math.max(
          ...wallet.accounts.map(
            account => account.index
          )
        ) + 1;
    }

    const account = {
      index,
      name
    };

    wallet.accounts.push(account);

    saveWallet(
      wallet.mnemonic,
      wallet.accounts
    );

    const address = await getAddress(
      wallet.mnemonic,
      index
    );

    res.json({
      index,
      name,
      address,
      balance: "0",
      balanceSol: "0.000000000"
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error
        ? error.message
        : "Failed to create account"
    });
  }
});

app.post("/api/send", async (req, res) => {
  try {
    const wallet = getWallet();

    const index = Number(req.body.index);
    const recipient = String(
      req.body.recipient || ""
    ).trim();

    const amount = String(
      req.body.amount || ""
    ).trim();

    if (!Number.isInteger(index)) {
      return res.status(400).json({
        error: "Invalid account index"
      });
    }

    const accountExists =
      wallet.accounts.some(
        account => account.index === index
      );

    if (!accountExists) {
      return res.status(400).json({
        error: "Account does not exist"
      });
    }

    if (!recipient) {
      return res.status(400).json({
        error: "Recipient is required"
      });
    }

    if (!amount) {
      return res.status(400).json({
        error: "Amount is required"
      });
    }

    const result = await sendSol(
      wallet.mnemonic,
      index,
      recipient,
      amount
    );

    const receipt = await waitForTransaction(
      wallet.mnemonic,
      index,
      result.hash
    );

    res.json({
      hash: result.hash,
      fee: result.fee.toString(),
      feeSol: lamportsToSol(result.fee),
      success: receipt.success !== false
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error
        ? error.message
        : "Transaction failed"
    });
  }
});

app.get(
  "/api/accounts/:index/transactions",
  async (req, res) => {
    try {
      const wallet = getWallet();

      const index = Number(
        req.params.index
      );

      const account = wallet.accounts.find(
        account => account.index === index
      );

      if (!account) {
        return res.status(404).json({
          error: "Account does not exist"
        });
      }

      const address = await getAddress(
        wallet.mnemonic,
        index
      );

      const rpcUrl =
        process.env.SOLANA_RPC_URL ||
        "http://localhost:8899";

      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [
            address,
            {
              limit: 10
            }
          ]
        })
      });

      const data = await response.json();

      const transactions =
        (data.result || []).map(
          (tx: {
            signature: string;
            slot: number;
            blockTime: number | null;
            err: unknown;
          }) => ({
            signature: tx.signature,
            slot: tx.slot,
            blockTime: tx.blockTime,
            success: tx.err === null
          })
        );

      res.json({
        transactions
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error
          ? error.message
          : "Failed to load transactions"
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `Wallet API running on http://localhost:${PORT}`
  );
});
