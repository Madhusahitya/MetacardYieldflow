const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ReputationNFT', function () {
  let ReputationNFT, reputationNFT, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    ReputationNFT = await ethers.getContractFactory('ReputationNFT');
    reputationNFT = await ReputationNFT.deploy("MetaCard Reputation", "MCR");
    await reputationNFT.waitForDeployment();
    // Grant MINTER_ROLE to owner for testing
    const MINTER_ROLE = await reputationNFT.MINTER_ROLE();
    await reputationNFT.grantRole(MINTER_ROLE, owner.address);
  });

  it('should grant MINTER_ROLE to owner', async function () {
    const MINTER_ROLE = await reputationNFT.MINTER_ROLE();
    expect(await reputationNFT.hasRole(MINTER_ROLE, owner.address)).to.be.true;
  });

  it('should mint NFT to user with MINTER_ROLE', async function () {
    await reputationNFT.mintReputationNFT(user.address);
    expect((await reputationNFT.balanceOf(user.address)).toString()).to.equal('1');
  });

  it('should not mint NFT if caller lacks MINTER_ROLE', async function () {
    await expect(reputationNFT.connect(user).mintReputationNFT(user.address)).to.be.rejectedWith('AccessControl');
  });

  it('should burn NFT with MINTER_ROLE', async function () {
    await reputationNFT.mintReputationNFT(user.address);
    const tokenId = await reputationNFT.userReputationNFT(user.address);
    await reputationNFT.burnReputationNFT(user.address, tokenId);
    expect((await reputationNFT.balanceOf(user.address)).toString()).to.equal('0');
  });
}); 