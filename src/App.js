import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './App.css';
import DebugPanel from './DebugPanel';

// Configuration pour Base (chaîne 8453)
const BASE_CHAIN_ID = '0x2105'; // 8453 en hexadécimal
const BASE_RPC_URL = 'https://mainnet.base.org';

// ABI du contrat avec fonctions d'autorisation
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address[]", "name": "_initialAuthorizedAddresses", "type": "address[]"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "uint256[]", "name": "_numbers", "type": "uint256[]"}],
    "name": "storeNumbers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getLatestNumbers",
    "outputs": [
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"},
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserSubmissionCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_user", "type": "address"},
      {"internalType": "uint256", "name": "_index", "type": "uint256"}
    ],
    "name": "getNumbersByIndex",
    "outputs": [
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"},
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "authorizeAddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "revokeAddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAuthorizedAddresses",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "isAddressAuthorized",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256[]", "name": "numbers", "type": "uint256[]"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "NumbersStored",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "authorizedBy", "type": "address"}
    ],
    "name": "AddressAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "revokedBy", "type": "address"}
    ],
    "name": "AddressRevoked",
    "type": "event"
  }
];

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedAddresses, setAuthorizedAddresses] = useState([]);
  const [newAddressToAuthorize, setNewAddressToAuthorize] = useState('');
  
  // États pour le système de chat chiffré
  const [words, setWords] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Charger le fichier words.txt au démarrage
  useEffect(() => {
    const loadWords = async () => {
      try {
        const response = await fetch('/words.txt');
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const text = await response.text();
        const wordList = text.split('\n')
          .map(word => word.trim().toLowerCase())
          .filter(word => word.length > 0 && /^[a-z]+$/.test(word)); // Seulement des mots avec lettres
        
        setWords(wordList);
        console.log(`Dictionary loaded: ${wordList.length} words`);
        console.log('First 10 words:', wordList.slice(0, 10));
        console.log('Last 10 words:', wordList.slice(-10));
        
        if (wordList.length < 100) {
          setStatus(`⚠️ Very small dictionary: only ${wordList.length} words. Check words.txt`);
          setStatusType('error');
        }
      } catch (error) {
        console.error('Error loading dictionary:', error);
        setStatus('Error: Unable to load words.txt dictionary');
        setStatusType('error');
      }
    };
    loadWords();
  }, []);

  // Initialiser Web3 et se connecter au wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        
        // Demander l'accès au compte
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        // Vérifier et changer vers Base si nécessaire
        await switchToBase();
        
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        
        setStatus('Wallet connected successfully! Enter contract address to continue.');
        setStatusType('success');
      } else {
        setStatus('Please install MetaMask!');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('Error connecting to wallet');
      setStatusType('error');
    }
  };

  // Changer vers le réseau Base
  const switchToBase = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID }],
      });
    } catch (switchError) {
      // Si la chaîne n'est pas ajoutée, l'ajouter
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_CHAIN_ID,
                chainName: 'Base',
                rpcUrls: [BASE_RPC_URL],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://basescan.org/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Base:', addError);
        }
      }
    }
  };

  // Connecter au contrat
  const connectToContract = async () => {
    if (!web3 || !contractAddress.trim()) {
      setStatus('Please enter a valid contract address');
      setStatusType('error');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Connecting to contract...');
      setStatusType('info');

      const contractInstance = new web3.eth.Contract(CONTRACT_ABI, contractAddress);
      setContract(contractInstance);

      // Vérifier si l'utilisateur est le propriétaire
      const owner = await contractInstance.methods.owner().call();
      const userIsOwner = owner.toLowerCase() === account.toLowerCase();
      setIsOwner(userIsOwner);

      // Vérifier si l'utilisateur est autorisé
      const userIsAuthorized = await contractInstance.methods.isAddressAuthorized(account).call();
      setIsAuthorized(userIsAuthorized);

      // Charger les adresses autorisées si l'utilisateur est propriétaire
      if (userIsOwner) {
        const addresses = await contractInstance.methods.getAuthorizedAddresses().call();
        setAuthorizedAddresses(addresses);
      }

      // Charger l'historique du chat
      if (userIsAuthorized || userIsOwner) {
        await loadChatHistory(contractInstance);
      }

      setStatus(`Connected to encrypted chat! ${userIsOwner ? '(Owner)' : userIsAuthorized ? '(Authorized)' : '(Not authorized)'}`);
      setStatusType(userIsAuthorized || userIsOwner ? 'success' : 'error');

    } catch (error) {
      console.error('Error connecting to contract:', error);
      setStatus('Error: Unable to connect to contract. Check the address.');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger tout l'historique du chat de tous les utilisateurs autorisés
  const loadChatHistory = async (contractInstance) => {
    if (!contractInstance) return;
    
    try {
      const addresses = await contractInstance.methods.getAuthorizedAddresses().call();
      const allMessages = [];

      // Récupérer les messages de chaque adresse autorisée
      for (const addr of addresses) {
        try {
          const count = await contractInstance.methods.getUserSubmissionCount(addr).call();
          
          for (let i = 0; i < count; i++) {
            try {
              const submission = await contractInstance.methods.getNumbersByIndex(addr, i).call();
              const messageText = decodeMessage(submission[0]);
              
              allMessages.push({
                address: addr,
                message: messageText,
                indices: submission[0],
                timestamp: new Date(parseInt(submission[1]) * 1000),
                index: i + 1
              });
            } catch (error) {
              console.error(`Error loading message ${i} from ${addr}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error loading messages from ${addr}:`, error);
        }
      }

      // Trier par timestamp
      allMessages.sort((a, b) => a.timestamp - b.timestamp);
      setChatHistory(allMessages);

    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Décoder un message à partir d'indices
  const decodeMessage = (indices) => {
    if (!words.length) return `[Dictionary not loaded: ${indices.join(', ')}]`;
    
    return indices.map(index => {
      const wordIndex = parseInt(index);
      if (wordIndex < 0 || wordIndex >= words.length) {
        console.warn(`Invalid index: ${wordIndex}, dictionary: ${words.length} words`);
        return `[INVALID:${wordIndex}]`;
      }
      return words[wordIndex] || `[ERROR:${wordIndex}]`;
    }).join(' ');
  };

  // Encoder un message en indices
  const encodeMessage = (messageText) => {
    const messageWords = messageText.trim().split(/\s+/);
    const indices = [];
    const notFound = [];
    
    for (const word of messageWords) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, ''); // Nettoyer le mot
      const index = words.indexOf(cleanWord);
      if (index !== -1) {
        indices.push(index);
      } else {
        notFound.push(word);
      }
    }
    
    if (notFound.length > 0) {
                console.warn('Words not found in dictionary:', notFound);
    }
    
            console.log('Message encoded:', messageText, '→', indices);
    return indices;
  };

  // Gérer l'autocomplétion
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Extraire le mot actuel
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const words_in_message = textBeforeCursor.split(/\s+/);
    const currentWord = words_in_message[words_in_message.length - 1].toLowerCase();

    if (currentWord.length > 0 && words.length > 0) {
      // Trouver les suggestions
      const matchingWords = words.filter(word => 
        word.toLowerCase().startsWith(currentWord)
      ).slice(0, 10); // Limiter à 10 suggestions

      setSuggestions(matchingWords);
      setShowSuggestions(matchingWords.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Sélectionner une suggestion
  const selectSuggestion = (suggestion) => {
    const cursorPosition = document.getElementById('messageInput').selectionStart;
    const textBeforeCursor = message.slice(0, cursorPosition);
    const textAfterCursor = message.slice(cursorPosition);
    const words_in_message = textBeforeCursor.split(/\s+/);
    words_in_message[words_in_message.length - 1] = suggestion;
    const newMessage = words_in_message.join(' ') + textAfterCursor;
    setMessage(newMessage);
    setShowSuggestions(false);
  };

  // Gérer les touches du clavier pour la navigation des suggestions
  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(suggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  // Envoyer le message
  const sendMessage = async () => {
    if (!web3 || !account || !contract) {
      setStatus('Please connect your wallet and contract first');
      setStatusType('error');
      return;
    }

    if (!isAuthorized) {
      setStatus('Your address is not authorized to send messages');
      setStatusType('error');
      return;
    }

    if (!message.trim()) {
      setStatus('Please enter a message');
      setStatusType('error');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Encoding message...');
      setStatusType('info');

      // Encoder le message en indices
      const indices = encodeMessage(message);
      
      if (indices.length === 0) {
        const wordsInMessage = message.trim().split(/\s+/);
        setStatus(`No words recognized in dictionary. Words tried: ${wordsInMessage.join(', ')}`);
        setStatusType('error');
        return;
      }
      
      console.log(`Sending ${indices.length} indices:`, indices);

      if (indices.length > 100) {
        setStatus('Message too long (maximum 100 words)');
        setStatusType('error');
        return;
      }

      setStatus('Sending encrypted message...');
      
      // Envoyer la transaction
      const transaction = await contract.methods.storeNumbers(indices).send({
        from: account,
        gas: 300000
      });

      setStatus(`Message sent! Hash: ${transaction.transactionHash}`);
      setStatusType('success');
      setMessage('');
      setShowSuggestions(false);
      
      // Recharger l'historique du chat
      setTimeout(() => loadChatHistory(contract), 2000);

    } catch (error) {
      console.error('Error sending:', error);
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Autoriser une nouvelle adresse (propriétaire seulement)
  const authorizeNewAddress = async () => {
    if (!contract || !isOwner || !newAddressToAuthorize.trim()) {
      setStatus('Please enter a valid address to authorize');
      setStatusType('error');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Authorizing address...');
      setStatusType('info');

      await contract.methods.authorizeAddress(newAddressToAuthorize).send({
        from: account,
        gas: 100000
      });

      setStatus('Address authorized successfully!');
      setStatusType('success');
      setNewAddressToAuthorize('');

      // Recharger les adresses autorisées
      const addresses = await contract.methods.getAuthorizedAddresses().call();
      setAuthorizedAddresses(addresses);

    } catch (error) {
      console.error('Error authorizing:', error);
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Révoquer une adresse (propriétaire seulement)
  const revokeAddress = async (addressToRevoke) => {
    if (!contract || !isOwner) return;

    try {
      setIsLoading(true);
      setStatus('Revoking address...');
      setStatusType('info');

      await contract.methods.revokeAddress(addressToRevoke).send({
        from: account,
        gas: 100000
      });

      setStatus('Address revoked successfully!');
      setStatusType('success');

      // Recharger les adresses autorisées et l'historique
      const addresses = await contract.methods.getAuthorizedAddresses().call();
      setAuthorizedAddresses(addresses);
      await loadChatHistory(contract);

    } catch (error) {
      console.error('Error revoking:', error);
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Détecter les changements de compte
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Réinitialiser les données de contrat
          setContract(null);
          setIsOwner(false);
          setIsAuthorized(false);
          setAuthorizedAddresses([]);
          setChatHistory([]);
          setStatus('Account changed. Reconnect to contract.');
          setStatusType('info');
        } else {
          setAccount('');
          setContract(null);
          setChatHistory([]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    // Nettoyage
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [contract]);

  return (
    <div className="container">
      <div className="card">
        <h1>🔐 BaseChat - Encrypted Chat</h1>
        <p>Secure chat on Base using a shared dictionary for encryption</p>
        
        {!account ? (
          <button className="button" onClick={connectWallet}>
            🔗 Connect Wallet
          </button>
        ) : (
          <div>
            <div className="status success">
              ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
            {words.length > 0 && (
              <div className="status info">
                                 📚 Dictionary loaded: {words.length.toLocaleString()} words
              </div>
            )}
          </div>
        )}

        {status && (
          <div className={`status ${statusType}`}>
            {status}
          </div>
        )}

        {account && !contract && (
          <div>
                         <h3>🔗 Connect to Chat</h3>
             <input
               type="text"
               className="input"
               placeholder="Enter contract address (0x...)"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isLoading}
            />
            <button 
              className="button" 
              onClick={connectToContract} 
              disabled={isLoading || !contractAddress.trim()}
            >
                             {isLoading ? '⏳ Connecting...' : '💬 Join Chat'}
            </button>
          </div>
        )}

        {account && contract && (isAuthorized || isOwner) && (
          <div>
                         <h3>💬 Send Message</h3>
            <div className="message-input-container">
              <textarea
                id="messageInput"
                className="input message-input"
                                 placeholder="Type your message... (use English words)"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                rows="3"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="button" 
              onClick={sendMessage} 
              disabled={isLoading || !message.trim()}
            >
                             {isLoading ? '⏳ Sending...' : '🚀 Send Message'}
            </button>
          </div>
        )}

        {account && contract && !isAuthorized && !isOwner && (
          <div className="status error">
                         ❌ Your address is not authorized to participate in the chat. Contact the owner.
          </div>
        )}

        {account && contract && isOwner && (
          <div>
                         <h3>👑 Authorization Management (Owner)</h3>
            <div>
              <input
                type="text"
                className="input"
                                 placeholder="Address to authorize (0x...)"
                value={newAddressToAuthorize}
                onChange={(e) => setNewAddressToAuthorize(e.target.value)}
                disabled={isLoading}
              />
              <button 
                className="button" 
                onClick={authorizeNewAddress} 
                disabled={isLoading || !newAddressToAuthorize.trim()}
              >
                                 {isLoading ? '⏳ Authorizing...' : '✅ Authorize Address'}
              </button>
            </div>
            
            {authorizedAddresses.length > 0 && (
              <div>
                                 <h4>📋 Authorized Participants ({authorizedAddresses.length})</h4>
                {authorizedAddresses.map((addr, index) => (
                  <div key={index} className="history-item">
                    <div className="numbers-display">
                      {addr}
                                             {addr.toLowerCase() === account.toLowerCase() && ' (You)'}
                    </div>
                    {addr.toLowerCase() !== account.toLowerCase() && (
                      <button 
                        className="button" 
                        style={{marginTop: '10px', background: '#dc3545'}}
                        onClick={() => revokeAddress(addr)}
                        disabled={isLoading}
                      >
                                                 🗑️ Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {chatHistory.length > 0 && (
          <div>
                         <h3>💬 Chat History ({chatHistory.length} messages)</h3>
            <div className="chat-container">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`message-item ${msg.address.toLowerCase() === account.toLowerCase() ? 'own-message' : 'other-message'}`}>
                  <div className="message-header">
                    <strong>
                                             {msg.address.toLowerCase() === account.toLowerCase() 
                         ? 'You' 
                         : `${msg.address.slice(0, 6)}...${msg.address.slice(-4)}`}
                    </strong>
                                         <small>{msg.timestamp.toLocaleString('en-US')}</small>
                  </div>
                  <div className="message-content">
                    {msg.message}
                  </div>
                  <small className="message-indices">
                    Indices: [{msg.indices.join(', ')}]
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
                 <h3>🔐 How Encryption Works</h3>
         <ul>
           <li>📝 Each word in your message is converted to an index in words.txt</li>
           <li>🔢 Only indices are sent on the blockchain</li>
           <li>🔒 Without the words.txt file, messages are unreadable</li>
           <li>💡 Autocomplete helps you use words from the dictionary</li>
           <li>⚡ Navigation: ↑↓ to browse, Enter/Tab to select, Esc to close</li>
         </ul>
         
         <h4>📊 Statistics</h4>
         <p>
           <strong>Dictionary:</strong> {words.length.toLocaleString()} words loaded<br/>
           <strong>Messages:</strong> {chatHistory.length} in history<br/>
           <strong>Participants:</strong> {authorizedAddresses.length} authorized
         </p>
      </div>

      <DebugPanel 
        words={words} 
        chatHistory={chatHistory} 
        account={account} 
      />
    </div>
  );
}

export default App; 