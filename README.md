# HIPS Chat Application

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Web3.js](https://img.shields.io/badge/Web3.js-4.0.0-orange.svg)](https://web3js.org/)
[![Base](https://img.shields.io/badge/Base-L2-green.svg)](https://base.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Hidden In Plain Sight** - Revolutionary encrypted chat application using dictionary-based encryption and Base blockchain technology.

## 📋 Overview

The HIPS Chat Application is a full-stack encrypted messaging platform that implements the HIPS (Hidden In Plain Sight) protocol. Messages are encoded as arrays of numerical indices referencing words in a shared dictionary, creating a unique form of "dictionary-based encryption" stored on the Base blockchain.

### 🔐 How It Works

1. **Message Encoding**: Text messages are converted to arrays of numbers (indices) that reference words in a shared dictionary
2. **Blockchain Storage**: These arrays are stored on-chain as "encrypted" data using the [HIPS Smart Contract](https://github.com/KamilBourouiba/hips-contract)
3. **Access Control**: Only authorized addresses can send messages
4. **Message History**: Complete conversation history is maintained with timestamps
5. **Decryption**: Recipients decode messages using the same shared dictionary

## 🚀 Features

- **🔑 Wallet Integration**: MetaMask connection with automatic Base network switching
- **💬 Encrypted Chat**: Dictionary-based message encoding and decoding
- **📝 Autocomplete**: Smart word suggestions from the shared dictionary
- **👥 Access Control**: Owner-managed authorization system
- **📊 Message History**: Complete conversation history with timestamps
- **🎨 Modern UI**: Futuristic design with smooth animations
- **🔍 Debug Panel**: Comprehensive debugging tools for message analysis
- **📱 Responsive**: Works on desktop and mobile devices

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Base network configured in MetaMask
- **Deployed [HIPS Smart Contract](https://github.com/KamilBourouiba/hips-contract)**

### Setup

```bash
# Clone the repository
git clone https://github.com/KamilBourouiba/hips-chat.git
cd hips-chat

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at `http://localhost:3000`

## 🔗 Integration

### Smart Contract

This application is designed to work with the [HIPS Smart Contract](https://github.com/KamilBourouiba/hips-contract):

> **📋 Note**: The HIPS Chat Application requires a deployed instance of the [HIPS Smart Contract](https://github.com/KamilBourouiba/hips-contract) to function. Make sure you have deployed the contract and have the contract address ready.

```javascript
// Connect to contract
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

// Send encoded message
const messageIndices = [1, 5, 12, 8, 3];
await contract.methods.storeNumbers(messageIndices).send({from: userAddress});
```

### Supported Networks

- **Base Mainnet**: Primary deployment
- **Base Sepolia**: Testnet
- **Ethereum**: Compatible
- **Polygon**: Compatible

## 📊 Usage

### For Users

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Authorize MetaMask connection
   - Application automatically switches to Base network

2. **Connect to Contract**
   - Enter the deployed contract address
   - Click "Connect to Contract"
   - Verify authorization status

3. **Send Messages**
   - Type your message in the input field
   - Use autocomplete suggestions for faster typing
   - Click "Send Message" to encode and send
   - Confirm transaction in MetaMask

4. **View History**
   - All messages are automatically loaded and displayed
   - Messages are decoded and shown with timestamps
   - Use debug panel for detailed analysis

## 👨‍💻 Author

**Kamil Bourouiba**
- GitHub: [@KamilBourouiba](https://github.com/KamilBourouiba)
- Project: [HIPS Protocol](https://github.com/kamilbourouiba/hips-chat)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**HIPS Chat** - *Hidden In Plain Sight* 🔐✨ 