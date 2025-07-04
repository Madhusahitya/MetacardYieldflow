const { expect } = require("chai");

describe("MetaCardYieldFlow", function () {
  let MetaCardYieldFlow, metaCard, usdc, owner, addr1;
  const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  beforeEach(async function () {
    MetaCardYieldFlow = await ethers.getContractFactory("MetaCardYieldFlow");
    [owner, addr1] = await ethers.getSigners();
    metaCard = await MetaCardYieldFlow.deploy(usdcAddress);
    await metaCard.deployed();
  });

  it("Should deposit yield and update reputation", async function () {
    // Mock USDC approval (requires testnet USDC)
    await metaCard.connect(addr1).depositYield(1000000); // 1 USDC
    expect(await metaCard.yieldBalances(addr1.address)).to.equal(1000000);
    expect(await metaCard.reputationScores(addr1.address)).to.equal(1);
  });
});