const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const ethers = require('ethers');
const router = express.Router();

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_API_BASE_URL = process.env.CIRCLE_API_BASE_URL || 'https://api.circle.com/v1';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/hsMtJRtWfMMB-jqirZUfKVX1-JIQYo8K';
const YIELDFLOW_CONTRACT_ADDRESS = process.env.REACT_APP_YIELDFLOW_CONTRACT || '0x383C18A370fb0020e911e362924f7266C117091A';
const YIELDFLOW_ABI = [
  "function getReputationScore(address) view returns (uint256)"
];
const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const yieldFlowContract = new ethers.Contract(YIELDFLOW_CONTRACT_ADDRESS, YIELDFLOW_ABI, provider);

// Rate limiter: 5 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later.' }
});
router.use('/topup', limiter);

// Helper: Axios instance with Circle API key
const circleApi = axios.create({
  baseURL: CIRCLE_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${CIRCLE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Helper: Validate input
function validateTopupInput(amount, currency, cardId, walletAddress) {
  if (!amount || isNaN(amount) || Number(amount) <= 0) return 'Invalid amount.';
  if (!currency || currency !== 'USD') return 'Only USD is supported.';
  if (!cardId || typeof cardId !== 'string' || cardId.length < 8) return 'Invalid cardId.';
  if (!walletAddress || !ethers.isAddress(walletAddress)) return 'Invalid walletAddress.';
  return null;
}

/**
 * POST /api/circle/topup
 * Body: { amount, currency, cardId, walletAddress }
 */
router.post('/topup', async (req, res) => {
  const { amount, currency, cardId, walletAddress } = req.body;

  // Input validation
  const validationError = validateTopupInput(amount, currency, cardId, walletAddress);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // On-chain reputation gating
  let reputation;
  try {
    reputation = await yieldFlowContract.getReputationScore(walletAddress);
  } catch (err) {
    console.error('[Reputation Check Error]', err);
    return res.status(500).json({ error: 'Failed to check on-chain reputation.' });
  }
  const minReputation = 1; // Set your threshold
  if (reputation < minReputation) {
    return res.status(403).json({ error: 'Insufficient reputation for top-up.' });
  }

  try {
    // Add metadata for tracking (optional)
    const metadata = { walletAddress };

    // Create a card top-up
    const response = await circleApi.post('/cards/payments', {
      amount: { amount: amount.toString(), currency },
      verification: 'none',
      source: { id: cardId, type: 'card' },
      metadata
    });

    if (response.data && response.data.data) {
      // Log the successful top-up (for audit, not user-facing)
      console.log(`[Circle Top-Up] Success: ${JSON.stringify({
        walletAddress, cardId, amount, paymentId: response.data.data.id
      })}`);
      return res.json({
        success: true,
        paymentId: response.data.data.id,
        status: response.data.data.status,
        data: response.data.data
      });
    } else {
      return res.status(500).json({ error: 'Unexpected Circle API response.' });
    }
  } catch (err) {
    // Log the error for debugging
    console.error('[Circle Top-Up Error]', err.response?.data || err.message);
    let errorMsg = 'Circle API error';
    if (err.response && err.response.data) {
      errorMsg = err.response.data.error || JSON.stringify(err.response.data);
    } else if (err.message) {
      errorMsg = err.message;
    }
    return res.status(500).json({ error: errorMsg });
  }
});

module.exports = router;