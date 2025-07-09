import React, { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import YieldFlowArtifact from "../abis/YieldFlow.json";
const YieldFlowABI = YieldFlowArtifact.abi;

const YIELD_FLOW_ADDRESS = "0xdF9c96bb0BFd9Bc3808B2C1E2a2f10E89D9ed962";

export function YieldDisplay() {
  const [yieldAmount, setYieldAmount] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchYield() {
      if (!window.ethereum) {
        setError("MetaMask not detected");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(YIELD_FLOW_ADDRESS, YieldFlowABI, provider);
      try {
        const yieldWei = await contract.getTotalYieldEarned();
        setYieldAmount(formatUnits(yieldWei, 6)); // 6 decimals for USDC
        setError(null);
      } catch (err: any) {
        setError(err.message || "Error fetching yield");
        setYieldAmount("0");
      }
    }
    fetchYield();
  }, []);

  return (
    <div>
      <h3>Yield Earned via Aave</h3>
      {error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : (
        <p>
          <strong>{yieldAmount} USDC</strong>
        </p>
      )}
    </div>
  );
}