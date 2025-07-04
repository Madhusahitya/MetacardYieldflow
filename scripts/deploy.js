require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Get constructor arguments from env
  const usdcAddress = process.env.USDC_ADDRESS;
  const minReputation = 1; // Set your minimum reputation requirement

  // Deploy ReputationNFT first
  const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
  const repNFT = await ReputationNFT.deploy("MetaCard Reputation Badge", "MCRB");
  await repNFT.deployed();
  console.log("ReputationNFT deployed to:", repNFT.address);

  // Deploy YieldFlow
  const YieldFlow = await ethers.getContractFactory("YieldFlow");
  const yieldFlow = await YieldFlow.deploy(usdcAddress, minReputation);
  await yieldFlow.deployed();
  console.log("YieldFlow deployed to:", yieldFlow.address);

  // Grant MINTER_ROLE to YieldFlow contract
  const MINTER_ROLE = await repNFT.MINTER_ROLE();
  const grantTx = await repNFT.grantRole(MINTER_ROLE, yieldFlow.address);
  await grantTx.wait();
  console.log(`Granted MINTER_ROLE to YieldFlow at ${yieldFlow.address}`);

  // Set NFT contract address in YieldFlow
  const setNFTTx = await yieldFlow.setReputationNFTContract(repNFT.address);
  await setNFTTx.wait();
  console.log(`Set ReputationNFT contract in YieldFlow.`);

  // Done
  console.log("Deployment and setup complete!");
  console.log("ReputationNFT:", repNFT.address);
  console.log("YieldFlow:", yieldFlow.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});