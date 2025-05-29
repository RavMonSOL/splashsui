// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Imports for @mysten/dapp-kit
import { WalletProvider } from '@mysten/dapp-kit';
import { SuiClientProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import '@mysten/dapp-kit/dist/index.css'; // Import default styles for dapp-kit components

// Imports for react-query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Define RPC URLs
const mainnetRpcUrl = getFullnodeUrl('mainnet');
const devnetRpcUrl = getFullnodeUrl('devnet');
const testnetRpcUrl = getFullnodeUrl('testnet');

// Log URLs for debugging (optional, can be removed after verification)
console.log("SUI Mainnet RPC URL:", mainnetRpcUrl);
console.log("SUI Devnet RPC URL:", devnetRpcUrl);
console.log("SUI Testnet RPC URL:", testnetRpcUrl);

if (!mainnetRpcUrl || !devnetRpcUrl || !testnetRpcUrl) {
    // This error will stop the app if URLs can't be fetched, which is good for early detection.
    throw new Error("Failed to retrieve one or more RPC URLs for SUI networks. Check SDK or network status.");
}

// Use createNetworkConfig to get both the network configurations and a determined default.
// We'll explicitly set mainnet as the one we want to use for this setup.
const { networkConfig, defaultNetwork } = createNetworkConfig({
  mainnet: { url: mainnetRpcUrl },
  devnet: { url: devnetRpcUrl },
  testnet: { url: testnetRpcUrl },
});

// Log the generated config for debugging
console.log("Generated Network Config by createNetworkConfig:", networkConfig);
console.log("Determined Default Network by createNetworkConfig:", defaultNetwork);


// Create a QueryClient instance
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={networkConfig} // Pass the generated networkConfig object
        defaultNetwork={"mainnet"} // Explicitly set your desired default network
        // You can also use `defaultNetwork={defaultNetwork}` if you trust createNetworkConfig's choice
      >
        <WalletProvider 
            autoConnect={false} // User must click to connect
            // Other WalletProvider props can be added here if needed
        >
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
