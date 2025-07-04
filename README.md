# 🧭 Scout – Your Personalized Web3 AI Agent  
**_See, Scan, Act. Instantly._**

Scout is a Chrome extension that transforms your browser into an intelligent, personalized Web3 assistant. With just one scan, you can extract and analyze tokens, contracts, wallet addresses, and alpha-rich content — directly from tweets, DEXs, and crypto websites — and receive instant, contextual insights and actions based on your Web3 persona.

No switching tabs. No copy-pasting. Just scan and act.

---

## 🎬 Demo Video

See Scout in action! Watch our demo showcasing the complete workflow from scanning a tweet to getting personalized Web3 insights:

[![Scout Demo - See, Scan, Act. Instantly.](https://img.youtube.com/vi/fNuzNVCzUPg/maxresdefault.jpg)](https://www.youtube.com/watch?v=fNuzNVCzUPg)

*Click the thumbnail above to watch the full demonstration*

---

## 🚀 Installation & Usage Guide

### 🛠️ Setup Instructions

To get started with Scout, follow these steps:

1. **Download the ZIP** of this repository.  
2. **Unzip** the archive, and locate the folder named `scout-ext`.

3. Open **Google Chrome**, then:
   - Go to `chrome://extensions/`
   - **Enable Developer Mode** (toggle in top right)
   - Click **“Load Unpacked”**
   - Select the `scout-ext` folder.

4. **Ensure no ad-blockers** are active on the browser while using Scout.

---

### 🧪 How to Use

1. Click the **Scout extension icon** from the Chrome toolbar.
2. **Enter your Ethereum wallet address** (used for personalized insight and context).
3. Visit any crypto-related site, like **Twitter**.
4. **Find a tweet** with information about a token, smart contract, or Web3 project.
5. **Right-click** on the tweet content and choose **“Analyze with Scout”**, or press `Ctrl + Shift + L`.
6. Scout will activate **OCR** (Optical Character Recognition), scan the selected text, extract the relevant data (like `$TOKEN`, contract address), and send it to the backend.
7. In a few seconds, a **popup** will appear on-screen showing:
   - Token metadata (price, holders, liquidity)
   - Risk/confidence score
   - Smart contract type (if detected)
   - Personalized insights
   - **Action buttons** (e.g. “Simulate Buy”, “Save Token”, “View Wallet”)

⚡ It’s fast, seamless, and runs within the page you're already browsing.

---

## 🌐 Backend Infrastructure

Scout is powered by a robust **LangGraph.js backend server** deployed on Railway at:  
**https://scout-backend-production.up.railway.app**

### Server Architecture & Role

The backend serves as the **AI brain** of Scout, handling all the intelligent processing and Web3 analysis:

- **🤖 LangGraph Orchestration**: Advanced AI workflow management using state-of-the-art language models (Groq/OpenAI)
- **🔍 Data Analysis Engine**: Processes OCR-extracted data from the extension to identify tokens, contracts, and wallet addresses
- **🌐 Web3 Intelligence**: Integrates with Nodit MCP (Model Context Protocol) for real-time blockchain data, transaction traces, and on-chain analytics
- **⚡ Real-time Processing**: Supports both standard API calls and streaming responses via Server-Sent Events for instant user feedback
- **🎯 Persona-Aware Insights**: Tailors analysis and recommendations based on user wallet history and Web3 behavior patterns

When you scan content with Scout, the extension sends the extracted data to this backend, which then orchestrates multiple AI agents to provide you with comprehensive, personalized insights about tokens, contracts, and trading opportunities — all in seconds.

---

## 👥 Types of Users & Use Cases

Scout is **persona-aware** — the extension tailors insights based on who you are and how you interact with Web3:

### 🧑‍💻 Developers  
- Get audit-level analysis of contracts  
- Understand token launch structures and source maps  
- Track public dev wallet behaviors  
- Automatically save and organize project launch data for research

### 💹 DeFi Traders  
- Analyze DeFi transactions from any page  
- Deconstruct wallet behaviors and asset flows  
- Simulate trades using real-time price + liquidity data  
- Get smart recommendations on which assets to sell or hold

### 🪙 Memecoiners & Copy Traders  
- Track influencer wallets and wallet profit/loss  
- View token history, renounced ownership, insider wallets  
- Detect honeypots and contract clones  
- One-click access to follow wallets or auto-monitor trades

### 🎮 Web3 Gamers  
- Scan project UIs for asset data and token interactions  
- Preview in-game tokenomics, item stats, and mintable assets  
- View transaction fees and evaluate ROI before playing

### 🧲 Airdrop Hunters  
- Scan for eligibility messages and claim content  
- Track wallet engagement levels  
- Automate token detection from project announcements

---

## 🔮 Future Scope

Scout is just getting started. Here’s what’s coming next:

- **Persona Learning Engine**: Scout will adapt to you, your goals, and your trading patterns automatically.
- **Smart Contract Risk Scanner**: Honeypot detection, permission audits, and impersonation alerts.
- **Trade Execution Layer**: Integrations with 1inch, Jupiter, Uniswap, and WalletConnect for real-time, secure trading.
- **Portfolio Analytics**: Full wallet overview with suggestions based on profit/loss, token risk, and exposure analysis.
- **Telegram Companion Bot**: Push alerts, scan reports, and transaction tracking — even when you’re off browser.
- **Cron-based Triggers**: “If this token breaks $0.05 or >10% volume in 24h, alert me.”
- **NFT & GameFi Add-ons**: Stats, ownership breakdowns, and marketplace previews.
- **Multi-Chain Expansion**: Full support for BNB Chain, Polygon, Arbitrum, Solana, TRON, and beyond.

---

## 🧠 Tech Stack

| Layer          | Technology |
|----------------|------------|
| **OCR**        | Tesseract.js |
| **Frontend**   | Chrome Extension + React + Vanilla JS |
| **Wallet**     | MetaMask, WalletConnect (soon) |
| **Backend**    | Node.js + LangGraph + Express |
| **AI Layer**   | OpenRouter + GPT + LangGraph |
| **Web3 Infra** | Nodit MCP for on-chain data, traces, simulations |
| **DEX APIs**   | 1inch, Jupiter (for future execution) |

---



---



