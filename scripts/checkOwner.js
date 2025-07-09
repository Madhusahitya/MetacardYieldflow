const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x0fFC952ef5583F769C282533Ac7b6eA83f0Af6A1";
  const YieldFlow = await ethers.getContractFactory("YieldFlow");
  const yieldFlow = YieldFlow.attach(contractAddress);

  const owner = await yieldFlow.owner();
  console.log("Contract owner address:", owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});