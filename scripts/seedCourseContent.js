/**
 * Seed Firestore `course_content` collection with authentic Sofe Node curriculum.
 * Ensures the dynamic Firestore knowledge base is populated.
 *
 * Usage: node scripts/seedCourseContent.js
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Read .env.local to load server-side admin credentials
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(sa), projectId: sa.project_id || 'sofe-node' });
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
      });
    } else {
      initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node' });
    }
  } catch (e) {
    console.error('Firebase init error in seed script:', e.message);
  }
}

const db = getFirestore();

const FOUNDATION_CURRICULUM_KNOWLEDGE_BASE = `### LESSON [lesson-1]: Introduction to Blockchain Architecture and Consensus Mechanisms
TOPIC TAG: blockchain-fundamentals

A blockchain is a decentralized, distributed, and append-only ledger that records transactions across a network of independent computers known as nodes. Unlike centralized databases maintained by a single administrator, blockchains eliminate single points of failure through peer-to-peer (P2P) networking and cryptographic verification.

Each block in a blockchain contains a cryptographically signed batch of valid transactions, a timestamp, a nonce, and the cryptographic hash of the previous block. Hashing (typically using cryptographic functions like SHA-256 or Keccak-256) ensures immutability: any alteration of past transaction data alters that block's hash, invalidating all subsequent blocks in the chain.

Consensus mechanisms enable distributed nodes to agree on a single source of truth without requiring trust between participants:
1. Proof of Work (PoW): Nodes (miners) compete to solve computationally intensive mathematical puzzles to validate transactions and produce new blocks. PoW provides high security through thermodynamic cost, but demands significant electrical energy and has limited transaction throughput.
2. Proof of Stake (PoS): Network validators are selected to propose and attest to new blocks proportionally to their economic stake—the cryptocurrency they deposit as collateral. Validators who attempt malicious behavior or experience extended downtime face "slashing", where a portion of their staked assets is permanently confiscated. PoS drastically reduces energy consumption while maintaining economic finality.

Full nodes maintain a complete copy of the ledger and independently validate all transactions and consensus rules, while light clients verify transactions by checking block headers and Merkle proofs without storing the entire state history.

---

### LESSON [lesson-2]: Digital Wallets, Cryptography, and Operational Security
TOPIC TAG: cryptography-and-wallets

Web3 digital wallets do not actually store cryptocurrency tokens; instead, they manage cryptographic key pairs that grant ownership and the authority to sign transactions on the blockchain. 

Public-Key Cryptography (asymmetric cryptography) forms the bedrock of blockchain identity:
- Private Key: A secret 256-bit number that must never be revealed. It is used to generate cryptographic digital signatures (using algorithms like ECDSA or Ed25519) that authorize token transfers and contract interactions.
- Public Key: Mathematically derived from the private key via elliptic curve multiplication (one-way function).
- Blockchain Address: A truncated cryptographic hash of the public key (for example, on Ethereum, the last 20 bytes of the Keccak-256 hash of the public key, prefixed with '0x').

Hierarchical Deterministic (HD) Wallets (BIP-32 / BIP-39 / BIP-44) allow users to derive millions of key pairs from a single 12- or 24-word Secret Recovery Phrase (Seed Phrase). 

Wallet Types:
- Hot Wallets: Software applications connected to the internet (e.g., browser extensions, mobile apps). Convenient for daily dApp interactions, but vulnerable to browser malware, keyloggers, and phishing.
- Cold Wallets: Hardware devices (e.g., Ledger, Trezor) or paper wallets that keep private keys strictly offline in secure hardware elements, signing transactions in an isolated environment.

Crucial Operational Security Rules:
1. Never share your seed phrase, private keys, or keystore files with anyone, including support staff, websites, or AI assistants. Sofe Node will never ask for your private keys.
2. Always inspect transaction details before signing: check the recipient address, contract verification, gas fees, and token approval limits.
3. Beware of unlimited token approvals: malicious dApps can exploit open ERC-20 allowances to drain funds. Use token allowance checkers to revoke unused approvals regularly.

---

### LESSON [lesson-3]: Smart Contracts, Ethereum Virtual Machine (EVM), and Gas Dynamics
TOPIC TAG: smart-contracts-and-evm

A smart contract is a self-executing computer program deployed to a blockchain address whose terms and execution logic are enforced autonomously by the underlying consensus network without intermediary oversight.

The Ethereum Virtual Machine (EVM) is a sandboxed, deterministic virtual runtime environment embedded within every full node on Ethereum and EVM-compatible chains (such as Polygon, BNB Chain, Avalanche C-Chain, Arbitrum, and Base). Determinism guarantees that given the same blockchain state and transaction payload, every node in the world executes the smart contract bytecode and arrives at the exact same output.

EVM Storage and Memory Primitives:
- Storage: Persistent, expensive key-value state stored permanently on the blockchain across transaction calls.
- Memory: Ephemeral, temporary byte array allocated per function execution that is erased when execution completes.
- Calldata: Read-only, unmodifiable memory holding incoming transaction arguments.

Gas Economics:
To solve the Turing-completeness halting problem (preventing infinite loops or denial-of-service spam), EVM execution requires "Gas". Every low-level opcode (e.g., ADD, SLOAD, SSTORE) has a predetermined gas cost corresponding to the computational work and storage impact it imposes on nodes. 

Under Ethereum's EIP-1559:
- Base Fee: The mandatory algorithmic fee burned per unit of gas, fluctuating automatically according to network block utilization.
- Priority Fee (Tip): Optional incentive paid directly to validators to expedite transaction inclusion.
- Maximum Fee: The total cap the sender is willing to pay per gas unit.

Smart contract security is paramount because deployed code is immutable by default. Common vulnerabilities include reentrancy (prevented by the Checks-Effects-Interactions pattern and nonReentrant guards), integer under/overflows, oracle manipulation, and unauthorized delegatecalls.

---

### LESSON [lesson-4]: Token Standards (ERC-20, ERC-721) and Decentralized Finance (DeFi)
TOPIC TAG: defi-and-token-standards

Standardized smart contract interfaces enable composability—the ability for decentralized protocols and financial applications to interact seamlessly like software building blocks ("money legos").

Key Token Standards:
1. ERC-20 (Fungible Tokens): Represents identical, interchangeable assets such as utility tokens, governance tokens, and stablecoins (e.g., USDC, USDT). Required methods include:
   - totalSupply(): Returns total token issuance.
   - balanceOf(account): Queries token balance of a given address.
   - transfer(recipient, amount): Moves tokens directly from caller to recipient.
   - approve(spender, amount) & transferFrom(sender, recipient, amount): Enables delegated transfers, allowing smart contracts (like DEX routers) to spend tokens on a user's behalf.
2. ERC-721 (Non-Fungible Tokens / NFTs): Represents unique, indivisible digital or real-world assets. Each token carries a distinct uint256 tokenId and a tokenURI pointing to JSON metadata.
3. ERC-1155 (Multi-Token Standard): Manages both fungible and non-fungible items within a single smart contract, optimizing gas efficiency.

Decentralized Finance (DeFi) Architecture:
- Automated Market Makers (AMMs): Decentralized exchanges (e.g., Uniswap) replace traditional order books with algorithmic liquidity pools. The constant product formula (x * y = k) dynamically prices asset pairs as traders swap against the pool.
- Liquidity Providers (LPs): Users who deposit equal values of paired tokens into liquidity pools in exchange for LP tokens representing their share of trading fee yields.
- Impermanent Loss: The divergence loss an LP experiences compared to simply holding the tokens outside the pool when relative asset prices change significantly.
- Collateralized Lending: Protocols (e.g., Aave) allow users to supply crypto assets to earn interest and borrow other assets against their collateral up to a defined Loan-to-Value (LTV) ratio.

---

### LESSON [lesson-5]: Layer 2 Rollups, State Bridges, and Blockchain Scaling
TOPIC TAG: layer-2-and-scaling

The Blockchain Trilemma asserts that a public blockchain cannot simultaneously maximize Decentralization, Security, and Scalability. Monolithic Layer 1 (L1) chains like Ethereum prioritize decentralization and cryptographic security by requiring every full node to execute every transaction, which caps throughput (15-30 transactions per second) and drives gas fees higher during congestion.

Layer 2 (L2) Scaling Architectures execute transactions off-chain, compressing hundreds of transactions into a single batch and posting state commitments or cryptographic proofs back to L1 for decentralized security and settlement:
1. Optimistic Rollups (e.g., Arbitrum, Optimism, Base): Assume transactions are valid by default and provide a challenge period (typically 7 days) during which verifiers can submit Fraud Proofs to dispute invalid state transitions.
2. Zero-Knowledge (ZK) Rollups (e.g., zkSync, Starknet, Scroll): Execute transactions off-chain and generate mathematical validity proofs (SNARKs or STARKs) verifying computational correctness instantly upon L1 verification, offering faster finality without 7-day challenge delays.

Cross-Chain Bridges: Facilitate token transfers and message passing between distinct blockchain layers or networks using lock-and-mint or liquidity pool mechanisms. Secure bridge engineering requires rigorous multi-signature verification, rate limiting, and timelocks to mitigate exploit vectors.

---

### LESSON [lesson-6]: Web3 Ecosystems, Governance, and Web3 Career Pathways
TOPIC TAG: web3-ecosystems-and-careers

Web3 represents a paradigm shift from read-write internet platforms (Web2) dominated by centralized corporate intermediaries to read-write-own decentralized protocols governed by open-source communities and cryptographic incentives.

Decentralized Autonomous Organizations (DAOs):
DAOs coordinate human capital, resources, and treasury assets through smart contracts and token-weighted voting:
- Governance Tokens: Grant voting rights to propose, debate, and execute protocol changes, fee parameters, and treasury disbursements.
- Governance Lifecycle: Ideation on community forums -> off-chain temperature check (e.g., Snapshot) -> on-chain binding proposal with timelock execution.

Career Pathways in Web3:
The decentralized economy creates high-demand global career opportunities across engineering, product, and community disciplines:
1. Smart Contract Engineers & Auditors: Developing Solidity / Rust contracts, writing extensive test suites (Foundry, Hardhat), and performing security audits.
2. Full-Stack dApp Developers: Connecting frontend interfaces to smart contracts using libraries like ethers.js, viem, and wagmi.
3. Protocol Researchers & Tokenomics Designers: Architecting incentive models, game theory, and economic mechanisms.
4. Community & Developer Relations (DevRel): Facilitating developer hackathons, technical education, and onboarding builders across ecosystems (Ethereum, Solana, Polygon, Starknet).

The Sofe Node Mission: Empowering ambitious builders across Africa and emerging global markets with world-class Web3 education, verified practical credentials, hands-on hackathons, and direct access to global Web3 career opportunities.`;

async function seed() {
  console.log('Seeding course_content into Firestore...');
  try {
    await db.collection('course_content').doc('foundation').set({
      course_id: 'foundation',
      title: 'Blockchain & Cryptocurrency Foundation',
      content: FOUNDATION_CURRICULUM_KNOWLEDGE_BASE,
      updated_at: FieldValue.serverTimestamp(),
    });
    console.log('Successfully seeded course_content doc: foundation');
  } catch (err) {
    console.error('Seeding notice (Firestore offline or requires auth):', err.message);
  }
}

seed();
