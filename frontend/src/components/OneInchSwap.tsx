import React, { useState } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import USDCABI from "../abis/USDC.json";

const USDC_ADDRESS = "0x65aFADD39029741B3b8f0756952C74678c9cEC93"; // Sepolia USDC
const ONEINCH_API = "https://api.1inch.dev/swap/v5.2/11155111"; // Sepolia

// IMPORTANT: Set your 1inch API key in .env as REACT_APP_1INCH_API_KEY
const ONEINCH_API_KEY = process.env.REACT_APP_1INCH_API_KEY;

export function OneInchCustomSwap() {
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSwap() {
    setTxStatus("Swapping...");
    setError(null);
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      if (!ONEINCH_API_KEY) throw new Error("1inch API key not set. Please set REACT_APP_1INCH_API_KEY in your .env file.");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      // 1inch API expects amount in wei
      const amountWei = parseUnits(amount, 6).toString();

      // Build the API URL for USDC -> ETH swap
      const url = `/1inch-proxy/swap/v5.2/11155111/swap?src=${USDC_ADDRESS}&dst=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&amount=${amountWei}&from=${account}&slippage=1`;

      // Fetch the swap transaction data
      const res = await fetch(url, {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${ONEINCH_API_KEY}`
        }
      });
      const data = await res.json();
      if (!data.tx) throw new Error(data.description || "Swap failed");

      // Approve USDC if needed
      const usdc = new Contract(USDC_ADDRESS, USDCABI, signer);
      const allowance = await usdc.allowance(account, data.tx.to);
      if (BigInt(allowance.toString()) < BigInt(amountWei)) {
        const approveTx = await usdc.approve(data.tx.to, amountWei);
        await approveTx.wait();
      }

      // Send the swap transaction
      const tx = await signer.sendTransaction({
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value ? BigInt(data.tx.value) : 0n,
        gasLimit: data.tx.gas ? BigInt(data.tx.gas) : undefined
      });
      await tx.wait();
      setTxStatus("Swap successful!");
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Swap failed");
      setTxStatus(null);
    }
  }

  const isAmountValid = !!amount && !isNaN(Number(amount)) && Number(amount) > 0;

  return (
    <div style={{
      maxWidth: 400,
      margin: "2rem auto",
      padding: "2rem",
      borderRadius: 20,
      background: "linear-gradient(120deg, #f7faff 0%, #e5ffc3 100%)",
      boxShadow: "0 4px 24px 0 rgba(60,60,100,0.10)",
      border: "1.5px solid #e0e7fa"
    }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16, color: '#013330', textAlign: 'center' }}>
        Swap USDC to ETH (1inch)
      </h2>
      <label style={{ fontWeight: 500, color: '#013330', marginBottom: 8, display: 'block' }}>
        Amount (USDC):
      </label>
      <input
        type="number"
        min="0"
        step="0.000001"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Enter USDC amount"
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          borderRadius: 12,
          border: "1.5px solid #c3eaff",
          fontSize: 16,
          marginBottom: 16,
          background: "#fff"
        }}
        disabled={txStatus === "Swapping..."}
      />
      <button
        onClick={handleSwap}
        disabled={!isAmountValid || txStatus === "Swapping..."}
        style={{
          width: "100%",
          padding: "0.75rem 0",
          borderRadius: 12,
          background: isAmountValid && txStatus !== "Swapping..." ? "#ff7c2b" : "#e0e7fa",
          color: isAmountValid && txStatus !== "Swapping..." ? "#fff" : "#aaa",
          fontWeight: 700,
          fontSize: 18,
          border: "none",
          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.07)",
          cursor: isAmountValid && txStatus !== "Swapping..." ? "pointer" : "not-allowed",
          marginBottom: 12
        }}
      >
        {txStatus === "Swapping..." ? "Swapping..." : "Swap Now"}
      </button>
      {txStatus && txStatus !== "Swapping..." && (
        <div style={{ color: "green", fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{txStatus}</div>
      )}
      {error && (
        <div style={{ color: "red", fontWeight: 600, marginTop: 8, textAlign: 'center' }}>Error: {error}</div>
      )}
      <div style={{ fontSize: 12, color: '#888', marginTop: 18, textAlign: 'center' }}>
        Powered by 1inch Aggregation API
      </div>
    </div>
  );
}