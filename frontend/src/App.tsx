import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  Wallet,
  X,
  LoaderCircle,
  Activity,
  Sparkles
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

import {
  createAccount,
  getTransactions,
  getWallet,
  sendSol
} from "./api";

import type {
  Account,
  Transaction
} from "./types";

function shortenAddress(
  address: string
): string {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatBalance(
  value: string
): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }
  );
}

function formatDate(
  timestamp: number | null
): string {
  if (!timestamp) {
    return "Pending";
  }

  return new Date(
    timestamp * 1000
  ).toLocaleString();
}

function App() {
  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showAccountMenu, setShowAccountMenu] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [showSend, setShowSend] =
    useState(false);

  const [showReceive, setShowReceive] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [sendLoading, setSendLoading] =
    useState(false);

  const [sendSuccess, setSendSuccess] =
    useState("");

  const [sendError, setSendError] =
    useState("");

  const [newAccountName, setNewAccountName] =
    useState("");

  const [recipient, setRecipient] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const currentAccount = useMemo(
    () =>
      accounts.find(
        account =>
          account.index === currentIndex
      ) || accounts[0],
    [accounts, currentIndex]
  );

  async function loadWallet(
    showSpinner = true
  ) {
    try {
      if (showSpinner) {
        setRefreshing(true);
      }

      setError("");

      const wallet =
        await getWallet();

      setAccounts(
        wallet.accounts
      );

      if (
        wallet.accounts.length > 0 &&
        !wallet.accounts.some(
          account =>
            account.index === currentIndex
        )
      ) {
        setCurrentIndex(
          wallet.accounts[0].index
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load wallet"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadTransactions() {
    if (!currentAccount) {
      return;
    }

    try {
      const data =
        await getTransactions(
          currentAccount.index
        );

      setTransactions(
        data.transactions
      );
    } catch {
      setTransactions([]);
    }
  }

  useEffect(() => {
    loadWallet(false);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [currentAccount?.index]);

  async function copyAddress() {
    if (!currentAccount) {
      return;
    }

    await navigator.clipboard.writeText(
      currentAccount.address
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  async function handleCreateAccount() {
    try {
      const account =
        await createAccount(
          newAccountName
        );

      setAccounts(
        previous => [
          ...previous,
          account
        ]
      );

      setCurrentIndex(
        account.index
      );

      setNewAccountName("");
      setShowCreate(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create account"
      );
    }
  }

  async function handleSend() {
    if (!currentAccount) {
      return;
    }

    try {
      setSendLoading(true);
      setSendError("");
      setSendSuccess("");

      const result =
        await sendSol(
          currentAccount.index,
          recipient,
          amount
        );

      if (!result.success) {
        throw new Error(
          "Transaction failed on-chain."
        );
      }

      setSendSuccess(
        result.hash
      );

      setRecipient("");
      setAmount("");

      await loadWallet(false);
      await loadTransactions();
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : "Transaction failed"
      );
    } finally {
      setSendLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <Wallet size={28} />
        </div>

        <LoaderCircle
          className="spin"
          size={22}
        />

        <span>Loading wallet...</span>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={19} />
          </div>

          <div>
            <div className="brand-name">
              Solana Wallet
            </div>

            <div className="brand-subtitle">
              WDK
            </div>
          </div>
        </div>

        <div className="network">
          <span className="network-dot" />
          Localnet
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="error-banner">
            {error}

            <button
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="hero">
          <div className="account-selector">
            <button
              className="account-selector-button"
              onClick={() =>
                setShowAccountMenu(
                  !showAccountMenu
                )
              }
            >
              <div className="avatar">
                {currentAccount?.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="selector-info">
                <span className="selector-label">
                  Current account
                </span>

                <strong>
                  {currentAccount?.name}
                </strong>
              </div>

              <ChevronDown
                size={17}
                className={
                  showAccountMenu
                    ? "rotate"
                    : ""
                }
              />
            </button>

            {showAccountMenu && (
              <div className="account-menu">
                {accounts.map(account => (
                  <button
                    key={account.index}
                    className={
                      account.index ===
                      currentAccount?.index
                        ? "account-menu-item active"
                        : "account-menu-item"
                    }
                    onClick={() => {
                      setCurrentIndex(
                        account.index
                      );

                      setShowAccountMenu(
                        false
                      );
                    }}
                  >
                    <div className="mini-avatar">
                      {account.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {account.name}
                      </strong>

                      <span>
                        {shortenAddress(
                          account.address
                        )}
                      </span>
                    </div>

                    {account.index ===
                      currentAccount?.index && (
                      <Check size={16} />
                    )}
                  </button>
                ))}

                <button
                  className="account-menu-create"
                  onClick={() => {
                    setShowAccountMenu(false);
                    setShowCreate(true);
                  }}
                >
                  <Plus size={17} />
                  Create account
                </button>
              </div>
            )}
          </div>

          <div className="balance-label">
            Total balance
          </div>

          <div className="balance">
            {formatBalance(
              currentAccount?.balanceSol ||
                "0"
            )}

            <span>SOL</span>
          </div>

          <div className="address-row">
            <span>
              {currentAccount &&
                shortenAddress(
                  currentAccount.address
                )}
            </span>

            <button
              className="icon-button"
              onClick={copyAddress}
              title="Copy address"
            >
              {copied ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>

          <div className="actions">
            <button
              className="primary-action"
              onClick={() => {
                setSendSuccess("");
                setSendError("");
                setShowSend(true);
              }}
            >
              <ArrowUpFromLine size={19} />
              Send
            </button>

            <button
              className="secondary-action"
              onClick={() =>
                setShowReceive(true)
              }
            >
              <ArrowDownToLine size={19} />
              Receive
            </button>

            <button
              className="secondary-action"
              onClick={() =>
                setShowCreate(true)
              }
            >
              <Plus size={19} />
              Account
            </button>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel accounts-panel">
            <div className="panel-header">
              <div>
                <h2>Accounts</h2>
                <p>
                  Your derived wallet accounts
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={() =>
                  loadWallet()
                }
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "spin"
                      : ""
                  }
                />
              </button>
            </div>

            <div className="account-list">
              {accounts.map(account => (
                <button
                  key={account.index}
                  className={
                    account.index ===
                    currentAccount?.index
                      ? "wallet-account selected"
                      : "wallet-account"
                  }
                  onClick={() =>
                    setCurrentIndex(
                      account.index
                    )
                  }
                >
                  <div className="account-avatar">
                    {account.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="wallet-account-info">
                    <strong>
                      {account.name}
                    </strong>

                    <span>
                      {shortenAddress(
                        account.address
                      )}
                    </span>
                  </div>

                  <div className="wallet-account-balance">
                    <strong>
                      {formatBalance(
                        account.balanceSol
                      )}
                    </strong>

                    <span>SOL</span>
                  </div>
                </button>
              ))}

              <button
                className="add-account"
                onClick={() =>
                  setShowCreate(true)
                }
              >
                <Plus size={18} />
                Add another account
              </button>
            </div>
          </div>

          <div className="panel activity-panel">
            <div className="panel-header">
              <div>
                <h2>Activity</h2>
                <p>
                  Recent transactions
                </p>
              </div>

              <Activity size={18} />
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Activity size={22} />
                </div>

                <strong>
                  No transactions yet
                </strong>

                <span>
                  Transactions for this
                  account will appear here.
                </span>
              </div>
            ) : (
              <div className="transactions">
                {transactions.map(tx => (
                  <div
                    className="transaction"
                    key={tx.signature}
                  >
                    <div
                      className={
                        tx.success
                          ? "transaction-icon success"
                          : "transaction-icon failed"
                      }
                    >
                      {tx.success ? (
                        <Check size={17} />
                      ) : (
                        <X size={17} />
                      )}
                    </div>

                    <div className="transaction-info">
                      <strong>
                        {tx.success
                          ? "Transaction"
                          : "Failed transaction"}
                      </strong>

                      <span>
                        {shortenAddress(
                          tx.signature
                        )}
                      </span>
                    </div>

                    <div className="transaction-date">
                      {formatDate(
                        tx.blockTime
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {showCreate && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowCreate(false)
          }
        >
          <div
            className="modal"
            onClick={event =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Create account</h2>
                <p>
                  Add another derived Solana
                  account.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                <X size={19} />
              </button>
            </div>

            <label>
              Account name
              <input
                autoFocus
                value={newAccountName}
                onChange={event =>
                  setNewAccountName(
                    event.target.value
                  )
                }
                placeholder="e.g. Savings"
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    handleCreateAccount();
                  }
                }}
              />
            </label>

            <button
              className="modal-primary"
              onClick={
                handleCreateAccount
              }
            >
              <Plus size={18} />
              Create account
            </button>
          </div>
        </div>
      )}

      {showSend && (
        <div
          className="modal-overlay"
          onClick={() =>
            !sendLoading &&
            setShowSend(false)
          }
        >
          <div
            className="modal"
            onClick={event =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Send SOL</h2>
                <p>
                  From {currentAccount?.name}
                </p>
              </div>

              <button
                className="close-button"
                disabled={sendLoading}
                onClick={() =>
                  setShowSend(false)
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="send-balance">
              Available

              <strong>
                {formatBalance(
                  currentAccount?.balanceSol ||
                    "0"
                )}{" "}
                SOL
              </strong>
            </div>

            <label>
              Recipient
              <input
                value={recipient}
                onChange={event =>
                  setRecipient(
                    event.target.value
                  )
                }
                placeholder="Solana address"
              />
            </label>

            <label>
              Amount
              <div className="amount-input">
                <input
                  value={amount}
                  onChange={event =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                />

                <span>SOL</span>
              </div>
            </label>

            {sendError && (
              <div className="form-error">
                {sendError}
              </div>
            )}

            {sendSuccess && (
              <div className="form-success">
                <Check size={17} />

                <div>
                  <strong>
                    Transaction finalized
                  </strong>

                  <span>
                    {shortenAddress(
                      sendSuccess
                    )}
                  </span>
                </div>
              </div>
            )}

            <button
              className="modal-primary"
              disabled={
                sendLoading ||
                !recipient ||
                !amount
              }
              onClick={handleSend}
            >
              {sendLoading ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="spin"
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send SOL
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showReceive &&
        currentAccount && (
          <div
            className="modal-overlay"
            onClick={() =>
              setShowReceive(false)
            }
          >
            <div
              className="modal receive-modal"
              onClick={event =>
                event.stopPropagation()
              }
            >
              <div className="modal-header">
                <div>
                  <h2>Receive SOL</h2>
                  <p>
                    {currentAccount.name}
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setShowReceive(false)
                  }
                >
                  <X size={19} />
                </button>
              </div>

              <div className="qr-container">
                <QRCodeSVG
  value={currentAccount.address}
  size={210}
  bgColor="#ffffff"
  fgColor="#08090c"
  level="H"
/>
              </div>

              <div className="receive-address">
                <span>
                  {currentAccount.address}
                </span>

                <button
                  className="icon-button"
                  onClick={copyAddress}
                >
                  {copied ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>

              <button
                className="modal-primary"
                onClick={copyAddress}
              >
                <Copy size={18} />
                Copy address
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default App;
