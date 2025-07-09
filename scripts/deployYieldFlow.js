const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Aave Sepolia addresses
  const USDC_ADDRESS = "0x65aFADD39029741B3b8f0756952C74678c9cEC93";
  const AAVE_POOL_ADDRESS = "0xD64dDe119f11C88850FD596BE11CE398CC5893e6"; // Correct Sepolia Pool address
  const MIN_REPUTATION = 1;

  const YieldFlow = await ethers.getContractFactory("YieldFlow");
  const yieldFlow = await YieldFlow.deploy(USDC_ADDRESS, MIN_REPUTATION, AAVE_POOL_ADDRESS);
  await yieldFlow.deployed();
  console.log("YieldFlow deployed to:", yieldFlow.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 