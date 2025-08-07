# Marinade Liquid Staking Smart Contract

This project implements a Marinade-compatible Liquid Staking smart contract on Solana with a full suite of Web3-based test cases.

## 📦 Features

- Stake SOL and receive mSOL (Marinade Staked SOL)
- Unstake to receive SOL back
- mSOL/SOL accounting via Marinade protocol
- Web3-based test suite with `@solana/web3.js` and `@project-serum/anchor`
- Simulates staking/unstaking in a local test validator

## 📁 Project Structure

```
.
├── programs/
│   └── marinade_staking/       # Solana smart contract (Anchor)
├── tests/
│   └── marinade.test.ts        # Web3 test cases
├── migrations/
├── Anchor.toml
├── Cargo.toml
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Anchor](https://book.anchor-lang.com/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- Node.js >= 16
- Yarn or NPM

### Install

```bash
git clone https://github.com/your-username/marinade-liquid-staking.git
cd marinade-liquid-staking
yarn install
```

### Build & Deploy Locally

```bash
anchor build
anchor deploy
```

### Run Tests

```bash
anchor test
```

## 🧪 Example Test Case

```ts
it("Stake SOL and receive mSOL", async () => {
  const tx = await program.methods
    .stake(new anchor.BN(1_000_000_000)) // 1 SOL
    .accounts({
      user: user.publicKey,
      marinadeState: marinadeStatePDA,
      msolMint: msolMint,
      systemProgram: SystemProgram.programId,
    })
    .signers([user])
    .rpc();

  const msolBalance = await getTokenBalance(userMsolATA);
  assert.ok(msolBalance > 0, "User should receive mSOL");
});
```

## 🔐 Smart Contract (Program)

- Written in Rust using [Anchor](https://github.com/coral-xyz/anchor)
- Interacts with Marinade's on-chain staking pool
- Performs CPI calls to stake/unstake

## 📜 License

MIT License

---

### 🤝 Credits

Built on top of the [Marinade Finance](https://marinade.finance) staking protocol.
