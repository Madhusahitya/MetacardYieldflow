const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xdF9c96bb0BFd9Bc3808B2C1E2a2f10E89D9ed962"; // new contract address
  const aUSDCAddress = "0x2271e3Fef9e15046d09E1d78a8FF038c691E9Cf9";

  const YieldFlow = await ethers.getContractFactory("YieldFlow");
  const yieldFlow = YieldFlow.attach(contractAddress);

  const tx = await yieldFlow.setAUSDCAddress(aUSDCAddress);
  console.log("Transaction sent. Waiting for confirmation...");
  await tx.wait();
  console.log("aUSDC address set successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});