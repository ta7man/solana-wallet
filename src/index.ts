import "dotenv/config";

import { generateMnemonic } from "bip39";
import {
  createInterface
} from "readline/promises";

import {
  loadWallet,
  saveWallet,
  walletExists
} from "./storage.js";

import type { Account } from "./types.js";

import {
  getAddress,
  getBalance,
  lamportsToSol,
  sendSol,
  waitForTransaction
} from "./wallet.js";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ask(
  question: string
): Promise<string> {
  return rl.question(question);
}

async function createNewWallet() {
  const mnemonic = generateMnemonic(256);

  const accounts: Account[] = [
    {
      index: 0,
      name: "Main"
    }
  ];

  saveWallet(mnemonic, accounts);

  console.log("\nWallet created!");
  console.log("\nIMPORTANT: Save your recovery phrase somewhere safe.\n");
  console.log(mnemonic);
  console.log();

  const address = await getAddress(
    mnemonic,
    0
  );

  console.log(`Main account: ${address}\n`);

  return {
    mnemonic,
    accounts
  };
}

async function importWallet() {
  const mnemonic = await ask(
    "Enter your recovery phrase: "
  );

  if (!mnemonic.trim()) {
    throw new Error("Recovery phrase cannot be empty.");
  }

  const accounts: Account[] = [
    {
      index: 0,
      name: "Main"
    }
  ];

  saveWallet(mnemonic.trim(), accounts);

  console.log("\nWallet imported!");

  const address = await getAddress(
    mnemonic.trim(),
    0
  );

  console.log(`Main account: ${address}\n`);

  return {
    mnemonic: mnemonic.trim(),
    accounts
  };
}

async function setupWallet() {
  if (walletExists()) {
    return loadWallet();
  }

  console.log("=========================");
  console.log("      SOLANA WALLET");
  console.log("=========================\n");

  console.log("1. Create new wallet");
  console.log("2. Import wallet");

  const choice = await ask("\nChoose: ");

  if (choice === "1") {
    return createNewWallet();
  }

  if (choice === "2") {
    return importWallet();
  }

  throw new Error("Invalid choice.");
}

async function showCurrentAccount(
  mnemonic: string,
  accounts: Account[],
  currentAccount: number
) {
  const account = accounts.find(
    account => account.index === currentAccount
  );

  if (!account) {
    throw new Error("Current account does not exist.");
  }

  const address = await getAddress(
    mnemonic,
    account.index
  );

  const balance = await getBalance(
    mnemonic,
    account.index
  );

  console.log("\n=========================");
  console.log("     CURRENT ACCOUNT");
  console.log("=========================\n");

  console.log(`Name: ${account.name}`);
  console.log(`Index: ${account.index}`);
  console.log(`Address: ${address}`);
  console.log(
    `Balance: ${lamportsToSol(balance)} SOL`
  );

  console.log();
}

async function listAccounts(
  mnemonic: string,
  accounts: Account[]
) {
  console.log("\n=========================");
  console.log("        ACCOUNTS");
  console.log("=========================\n");

  if (accounts.length === 0) {
    console.log("No accounts created.\n");
    return;
  }

  for (const account of accounts) {
    const address = await getAddress(
      mnemonic,
      account.index
    );

    const balance = await getBalance(
      mnemonic,
      account.index
    );

    console.log(`${account.name}`);
    console.log(`Index: ${account.index}`);
    console.log(`Address: ${address}`);
    console.log(
      `Balance: ${lamportsToSol(balance)} SOL`
    );

    console.log();
  }
}

async function createAccount(
  mnemonic: string,
  accounts: Account[]
) {
  let index = 0;

  if (accounts.length > 0) {
    index =
      Math.max(
        ...accounts.map(account => account.index)
      ) + 1;
  }

  const name = await ask(
    `Account name (default: Account ${index}): `
  );

  const account: Account = {
    index,
    name: name.trim() || `Account ${index}`
  };

  accounts.push(account);

  saveWallet(
    mnemonic,
    accounts
  );

  const address = await getAddress(
    mnemonic,
    index
  );

  console.log("\n=========================");
  console.log("     ACCOUNT CREATED");
  console.log("=========================\n");

  console.log(`Name: ${account.name}`);
  console.log(`Index: ${account.index}`);
  console.log(`Address: ${address}\n`);
}

