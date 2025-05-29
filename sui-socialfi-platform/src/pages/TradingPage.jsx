// src/pages/TradingPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { CheckCircle, ExternalLink, Info, Repeat as RepeatIcon } from 'lucide-react';

// Removed 'onNavigate' from props as it's not used within this component's current logic
const TradingPage = ({ user, trendingTokens, initialToken, onTrade }) => {
  const allTokens = useMemo(() => {
    const tokenMap = new Map();
    if (user && user.tokens) {
        user.tokens.forEach(token => tokenMap.set(token.id, {...token}));
    }
    // Ensure trendingTokens is always an array before calling forEach
    (trendingTokens || []).forEach(token => {
        if (!tokenMap.has(token.id)) {
            tokenMap.set(token.id, {...token});
        } else { 
            const existing = tokenMap.get(token.id);
            tokenMap.set(token.id, {...token, ...existing});
        }
    });
    return Array.from(tokenMap.values());
  }, [user, trendingTokens]);
  
  const [selectedToken, setSelectedToken] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeAction, setTradeAction] = useState('buy');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let currentSelected = null;
    if (initialToken) {
        currentSelected = allTokens.find(t => t.id === initialToken.id) || null;
    }
    if (!currentSelected && allTokens.length > 0) {
        currentSelected = allTokens[0];
    }
    setSelectedToken(currentSelected);
  }, [initialToken, allTokens]);


  if (!user) return <div className="p-6 text-center">Loading user data...</div>;
  if (allTokens.length === 0) return <div className="p-6 text-center">No tokens available for trading.</div>;
  if (!selectedToken) {
      return <div className="p-6 text-center">Selecting token or no token found...</div>;
  }

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
    setTradeAmount('');
  };

  const handleTrade = () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (tradeAction === 'buy' && (parseFloat(tradeAmount) * selectedToken.price) > user.suiBalance) {
      alert("Insufficient SUI balance for this purchase.");
      return;
    }
    const userTokenBalance = user.tokens?.find(t => t.id === selectedToken.id)?.balance || 0;
    if (tradeAction === 'sell' && parseFloat(tradeAmount) > userTokenBalance) {
      alert(`Insufficient ${selectedToken.symbol} balance.`);
      return;
    }
    setShowConfirmModal(true);
  };
  
  const confirmTrade = () => {
    if (onTrade) {
        onTrade(tradeAction, selectedToken, parseFloat(tradeAmount));
    } else {
        console.warn("onTrade prop is missing in TradingPage");
    }
    
    setShowConfirmModal(false);
    setTradeAmount('');
    // This alert is just for simulation. Actual balance updates would come from App.jsx state.
    alert(`Trade confirmed! ${tradeAction === 'buy' ? 'Bought' : 'Sold'} ${tradeAmount} ${selectedToken.symbol}.`);
  };

  const userSuiBalance = user.suiBalance || 0;
  const userSelectedTokenBalance = user.tokens?.find(t => t.id === selectedToken.id)?.balance || 0;

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Available Tokens</h2>
          {allTokens.length > 0 ? (
            <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
              {allTokens.map(token => (
                <div
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-all ${selectedToken.id === token.id ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <div className="flex items-center">
                    <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full mr-3 object-cover" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{token.name} ({token.symbol})</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Price: ${token.price ? token.price.toFixed(selectedToken.isLaunch ? 4 : 2) : 'N/A'}</p>
                    </div>
                  </div>
                  {selectedToken.id === token.id && <CheckCircle size={20} className="text-blue-500" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No tokens found.</p>
          )}
        </Card>
        
        {selectedToken && (
          <Card>
            <div className="flex items-center mb-3">
              <img src={selectedToken.logo} alt={selectedToken.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedToken.name} ({selectedToken.symbol})</h2>
                <p className="text-lg text-gray-700 dark:text-gray-200">
                    ${selectedToken.price ? selectedToken.price.toFixed(selectedToken.isLaunch ? 4 : 2) : 'N/A'}
                  {selectedToken.change && selectedToken.change !== "N/A" &&
                    <span className={`ml-2 text-sm font-semibold ${selectedToken.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedToken.change}
                    </span>
                  }
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
              {selectedToken.description || `Details for ${selectedToken.name}.`}
            </p>
            {selectedToken.isLaunch && (
                <div className="text-xs text-blue-500 dark:text-blue-400 mt-1 mb-2 p-2 bg-blue-50 dark:bg-blue-900 rounded">
                    This token is in its launch phase. Liquidity might be forming.
                    Goal: {selectedToken.goal}, Raised: {selectedToken.raised}, Ends: {selectedToken.endsIn}
                </div>
            )}
            <div className="flex space-x-2 mt-3">
                {/* These should ideally be actual links or trigger other actions */}
                <a href={selectedToken.website || "#"} target="_blank" rel="noopener noreferrer" className={`${selectedToken.website ? '' : 'pointer-events-none opacity-50'}`}>
                    <Button variant="ghost" size="sm" icon={ExternalLink} disabled={!selectedToken.website}>Website</Button>
                </a>
                <Button variant="ghost" size="sm" icon={Info} onClick={() => alert('Navigate to token details/explorer on SUIscan or similar')}>Details</Button>
            </div>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Price Chart ({selectedToken.symbol}/SUI)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Live price data and historical performance.</p>
          <div className="h-64 sm:h-80 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Trading Chart Placeholder for {selectedToken.symbol}</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Trade {selectedToken.symbol}</h3>
          <div className="flex mb-4 rounded-lg p-1 bg-gray-100 dark:bg-gray-700">
            <button 
              onClick={() => setTradeAction('buy')}
              className={`w-1/2 py-2 px-4 rounded-md font-medium transition-colors ${tradeAction === 'buy' ? 'bg-green-500 text-white shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800'}`}
            >Buy</button>
            <button 
              onClick={() => setTradeAction('sell')}
              className={`w-1/2 py-2 px-4 rounded-md font-medium transition-colors ${tradeAction === 'sell' ? 'bg-red-500 text-white shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-800'}`}
            >Sell</button>
          </div>
          
          <Input
            label={`Amount in ${selectedToken.symbol}`}
            type="number"
            name="tradeAmount"
            placeholder="0.00"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(e.target.value)}
          />
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            <p>Estimated Cost: {(parseFloat(tradeAmount) * (selectedToken.price || 0) || 0).toFixed(4)} SUI</p>
            <p>Your SUI Balance: {userSuiBalance.toFixed(2)} SUI</p>
            <p>Your {selectedToken.symbol} Balance: {userSelectedTokenBalance.toLocaleString()} {selectedToken.symbol}</p>
          </div>
          <Button 
            onClick={handleTrade} 
            className="w-full" 
            variant={tradeAction === 'buy' ? 'primary' : 'danger'}
            disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || !selectedToken || selectedToken.price === undefined} // Disable if price is not available
          >
            {tradeAction === 'buy' ? `Buy ${selectedToken.symbol}` : `Sell ${selectedToken.symbol}`}
          </Button>
        </Card>
      </div>
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Trade">
        <p className="text-gray-700 dark:text-gray-200 mb-2">
          You are about to {tradeAction} <span className="font-semibold">{tradeAmount} {selectedToken.symbol}</span>.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Estimated total: <span className="font-semibold">{(parseFloat(tradeAmount) * (selectedToken.price || 0) || 0).toFixed(4)} SUI</span>.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            Note: Prices may vary slightly due to market volatility. This is a simulation.
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
          <Button onClick={confirmTrade} variant={tradeAction === 'buy' ? 'primary' : 'danger'}>Confirm {tradeAction.charAt(0).toUpperCase() + tradeAction.slice(1)}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TradingPage;