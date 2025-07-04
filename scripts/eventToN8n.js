// eventToN8n.js
// Listens for YieldFlow Spent events and POSTs to n8n webhook

const { ethers } = require('ethers');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const fs = require('fs');

// --- CONFIG ---
const YIELDFLOW_ADDRESS = '0x0fFC952ef5583F769C282533Ac7b6eA83f0Af6A1';
const YIELDFLOW_ABI = JSON.parse(fs.readFileSync(__dirname + '/../frontend/src/abis/YieldFlow.json')).abi;
const N8N_WEBHOOK_URL = 'https://madzuhhh.app.n8n.cloud/webhook/5c83ffaa-2df1-4401-a182-1498e0bd9e3c';
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/hsMtJRtWfMMB-jqirZUfKVX1-JIQYo8K';

// --- SETUP ---
const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC);
const contract = new ethers.Contract(YIELDFLOW_ADDRESS, YIELDFLOW_ABI, provider);

console.log('Listening for Spent events on YieldFlow...');

contract.on('Spent', async (user, token, amount, purpose, event) => {
  try {
    const data = {
      user,
      token,
      amount: amount.toString(),
      purpose,
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: Date.now()
    };
    console.log('Spent event:', data);
    // POST to n8n webhook
    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!resp.ok) {
      console.error('Failed to POST to n8n:', await resp.text());
    } else {
      console.log('Posted to n8n webhook.');
    }
  } catch (err) {
    console.error('Error handling event:', err);
  }
});

contract.on('FundsWithdrawn', async (user, token, amount, event) => {
  // ...post to n8n...
}); 