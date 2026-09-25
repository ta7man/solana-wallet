import WalletManagerSolana from "@tetherto/wdk-wallet-solana";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "http://localhost:8899";

const TRANSACTION_MAX_FEE = 10_000_000;

export function createWallet(mnemonic: string) {
  return new WalletManagerSolana(mnemonic, {
    provider: RPC_URL,
    commitment: "confirmed",
    transactionMaxFee: TRANSACTION_MAX_FEE
  });
}

export async function getAccount(
  mnemonic: string,
  index: number
) {
  const wallet = createWallet(mnemonic);

  return wallet.getAccount(index);
}

export async function getAddress(
  mnemonic: string,
  index: number
): Promise<string> {
  const account = await getAccount(mnemonic, index);

  return account.getAddress();
}

export async function getBalance(
  mnemonic: string,
  index: number
): Promise<bigint> {
  const account = await getAccount(mnemonic, index);

  return account.getBalance();
}

export function lamportsToSol(
  lamports: bigint
): string {
  const whole = lamports / 1_000_000_000n;
  const remainder = lamports % 1_000_000_000n;

  return `${whole}.${remainder
    .toString()
    .padStart(9, "0")}`;
}

export function solToLamports(
  sol: string
): bigint {
  const [whole, decimal = ""] = sol.split(".");

  const decimalPart = decimal
    .padEnd(9, "0")
    .slice(0, 9);

  return (
    BigInt(whole) * 1_000_000_000n +
    BigInt(decimalPart)
  );
}

export async function sendSol(
  mnemonic: string,
  index: number,
  recipient: string,
  amount: string
) {
  const account = await getAccount(mnemonic, index);

  const lamports = solToLamports(amount);

  const balance = await account.getBalance();

  const quote = await account.quoteSendTransaction({
    to: recipient,
    value: lamports
  });

  const totalNeeded = lamports + quote.fee;

  if (balance < totalNeeded) {
    throw new Error(
      `Insufficient SOL. You need ${lamportsToSol(totalNeeded)} SOL including the estimated fee.`
    );
  }

  console.log(
    `Estimated fee: ${lamportsToSol(quote.fee)} SOL`
  );

  return account.sendTransaction({
    to: recipient,
    value: lamports
  });
}

export async function waitForTransaction(
  mnemonic: string,
  index: number,
  signature: string
) {
  const account = await getAccount(mnemonic, index);

  return account.waitForTransaction(
    signature,
    {
      target: "final"
    }
  );
}