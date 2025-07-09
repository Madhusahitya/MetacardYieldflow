// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ReputationNFT.sol";
import "./IAaveV3Pool.sol";
import "./Groth16Verifier.sol";

/// @title YieldFlow
/// @notice Secure, gas-optimized DeFi contract for MetaCard YieldFlow
/// @dev Uses nonReentrant, onlyOwner, and best-practice ERC20 approval patterns
contract YieldFlow is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /// @notice USDC token used for deposits
    IERC20 public usdcToken;
    /// @notice Special address for native ETH deposits
    address public immutable ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    ReputationNFT public reputationNFT;
    uint256[] public reputationMilestones = [10, 50, 100];
    mapping(address => mapping(uint256 => bool)) public milestoneAwarded;
    mapping(address => uint256) public depositedUSDC;
    mapping(address => uint256) public depositedETH;
    mapping(address => uint256) public reputationScores;
    uint256 public minReputationForYieldAccess;
    IAaveV3Pool public aavePool;
    address public aavePoolAddress;
    address public aUSDCAddress;

    /// @notice Emitted when NFT minting fails
    event NFTMintFailed(address indexed user, uint256 score, string reason);
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Spent(address indexed user, address indexed token, uint256 amount, string purpose);
    event ReputationScoreUpdated(address indexed user, uint256 newScore);
    event YieldClaimed(address indexed user, uint256 amount);
    event FundsWithdrawn(address indexed user, address indexed token, uint256 amount);

    /// @notice Constructor sets USDC, min reputation, and Aave pool. Approves max allowance for Aave.
    constructor(address _usdcAddress, uint256 _minReputation, address _aavePoolAddress) {
        require(_usdcAddress != address(0), "USDC address cannot be zero");
        require(_aavePoolAddress != address(0), "Aave Pool address cannot be zero");
        usdcToken = IERC20(_usdcAddress);
        minReputationForYieldAccess = _minReputation;
        aavePoolAddress = _aavePoolAddress;
        aavePool = IAaveV3Pool(_aavePoolAddress);
        // Approve max allowance for Aave pool (gas optimization)
        usdcToken.approve(_aavePoolAddress, type(uint256).max);
    }

    /// @notice Set the ReputationNFT contract address (admin only)
    function setReputationNFTContract(address _nft) external onlyOwner {
        require(_nft != address(0), "NFT address cannot be zero");
        reputationNFT = ReputationNFT(_nft);
    }

    /// @notice Set the Aave Pool contract address (admin only)
    function setAavePoolAddress(address _aavePoolAddress) external onlyOwner {
        require(_aavePoolAddress != address(0), "Aave Pool address cannot be zero");
        aavePoolAddress = _aavePoolAddress;
        aavePool = IAaveV3Pool(_aavePoolAddress);
        // Approve max allowance for new pool
        usdcToken.approve(_aavePoolAddress, type(uint256).max);
    }

    /// @notice Set the aUSDC token address (admin only)
    function setAUSDCAddress(address _aUSDCAddress) external onlyOwner {
        require(_aUSDCAddress != address(0), "aUSDC address cannot be zero");
        aUSDCAddress = _aUSDCAddress;
    }

    /// @notice Deposit USDC, supply to Aave, update reputation, and emit events
    /// @dev Approves Aave only if allowance is insufficient (gas optimization)
    function depositUSDC(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Deposit amount must be greater than zero");
        bool success = usdcToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "USDC transfer failed");
        // Approve Aave if needed
        uint256 allowance = usdcToken.allowance(address(this), aavePoolAddress);
        if (allowance < _amount) {
            usdcToken.approve(aavePoolAddress, type(uint256).max);
        }
        aavePool.supply(address(usdcToken), _amount, address(this), 0);
        depositedUSDC[msg.sender] = depositedUSDC[msg.sender].add(_amount);
        reputationScores[msg.sender] = reputationScores[msg.sender].add(1);
        emit ReputationScoreUpdated(msg.sender, reputationScores[msg.sender]);
        emit Deposited(msg.sender, address(usdcToken), _amount);
        _checkAndMintMilestone(msg.sender, reputationScores[msg.sender]);
    }

    /// @notice Deposit native ETH (not yield-earning)
    function depositETH() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        depositedETH[msg.sender] = depositedETH[msg.sender].add(msg.value);
        emit Deposited(msg.sender, ETH_ADDRESS, msg.value);
    }

    /// @notice Spend deposited USDC (simulated card spend)
    function spendUSDC(uint256 _amount, string calldata _purpose) external nonReentrant {
        require(_amount > 0, "Spend amount must be greater than zero");
        require(depositedUSDC[msg.sender] >= _amount, "Insufficient USDC balance");
        depositedUSDC[msg.sender] = depositedUSDC[msg.sender].sub(_amount);
        emit Spent(msg.sender, address(usdcToken), _amount, _purpose);
    }

    /// @notice Spend deposited ETH (simulated card spend)
    function spendETH(uint256 _amount, string calldata _purpose) external nonReentrant {
        require(_amount > 0, "Spend amount must be greater than zero");
        require(depositedETH[msg.sender] >= _amount, "Insufficient ETH balance");
        depositedETH[msg.sender] = depositedETH[msg.sender].sub(_amount);
        emit Spent(msg.sender, ETH_ADDRESS, _amount, _purpose);
    }

    /// @notice Update a user's reputation score (admin only)
    function updateReputationScore(address _user, uint256 _newScore) external onlyOwner {
        require(_user != address(0), "User address cannot be zero");
        reputationScores[_user] = _newScore;
        emit ReputationScoreUpdated(_user, _newScore);
        _checkAndMintMilestone(_user, _newScore);
    }

    /// @notice Set the minimum reputation required for yield access (admin only)
    function setMinReputationForYieldAccess(uint256 _newMinReputation) external onlyOwner {
        minReputationForYieldAccess = _newMinReputation;
    }

    /// @notice Withdraw deposited USDC, redeem from Aave, and emit events
    function withdrawUSDC(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(depositedUSDC[msg.sender] >= _amount, "Insufficient deposited USDC to withdraw");
        depositedUSDC[msg.sender] = depositedUSDC[msg.sender].sub(_amount);
        uint256 withdrawn = aavePool.withdraw(address(usdcToken), _amount, address(this));
        require(withdrawn == _amount, "Aave withdrawal failed or partial");
        bool success = usdcToken.transfer(msg.sender, _amount);
        require(success, "USDC withdrawal transfer failed");
        emit FundsWithdrawn(msg.sender, address(usdcToken), _amount);
    }

    /// @notice Withdraw deposited ETH and emit events
    function withdrawETH(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(depositedETH[msg.sender] >= _amount, "Insufficient deposited ETH to withdraw");
        depositedETH[msg.sender] = depositedETH[msg.sender].sub(_amount);
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "ETH withdrawal failed");
        emit FundsWithdrawn(msg.sender, ETH_ADDRESS, _amount);
    }

    /// @notice Get deposited USDC balance for a user
    function getDepositedUSDC(address _user) external view returns (uint256) {
        return depositedUSDC[_user];
    }

    /// @notice Get deposited ETH balance for a user
    function getDepositedETH(address _user) external view returns (uint256) {
        return depositedETH[_user];
    }

    /// @notice Get reputation score for a user
    function getReputationScore(address _user) external view returns (uint256) {
        return reputationScores[_user];
    }

    /// @notice Not implemented: requires user list tracking (off-chain recommended)
    function getTotalDepositedUSDC() public view returns (uint256 total) {
        revert("Not implemented: requires user list tracking");
    }

    /// @notice Get total yield earned by the contract on Aave (aUSDC balance - principal)
    function getTotalYieldEarned() public view returns (uint256) {
        IERC20 aUSDC = IERC20(aUSDCAddress);
        uint256 aUSDCBalance = aUSDC.balanceOf(address(this));
        uint256 principal = 0;
        if (aUSDCBalance > principal) {
            return aUSDCBalance - principal;
        } else {
            return 0;
        }
    }

    /**
     * @notice Verifies a zk-SNARK proof using the integrated Groth16 verifier
     * @param a Proof parameter a
     * @param b Proof parameter b
     * @param c Proof parameter c
     * @param input Public inputs to the proof
     * @return True if the proof is valid, false otherwise
     */
    function verifyZkSnarkProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) public pure returns (bool) {
        return Groth16Verifier.verifyProof(a, b, c, input);
    }

    /// @dev Internal: Check and mint NFT badge if milestone crossed, emit event on failure
    function _checkAndMintMilestone(address user, uint256 newScore) internal {
        if (address(reputationNFT) == address(0)) return;
        for (uint256 i = 0; i < reputationMilestones.length; i++) {
            uint256 milestone = reputationMilestones[i];
            if (newScore >= milestone && !milestoneAwarded[user][milestone]) {
                milestoneAwarded[user][milestone] = true;
                try reputationNFT.mintReputationNFT(user) {
                } catch Error(string memory reason) {
                    emit NFTMintFailed(user, newScore, reason);
                } catch {
                    emit NFTMintFailed(user, newScore, "Unknown error");
                }
            }
        }
    }
}
