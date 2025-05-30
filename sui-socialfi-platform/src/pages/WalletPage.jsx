// src/pages/WalletPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit'; 
import Card from '../components/Card';
import Button from '../components/Button';
import { Wallet as WalletIcon, RefreshCw, Loader2, Coins } from 'lucide-react';

const TokenRow = ({ token }) => (
  <div className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md">
    <div className="flex items-center">
      {token.iconUrl ? (
        <img src={token.iconUrl} alt={token.name} className="w-8 h-8 rounded-full mr-3" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3 text-gray-500 dark:text-gray-300 text-xs">
          {token.symbol ? token.symbol.substring(0, 2) : '?'}
        </div>
      )}
      <div>
        <p className="font-medium text-gray-800 dark:text-gray-100">{token.name || 'Unknown Token'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{token.symbol || 'N/A'}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-medium text-gray-800 dark:text-gray-100">
        {parseFloat(token.formattedBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: Math.min(8, token.decimals || 2) })}
      </p>
    </div>
  </div>
);

// WalletPage now relies on appUser prop for the SUI address
const WalletPage = ({ appUser }) => { 
  const suiClient = useSuiClient(); 
  
  const [suiBalance, setSuiBalance] = useState('0');
  const [tokenHoldings, setTokenHoldings] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false); 

  const fetchWalletData = useCallback(async () => {
    // Use appUser.sui_address now
    if (!appUser?.sui_address || !suiClient) {
      console.log("WalletPage: fetchWalletData - Bailing out: No appUser.sui_address or suiClient.");
      setSuiBalance('0');
      setTokenHoldings([]);
      setIsLoadingData(false);
      return;
    }
    const ownerAddress = appUser.sui_address;
    console.log("WalletPage: Fetching wallet data for", ownerAddress);
    
    setIsLoadingData(true);

    try {
      // Fetch SUI Balance
      const balanceObj = await suiClient.getBalance({ owner: ownerAddress, coinType: '0x2::sui::SUI' });
      const formattedSui = (Number(balanceObj.totalBalance) / 1_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
      setSuiBalance(formattedSui);

      // Fetch All Coins and their Metadata for Token Holdings
      const coinObjects = await suiClient.getAllCoins({ owner: ownerAddress });
      const uniqueCoinTypes = [...new Set(coinObjects.data.map(coin => coin.coinType))];
      
      const holdingsPromises = uniqueCoinTypes
        .filter(coinType => coinType !== '0x2::sui::SUI')
        .map(async (coinType) => {
          try {
            const metadata = await suiClient.getCoinMetadata({ coinType });
            const balanceObj = await suiClient.getBalance({ owner: ownerAddress, coinType });

            if (metadata && balanceObj && Number(balanceObj.totalBalance) > 0) { 
              return {
                coinType: coinType,
                name: metadata.name,
                symbol: metadata.symbol,
                decimals: metadata.decimals,
                iconUrl: metadata.iconUrl,
                balance: balanceObj.totalBalance,
                formattedBalance: (Number(balanceObj.totalBalance) / (10 ** metadata.decimals)).toString()
              };
            }
          } catch (metaError) {
            console.warn(`Could not fetch metadata for ${coinType}:`, metaError.message);
            try {
                const balanceObj = await suiClient.getBalance({ owner: ownerAddress, coinType });
                if (balanceObj && Number(balanceObj.totalBalance) > 0) {
                    return {
                        coinType: coinType,
                        name: coinType.split('::')[2] || 'Unknown Token', 
                        symbol: coinType.split('::')[2]?.substring(0,4).toUpperCase() || 'UNKN', 
                        decimals: 0, 
                        iconUrl: null,
                        balance: balanceObj.totalBalance,
                        formattedBalance: balanceObj.totalBalance 
                    };
                }
            } catch { /* ignore if balance also fails after metadata failure */ }
          }
          return null; 
        });
      
      const resolvedHoldings = (await Promise.all(holdingsPromises)).filter(h => h !== null); 
      setTokenHoldings(resolvedHoldings.sort((a, b) => a.symbol.localeCompare(b.symbol)));

    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setSuiBalance('Error');
      setTokenHoldings([]);
    } finally {
      setIsLoadingData(false);
    }

  }, [appUser?.sui_address, suiClient]); // Depends on appUser.sui_address

  useEffect(() => {
    // Fetch data if appUser and suiClient are available
    if (appUser?.sui_address && suiClient) {
      fetchWalletData();
    } else {
      // Clear data if appUser or suiClient is not available
      setSuiBalance('0');
      setTokenHoldings([]);
    }
  }, [appUser?.sui_address, suiClient, fetchWalletData]);

  // Display logic now depends on appUser prop
  if (!appUser?.sui_address) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Please connect your wallet and ensure your profile is loaded to view assets.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center mb-4 sm:mb-0">
          <WalletIcon size={32} className="mr-3 text-blue-600 dark:text-blue-400" />
          My Wallet
        </h1>
        <Button onClick={fetchWalletData} disabled={isLoadingData} icon={isLoadingData ? Loader2 : RefreshCw} className={isLoadingData ? 'animate-spin' : ''}>
          Refresh Wallet
        </Button>
      </header>

      <Card>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">SUI Balance</h2>
        {isLoadingData ? ( 
          <div className="flex justify-center items-center h-16">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : (
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {suiBalance} <span className="text-2xl">SUI</span>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Token Holdings</h2>
        {isLoadingData ? ( 
          <div className="flex justify-center items-center h-24">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : tokenHoldings.length > 0 ? (
          <div className="divide-y dark:divide-gray-700 -mx-2">
            {tokenHoldings.map(token => (
              <TokenRow key={token.coinType} token={token} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">No other tokens found.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Transaction History</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-6">
          Transaction history coming soon.
        </p>
      </Card>
    </div>
  );
};

export default WalletPage;
