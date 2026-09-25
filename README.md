# Solana Wallet

A simple Solana wallet built with **TypeScript, React, Vite, Express, and Tether WDK**.

Currently designed for **Solana localnet development and testing**.

## Features

* Create a wallet from a BIP-39 mnemonic
* Derive and manage multiple Solana accounts
* Persist accounts locally
* View SOL balances
* Send SOL
* Receive SOL with a QR code
* View recent transaction activity
* Copy wallet addresses
* Refresh balances and transactions

## Tech Stack

* TypeScript
* React + Vite
* Express
* Tether WDK Solana Wallet
* Solana Localnet

## Setup

### 1. Install dependencies

```bash
npm install

cd frontend
npm install
cd ..
```

### 2. Configure the RPC

Create `.env` in the project root:

```env
SOLANA_RPC_URL=http://localhost:8899
```

### 3. Start Solana localnet

```bash
solana-test-validator
```

### 4. Start the backend

In another terminal:

```bash
npm run server
```

The backend runs on `http://localhost:3001`.

### 5. Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

## Testing

The wallet is currently tested against Solana localnet.

### Fund an account

Get an account address from the wallet, then:

```bash
solana airdrop 10 YOUR_ADDRESS --url localhost
```

Check the balance:

```bash
solana balance YOUR_ADDRESS --url localhost
```

### Test sending SOL

1. Fund your wallet account.
2. Create or use another Solana localnet account as the recipient.
3. Open the frontend.
4. Select the funded account.
5. Click **Send**.
6. Enter the recipient address and amount.
7. Confirm that the transaction succeeds.
8. Check the recipient balance:

```bash
solana balance RECIPIENT_ADDRESS --url localhost
```

### Test accounts

1. Create another account from the UI.
2. Switch between accounts.
3. Restart the backend.
4. Confirm that the accounts are still present.
5. Confirm that each account retains its address and balance.

### Test receiving

1. Select an account.
2. Click **Receive**.
3. Confirm that the address and QR code are displayed.
4. Copy the address and verify that it matches the account address.

## Security

This is an educational/development wallet.

The mnemonic is currently stored locally in `wallet.json` and is **not encrypted**. Do not use this version with real funds.

## License

MIT License

Copyright (c) 2026 Tazo Stepniashvili

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

