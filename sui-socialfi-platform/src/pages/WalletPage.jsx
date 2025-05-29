// src/pages/WalletPage.jsx
import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { ArrowUpRight, ArrowDownLeft, Repeat as RepeatIcon } from 'lucide-react'; // Renamed Repeat to avoid conflict

const WalletPage = ({ user, onNavigate }) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedTokenForTx, setSelectedTokenForTx] = useState(null);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  if (!user) return <div>Loading user data...</div>;

  const userSuiBalance = user.suiBalance || 0;
  const userTokens = user.tokens || [];
  
  const totalPortfolioValue = userSuiBalance * 1 + userTokens.reduce((sum, token) => sum + (token.balance * token.price), 0);

  const handleSend = (token = null) => {
    const suiTokenRepresentation = { name: 'SUI', symbol: 'SUI', balance: userSuiBalance, logo: 'https://placehold.co/40x40/81E6D9/234E52?text=SUI', price: 1 }; // Assuming SUI price is 1 for this context
    setSelectedTokenForTx(token || suiTokenRepresentation);
    setShowSendModal(true);
  };

  const handleReceive = (token = null) => {
    const suiTokenRepresentation = { name: 'SUI', symbol: 'SUI', balance: userSuiBalance, logo: 'https://placehold.co/40x40/81E6D9/234E52?text=SUI', price: 1 };
    setSelectedTokenForTx(token || suiTokenRepresentation);
    setShowReceiveModal(true);
  };
  
  const executeSend = () => {
    if (!sendAddress || !sendAmount || parseFloat(sendAmount) <= 0) {
        alert("Please enter a valid address and amount.");
        return;
    }
    if (parseFloat(sendAmount) > selectedTokenForTx.balance) {
        alert("Insufficient balance.");
        return;
    }
    console.log(`Sending ${sendAmount} ${selectedTokenForTx.symbol} to ${sendAddress}`);
    // Real app: SUI transaction & update user state in App.jsx
    setShowSendModal(false);
    setSendAddress('');
    setSendAmount('');
  };

  return (
    <div className="p-4 sm:p-6">
      <Card className="mb-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white dark:from-purple-700 dark:to-indigo-800">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">My Wallet</h1>
            <p className="text-sm opacity-80">Your SUI Address: {user.address || "0x123...abc"}</p> {/* Assuming user object has an address */}
        </div>
        <p className="text-lg opacity-90">Total Portfolio Value</p>
        <p className="text-4xl font-bold mb-4">${totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        <div className="flex space-x-2 sm:space-x-3">
          <Button onClick={() => handleSend()} className="bg-white/20 hover:bg-white/30 text-white flex-1" icon={ArrowUpRight}>Send</Button>
          <Button onClick={() => handleReceive()} className="bg-white/20 hover:bg-white/30 text-white flex-1" icon={ArrowDownLeft}>Receive</Button>
          <Button onClick={() => onNavigate('trading')} className="bg-white/20 hover:bg-white/30 text-white flex-1" icon={RepeatIcon}>Trade</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">SUI Balance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="https://placehold.co/40x40/81E6D9/234E52?text=SUI" alt="SUI" className="w-10 h-10 rounded-full mr-3" />
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">SUI</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userSuiBalance.toLocaleString()} SUI</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">${userSuiBalance.toLocaleString()}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Token Balances</h2>
          {userTokens.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {userTokens.map(token => (
                <li key={token.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
                  <div className="flex items-center">
                    <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full mr-3" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{token.name} ({token.symbol})</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{token.balance.toLocaleString()} {token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800 dark:text-gray-100">${(token.balance * token.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <div className="flex space-x-1 justify-end mt-1">
                        <Button size="sm" variant="ghost" onClick={() => handleSend(token)} icon={ArrowUpRight} className="p-1 h-auto"/>
                        <Button size="sm" variant="ghost" onClick={() => handleReceive(token)} icon={ArrowDownLeft} className="p-1 h-auto"/>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">You don't have any other tokens yet.</p>
          )}
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Transaction History</h2>
        <p className="text-gray-500 dark:text-gray-400">Your recent transactions will appear here.</p>
        <ul className="mt-3 space-y-2 text-sm">
            <li className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between"><span>Sent 500 SOC to @charlie</span> <span className="text-gray-400">2 days ago</span></li>
            <li className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between"><span>Received 10 SUI from Launchpad</span> <span className="text-gray-400">5 days ago</span></li>
        </ul>
      </Card>

      <Modal isOpen={showSendModal} onClose={() => setShowSendModal(false)} title={`Send ${selectedTokenForTx?.symbol || 'Crypto'}`}>
        <Input label="Recipient Address" name="sendAddress" placeholder="0x..." value={sendAddress} onChange={(e) => setSendAddress(e.target.value)} required />
        <Input label={`Amount (${selectedTokenForTx?.symbol})`} name="sendAmount" type="number" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} required />
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Available Balance: {(selectedTokenForTx?.balance || 0).toLocaleString()} {selectedTokenForTx?.symbol}
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => setShowSendModal(false)}>Cancel</Button>
          <Button onClick={executeSend}>Send</Button>
        </div>
      </Modal>

      <Modal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} title={`Receive ${selectedTokenForTx?.symbol || 'Crypto'}`}>
        <p className="text-gray-700 dark:text-gray-200 mb-2">Your {selectedTokenForTx?.symbol} address:</p>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center mb-3 break-all">
          <p className="font-mono text-sm text-gray-800 dark:text-gray-100">0xYourUniqueAddressFor{selectedTokenForTx?.symbol}Here</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">Share this address to receive {selectedTokenForTx?.symbol}. Only send {selectedTokenForTx?.symbol} to this address.</p>
        <div className="w-40 h-40 bg-gray-200 dark:bg-gray-600 mx-auto rounded-lg flex items-center justify-center mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">QR Code</p>
        </div>
        <Button onClick={() => { navigator.clipboard.writeText(`0xYourUniqueAddressFor${selectedTokenForTx?.symbol}Here`); alert('Address copied to clipboard!'); }} className="w-full">
          Copy Address
        </Button>
      </Modal>
    </div>
  );
};

export default WalletPage;