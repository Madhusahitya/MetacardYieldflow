const { expect } = require('chai');
const { ethers } = require('hardhat');
const { parseUnits, MaxUint256 } = require('ethers');

// Helper to get a random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe('YieldFlow (Fuzz/Property-Based)', function () {
  let YieldFlow, yieldFlow, owner, user, usdc, mockAavePool;
  const USDC_DECIMALS = 6;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const USDCMock = await ethers.getContractFactory('ERC20Mock');
    usdc = await USDCMock.deploy('USD Coin', 'USDC', USDC_DECIMALS);
    await usdc.waitForDeployment();
    await usdc.mint(owner.address, parseUnits('1000000', USDC_DECIMALS));
    await usdc.mint(user.address, parseUnits('1000000', USDC_DECIMALS));
    const MockAaveV3Pool = await ethers.getContractFactory('MockAaveV3Pool');
    mockAavePool = await MockAaveV3Pool.deploy();
    await mockAavePool.waitForDeployment();
    YieldFlow = await ethers.getContractFactory('YieldFlow');
    yieldFlow = await YieldFlow.deploy(await usdc.getAddress(), 1, await mockAavePool.getAddress());
    await yieldFlow.waitForDeployment();
  });

  it('should never allow withdraw more than deposited (fuzzed)', async function () {
    for (let i = 0; i < 10; i++) {
      const deposit = randomInt(1, 1_000_000);
      await usdc.connect(user).approve(await yieldFlow.getAddress(), deposit);
      await yieldFlow.connect(user).depositUSDC(deposit);
      // Withdraw a random amount up to deposited
      const withdraw = randomInt(0, deposit);
      await yieldFlow.connect(user).withdrawUSDC(withdraw);
      // Try to withdraw more than remaining (should fail)
      const overWithdraw = deposit - withdraw + 1;
      const userBalance = await yieldFlow.getDepositedUSDC(user.address);
      console.log(`deposit: ${deposit}, withdraw: ${withdraw}, overWithdraw: ${overWithdraw}, userBalance: ${userBalance}`);
      if (overWithdraw > Number(userBalance)) {
        await expect(yieldFlow.connect(user).withdrawUSDC(overWithdraw)).to.be.revertedWith('Insufficient deposited USDC to withdraw');
      }
    }
  });

  it('should not allow zero or negative deposits/withdrawals (edge cases)', async function () {
    await usdc.connect(user).approve(await yieldFlow.getAddress(), 100);
    await expect(yieldFlow.connect(user).depositUSDC(0)).to.be.revertedWith('Deposit amount must be greater than zero');
    await expect(yieldFlow.connect(user).withdrawUSDC(0)).to.be.revertedWith('Withdrawal amount must be greater than zero');
    await expect(yieldFlow.connect(user).withdrawUSDC(MaxUint256)).to.be.revertedWith('Insufficient deposited USDC to withdraw');
  });

  it('reputation should only increase on deposit, except by admin', async function () {
    const deposit = 1000;
    await usdc.connect(user).approve(await yieldFlow.getAddress(), deposit);
    await yieldFlow.connect(user).depositUSDC(deposit);
    const rep1 = await yieldFlow.getReputationScore(user.address);
    await usdc.connect(user).approve(await yieldFlow.getAddress(), deposit);
    await yieldFlow.connect(user).depositUSDC(deposit);
    const rep2 = await yieldFlow.getReputationScore(user.address);
    expect(Number(rep2)).to.be.gt(Number(rep1));
    // Only owner can decrease
    await yieldFlow.updateReputationScore(user.address, 1);
    const rep3 = await yieldFlow.getReputationScore(user.address);
    expect(Number(rep3)).to.be.lt(Number(rep2));
  });

  it('should not overflow/underflow balances (fuzzed)', async function () {
    for (let i = 0; i < 10; i++) {
      const deposit = randomInt(1, 1_000_000);
      await usdc.connect(user).approve(await yieldFlow.getAddress(), deposit);
      await yieldFlow.connect(user).depositUSDC(deposit);
      // Withdraw all
      await yieldFlow.connect(user).withdrawUSDC(deposit);
      const bal = await yieldFlow.getDepositedUSDC(user.address);
      expect(bal.toString()).to.equal('0');
    }
  });
}); 