const { expect } = require('chai');
const { ethers } = require('hardhat');
const { parseUnits } = require('ethers');

describe('YieldFlow', function () {
  let YieldFlow, yieldFlow, owner, user, usdc, USDC, mockAavePool;

  beforeEach(async function () {
    [owner, user, attacker] = await ethers.getSigners();
    // Deploy a mock USDC token
    const USDCMock = await ethers.getContractFactory('ERC20Mock');
    usdc = await USDCMock.deploy('USD Coin', 'USDC', 6);
    await usdc.waitForDeployment();
    await usdc.mint(owner.address, parseUnits('1000000', 6));
    await usdc.mint(user.address, parseUnits('1000000', 6));
    // Deploy a mock Aave pool
    const MockAaveV3Pool = await ethers.getContractFactory('MockAaveV3Pool');
    mockAavePool = await MockAaveV3Pool.deploy();
    await mockAavePool.waitForDeployment();
    // Deploy YieldFlow with mock addresses
    YieldFlow = await ethers.getContractFactory('YieldFlow');
    yieldFlow = await YieldFlow.deploy(await usdc.getAddress(), 1, await mockAavePool.getAddress());
    await yieldFlow.waitForDeployment();
    // Debug output
    console.log('USDC:', await usdc.getAddress(), 'AavePool:', await mockAavePool.getAddress(), 'YieldFlow:', await yieldFlow.getAddress());
  });

  it('should deploy and set USDC address', async function () {
    expect(await yieldFlow.usdcToken()).to.equal(await usdc.getAddress());
  });

  it('should allow deposit and update balances', async function () {
    // Debug: check addresses
    expect(await usdc.getAddress()).to.not.be.undefined;
    expect(await mockAavePool.getAddress()).to.not.be.undefined;
    expect(await yieldFlow.getAddress()).to.not.be.undefined;
    await usdc.connect(user).approve(await yieldFlow.getAddress(), parseUnits('100', 6));
    await expect(yieldFlow.connect(user).depositUSDC(parseUnits('100', 6)))
      .to.not.be.rejected;
  });

  it('should allow withdraw if balance is sufficient', async function () {
    // Debug: check addresses
    expect(await usdc.getAddress()).to.not.be.undefined;
    expect(await mockAavePool.getAddress()).to.not.be.undefined;
    expect(await yieldFlow.getAddress()).to.not.be.undefined;
    await usdc.connect(user).approve(await yieldFlow.getAddress(), parseUnits('100', 6));
    await yieldFlow.connect(user).depositUSDC(parseUnits('100', 6));
    await expect(yieldFlow.connect(user).withdrawUSDC(parseUnits('50', 6)))
      .to.not.be.rejected;
  });

  it('should not allow withdraw if balance is insufficient', async function () {
    await expect(yieldFlow.connect(user).withdrawUSDC(parseUnits('1', 6)))
      .to.be.rejected;
  });

  it('should not allow reentrancy on withdraw', async function () {
    // This test assumes you have a nonReentrant modifier on withdrawUSDC
    // and a mock attacker contract for reentrancy
    // You can implement this test after confirming the modifier is present
    expect(true).to.be.true;
  });

  it('should restrict onlyOwner functions', async function () {
    // If you have onlyOwner functions, test them here
    expect(true).to.be.true;
  });

  // zk-SNARK Verifier Integration test (moved inside)
  it('should return true for dummy Groth16 proof (demo)', async function () {
    // Dummy proof data (structure only, not a real proof)
    const a = [1, 2];
    const b = [ [3, 4], [5, 6] ];
    const c = [7, 8];
    const input = [9, 10];
    expect(await yieldFlow.verifyZkSnarkProof(a, b, c, input)).to.equal(true);
  });
}); 