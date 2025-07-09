# MetaCard YieldFlow


## 🚀 Project Overview
MetaCard YieldFlow is a next-generation DeFi platform that combines card-linked USDC yield, on-chain reputation, NFT rewards, and advanced privacy/cryptography features. Built for the modern Ethereum/DeFi developer, it demonstrates best practices in Solidity, security, gas optimization, zk-SNARK integration, and open-source collaboration.

---

## 🌟 Key Features
- **MetaCard Virtual Card:**
  - MetaMask-style card UI for managing USDC—deposit, spend, and withdraw with ease.
- **Aave v3 Integration** for yield generation
- **1inch Aggregation API** for seamless USDC-to-ETH swaps (with API key support)
- **On-Chain Reputation System:**
  - Every transaction builds your DeFi rep. Hit milestones to unlock NFT badges and rise through card tiers (Classic, Silver, Gold, Platinum).
- **NFT Badge Rewards:**
  - Mint exclusive, non-transferable NFT badges as you level up your reputation.
- **Cross-Chain USDC:**
  - Instantly bridge USDC across supported chains with LI.FI integration.
- **Real-Time Automation:**
  - Get instant notifications and automate actions with n8n workflow integration.
- **Modern, Responsive UI:**
  - Beautiful, accessible, and mobile-friendly—built with React, Tailwind, and Heroicons.
- **Secure, Modular Smart Contracts:**
  - Written in Solidity, leveraging OpenZeppelin standards for security and extensibility.
- **zk-SNARK Verifier:** Solidity Groth16 proof verification (privacy/cryptography demo)
- **Security & Gas Optimization:** Reentrancy protection, state-before-external, Slither analysis
- **Fuzz/Property-Based Testing:** Robust Hardhat test suite
- **Open-Source Best Practices:** MIT license, contributing guide, code of conduct, security policy
- **Automated CI/CD:** GitHub Actions for tests and linting on every PR

---

## 🏆 Hackathon Alignment

MetaCard YieldFlow was built for the [MetaMask Card Dev Cook-Off](https://www.hackquest.io/hackathons/MetaMask-Card-Dev-Cook-Off), addressing:
- **DeFi-Driven Card Utilities**
- **Identity & On-Chain Reputation**
- **Multichain USDC Payment System**
- **Smart Agents & Liquidity Automation**
- **Composable Cross-Chain Applications**

**Bonus Eligibility:**
- Uses MetaMask SDK
- Integrates LI.FI Widget
- USDC as the stablecoin of choice
- Ready for Circle Wallets integration

---

## 🖼️ Demo

*Try it live: https://metacard-yieldflow-7cv6zho9k.vercel.app/

[Demo Video (Loom)](https://www.loom.com/share/1d6d4d330da947cbbaa881d9aac932f1?sid=10e4d5d1-547d-43be-85f0-465b7d59cc38)

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Heroicons
- **Smart Contracts:** Solidity, Hardhat, OpenZeppelin
- **Automation:** n8n, Node.js event listeners
- **Wallet:** MetaMask, MetaMask SDK
- **Cross-Chain:** LI.FI Widget
- **Notifications:** Email, Discord (via n8n)
- **Design:** Modern, pastel gradients, glassmorphism, responsive

---

## ⚡ Quick Start

### 1. Clone & Install
```sh
git clone https://github.com/<your-username>/MetaCardYieldFlow.git
cd MetaCardYieldFlow
npm install
cd frontend
npm install
```

### 2. Environment Setup
- Copy `.env.example` to `.env` in `frontend/`
- Add your 1inch API key:
  ```
  REACT_APP_1INCH_API_KEY=your-1inch-api-key
  ```
- (Optional) Set up Alchemy/Infura keys for testnets in backend `.env`

### 3. Run Tests & Lint
```sh
npx hardhat test
npx slither .
```

### 4. Start the Frontend
```sh
cd frontend
npm start
```

---

## 🔒 Security & Static Analysis
- **Reentrancy protection**: All external functions use `nonReentrant` and state-before-external best practices
- **Slither**: Run `slither .` for static analysis (see [Slither report](docs/security.md))
- **Security Policy**: See [SECURITY.md](SECURITY.md) for responsible disclosure

---

## 🧑‍💻 Open-Source Practices
- **License**: [MIT](LICENSE)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct**: See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Security Policy**: See [SECURITY.md](SECURITY.md)
- **CI/CD**: [GitHub Actions](.github/workflows/ci.yml) runs tests and linting on every PR

---

## 🏆 Highlights
- **zk-SNARK/Privacy**: Solidity Groth16 verifier integration + test
- **DeFi Protocols**: Aave v3, 1inch, OpenZeppelin
- **Security**: Reentrancy guards, Slither, responsible disclosure
- **Gas Optimization**: State-before-external, immutable vars, event emission
- **Testing**: Unit, fuzz/property-based, revert reason checks
- **Open-Source**: MIT, contributing, code of conduct, security policy
- **CI/CD**: Automated test/lint on every PR
- **Documentation**: NatSpec, README, security, contributing

---

## 🖥️ Example Usage

### Solidity: zk-SNARK Verifier
```solidity
// Call the Groth16 verifier from YieldFlow
uint256[2] memory a = [1, 2];
uint256[2][2] memory b = [[3, 4], [5, 6]];
uint256[2] memory c = [7, 8];
uint256[] memory input = [9, 10];
bool valid = yieldFlow.verifyZkSnarkProof(a, b, c, input);
```

### Frontend: Swap USDC to ETH (1inch)
```js
// .env
REACT_APP_1INCH_API_KEY=your-1inch-api-key
```

---

## 📬 Contact
- **Author**: Madhu Sahitya
- **Email**: madhusahitya.works@gmail.com
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/your-linkedin)
- **GitHub**: [Your GitHub](https://github.com/<your-username>)

---

> Built for the next generation of DeFi, privacy, and open-source innovation. 
