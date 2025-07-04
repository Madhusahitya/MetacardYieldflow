// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.20;

    import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ReputationNFT.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// YieldFlow.sol
// This contract facilitates user deposits, yield-linked spending,
// and an on-chain reputation scoring mechanism for the MetaCard YieldFlow project.
contract YieldFlow is Ownable, ReentrancyGuard, AccessControl {
    using SafeMath for uint256;

    // --- State Variables ---
    IERC20 public usdcToken; // Address of the USDC token (or any other ERC20 stablecoin)
    address public immutable ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE; // Special address for native ETH deposits

    ReputationNFT public reputationNFT;
    // Milestone values (can be changed if needed)
    uint256[] public reputationMilestones = [10, 50, 100];
    // user => milestone => awarded
    mapping(address => mapping(uint256 => bool)) public milestoneAwarded;

    // Mapping from user address to their deposited USDC balance
    mapping(address => uint256) public depositedUSDC;
    // Mapping from user address to their deposited ETH balance
    mapping(address => uint256) public depositedETH;

    // Mapping from user address to their on-chain reputation score
    mapping(address => uint256) public reputationScores;

    // Minimum score required for certain actions (e.g., higher yield access, specific spending limits)
    uint256 public minReputationForYieldAccess;

    // --- Events ---
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Spent(address indexed user, address indexed token, uint256 amount, string purpose);
    event ReputationScoreUpdated(address indexed user, uint256 newScore);
    event YieldClaimed(address indexed user, uint256 amount); // Placeholder for future yield claiming
    event FundsWithdrawn(address indexed user, address indexed token, uint256 amount);

    // --- Constructor ---
    // @param _usdcAddress The address of the USDC ERC20 token.
    // @param _minReputation The initial minimum reputation score required for yield-linked access.
    constructor(address _usdcAddress, uint256 _minReputation) {
        require(_usdcAddress != address(0), "USDC address cannot be zero");
        usdcToken = IERC20(_usdcAddress);
        minReputationForYieldAccess = _minReputation;
    }

    // Admin: set the ReputationNFT contract address
    function setReputationNFTContract(address _nft) external onlyOwner {
        require(_nft != address(0), "NFT address cannot be zero");
        reputationNFT = ReputationNFT(_nft);
    }

    // --- Modifiers ---
    modifier hasMinimumReputation(address _user) {
        require(reputationScores[_user] >= minReputationForYieldAccess, "User does not have minimum reputation");
        _;
    }

    // --- Deposit Functions ---

    /// @notice Allows users to deposit USDC into the contract.
    /// @param _amount The amount of USDC to deposit.
    function depositUSDC(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Deposit amount must be greater than zero");
        
            // Transfer USDC from the user to this contract
        // The user must have approved this contract to spend _amount of USDC beforehand.
        bool success = usdcToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "USDC transfer failed");

        depositedUSDC[msg.sender] = depositedUSDC[msg.sender].add(_amount);
        // Increment reputation score on deposit
        reputationScores[msg.sender] = reputationScores[msg.sender].add(1);
        emit ReputationScoreUpdated(msg.sender, reputationScores[msg.sender]);
        emit Deposited(msg.sender, address(usdcToken), _amount);
        _checkAndMintMilestone(msg.sender, reputationScores[msg.sender]);
    }

    /// @notice Allows users to deposit native ETH into the contract.
    function depositETH() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than zero");

        depositedETH[msg.sender] = depositedETH[msg.sender].add(msg.value);
        emit Deposited(msg.sender, ETH_ADDRESS, msg.value);
    }

    // --- Spending Functions ---

    /// @notice Allows users to spend deposited USDC. This function will be linked to MetaMask Card actions.
    /// @dev This function simulates spending from deposited funds. In a real scenario, this would trigger
    ///      an off-chain process via an n8n workflow or similar, which then interacts with Circle APIs.
    ///      The 'yield-linked' aspect would involve calculating available yield and potentially
    ///      prioritizing spending from yield before principal. This simplified version just deducts.
    /// @param _amount The amount of USDC to spend.
    /// @param _purpose A description of the spending (e.g., "coffee", "online purchase").
    function spendUSDC(uint256 _amount, string calldata _purpose) external nonReentrant {
        require(_amount > 0, "Spend amount must be greater than zero");
        require(depositedUSDC[msg.sender] >= _amount, "Insufficient USDC balance");

        // In a real system, this would trigger an off-chain event for Circle API interaction.
        // For this contract, we simply deduct the balance.
        depositedUSDC[msg.sender] = depositedUSDC[msg.sender].sub(_amount);
        emit Spent(msg.sender, address(usdcToken), _amount, _purpose);
    }

    /// @notice Allows users to spend deposited ETH.
    /// @param _amount The amount of ETH to spend.
    /// @param _purpose A description of the spending.
    function spendETH(uint256 _amount, string calldata _purpose) external nonReentrant {
        require(_amount > 0, "Spend amount must be greater than zero");
        require(depositedETH[msg.sender] >= _amount, "Insufficient ETH balance");

        depositedETH[msg.sender] = depositedETH[msg.sender].sub(_amount);
        emit Spent(msg.sender, ETH_ADDRESS, _amount, _purpose);
    }

    // --- Reputation Scoring Functions ---

    /// @notice Allows the owner to update a user's reputation score.
    /// @dev This function will be called by the n8n automation agent, triggered by OpenAI analysis.
    /// @param _user The address of the user whose score is being updated.
    /// @param _newScore The new reputation score for the user.
    function updateReputationScore(address _user, uint256 _newScore) external onlyOwner {
        require(_user != address(0), "User address cannot be zero");
        reputationScores[_user] = _newScore;
        emit ReputationScoreUpdated(_user, _newScore);
        _checkAndMintMilestone(_user, _newScore);
    }

    /// @notice Allows the owner to set the minimum reputation required for yield-linked access.
    /// @param _newMinReputation The new minimum reputation score.
    function setMinReputationForYieldAccess(uint256 _newMinReputation) external onlyOwner {
        minReputationForYieldAccess = _newMinReputation;
    }

    // --- Withdrawal Functions ---

    /// @notice Allows users to withdraw their deposited USDC.
    /// @param _amount The amount of USDC to withdraw.
    function withdrawUSDC(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(depositedUSDC[msg.sender] >= _amount, "Insufficient deposited USDC to withdraw");

        depositedUSDC[msg.sender] = depositedUSDC[msg.sender].sub(_amount);
        bool success = usdcToken.transfer(msg.sender, _amount);
        require(success, "USDC withdrawal failed");
        emit FundsWithdrawn(msg.sender, address(usdcToken), _amount);
    }

    /// @notice Allows users to withdraw their deposited ETH.
    /// @param _amount The amount of ETH to withdraw.
    function withdrawETH(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(depositedETH[msg.sender] >= _amount, "Insufficient deposited ETH to withdraw");

        depositedETH[msg.sender] = depositedETH[msg.sender].sub(_amount);
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "ETH withdrawal failed");
        emit FundsWithdrawn(msg.sender, ETH_ADDRESS, _amount);
    }

    // --- View Functions ---

    /// @notice Returns the deposited USDC balance of a user.
    /// @param _user The address of the user.
    /// @return The deposited USDC amount.
    function getDepositedUSDC(address _user) external view returns (uint256) {
        return depositedUSDC[_user];
    }

    /// @notice Returns the deposited ETH balance of a user.
    /// @param _user The address of the user.
    /// @return The deposited ETH amount.
    function getDepositedETH(address _user) external view returns (uint256) {
        return depositedETH[_user];
    }

    /// @notice Returns the reputation score of a user.
    /// @param _user The address of the user.
    /// @return The reputation score.
    function getReputationScore(address _user) external view returns (uint256) {
        return reputationScores[_user];
    }

    // --- Internal: Check and mint NFT badge if milestone crossed ---
    function _checkAndMintMilestone(address user, uint256 newScore) internal {
        if (address(reputationNFT) == address(0)) return;
        for (uint256 i = 0; i < reputationMilestones.length; i++) {
            uint256 milestone = reputationMilestones[i];
            if (newScore >= milestone && !milestoneAwarded[user][milestone]) {
                // Mint NFT badge for this milestone
                try reputationNFT.mintReputationNFT(user) {
                    milestoneAwarded[user][milestone] = true;
                } catch {}
            }
        }
    }
}