async function switchAccount(
  accounts: Account[],
  currentAccount: number
): Promise<number> {
  console.log("\nAvailable accounts:");

  for (const account of accounts) {
    console.log(
      `${account.index}. ${account.name}`
    );
  }

  const input = await ask(
    "\nAccount index: "
  );

  const index = Number(input);

  if (!Number.isInteger(index)) {
    console.log("\nInvalid account index.\n");
    return currentAccount;
  }

  const account = accounts.find(
    account => account.index === index
  );

  if (!account) {
    console.log(
      "\nThat account has not been created.\n"
    );

    return currentAccount;
  }

  console.log(
    `\nSwitched to ${account.name}.\n`
  );

  return index;
}

async function send(
  mnemonic: string,
  accounts: Account[],
  currentAccount: number
) {
  const account = accounts.find(
    account => account.index === currentAccount
  );

  if (!account) {
    console.log("Current account does not exist.");
    return;
  }

  const recipient = await ask(
    "Recipient address: "
  );

  if (!recipient.trim()) {
    console.log("Recipient cannot be empty.\n");
    return;
  }

  const amount = await ask(
    "Amount of SOL: "
  );

  try {
    const result = await sendSol(
      mnemonic,
      currentAccount,
      recipient.trim(),
      amount.trim()
    );

    console.log("\nTransaction sent!");
    console.log(`Signature: ${result.hash}`);
    console.log(
      `Fee: ${lamportsToSol(result.fee)} SOL`
    );

    console.log("\nWaiting for finality...");

    const receipt = await waitForTransaction(
      mnemonic,
      currentAccount,
      result.hash
    );

    if (receipt.success === false) {
      console.log(
        "\nTransaction failed on-chain.\n"
      );
      return;
    }

    console.log(
      "\nTransaction finalized successfully.\n"
    );
  } catch (error) {
    console.log(
      `\nTransaction failed: ${
        error instanceof Error
          ? error.message
          : error
      }\n`
    );
  }
}

async function menu(
  mnemonic: string,
  accounts: Account[]
) {
  let currentAccount = 0;

  while (true) {
    const current = accounts.find(
      account => account.index === currentAccount
    );

    console.log("=========================");
    console.log("       SOLANA WALLET");
    console.log("=========================");
    console.log(
      `Current: ${current?.name ?? "Unknown"}`
    );
    console.log();

    console.log("1. Show current account");
    console.log("2. List accounts");
    console.log("3. Create account");
    console.log("4. Switch account");
    console.log("5. Send SOL");
    console.log("6. Exit");

    const choice = await ask("\nChoose: ");

    try {
      if (choice === "1") {
        await showCurrentAccount(
          mnemonic,
          accounts,
          currentAccount
        );
      }

      else if (choice === "2") {
        await listAccounts(
          mnemonic,
          accounts
        );
      }

      else if (choice === "3") {
        await createAccount(
          mnemonic,
          accounts
        );
      }

      else if (choice === "4") {
        currentAccount =
          await switchAccount(
            accounts,
            currentAccount
          );
      }

      else if (choice === "5") {
        await send(
          mnemonic,
          accounts,
          currentAccount
        );
      }

      else if (choice === "6") {
        console.log("\nGoodbye!");

        rl.close();

        return;
      }

      else {
        console.log("\nInvalid choice.\n");
      }
    } catch (error) {
      console.log(
        `\nError: ${
          error instanceof Error
            ? error.message
            : error
        }\n`
      );
    }
  }
}

async function main() {
  try {
    const wallet = await setupWallet();

    await menu(
      wallet.mnemonic,
      wallet.accounts
    );
  } catch (error) {
    console.error(
      "\nError:",
      error instanceof Error
        ? error.message
        : error
    );

    rl.close();
  }
}

main();