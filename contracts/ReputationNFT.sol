// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// ReputationNFT.sol
// A simple ERC721 token to represent on-chain reputation as an NFT badge.
// The actual score is managed by the YieldFlow contract, this NFT serves as a visual badge.
contract ReputationNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Mapping from user address to their minted reputation NFT ID (if any)
    mapping(address => uint256) public userReputationNFT;

    // Event emitted when a new reputation NFT is minted
    event ReputationNFTMinted(address indexed to, uint256 indexed tokenId);
    // Event emitted when a reputation NFT's metadata might conceptually be updated (though not directly in this contract)
    event ReputationNFTUpdated(address indexed user, uint256 indexed tokenId);

    /// @notice Constructor for the ReputationNFT contract.
    /// @param _name The name of the NFT collection (e.g., "MetaCard Reputation Badge").
    /// @param _symbol The symbol of the NFT collection (e.g., "MCRB").
    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Mints a new Reputation NFT to a specified address.
    /// @dev Only addresses with MINTER_ROLE can call this.
    ///      This would typically be called by the n8n automation based on reputation score thresholds.
    /// @param _to The address to mint the NFT to.
    /// @return The ID of the newly minted token.
    function mintReputationNFT(address _to) external onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIdCounter.increment();
        uint256 newItemId = _tokenIdCounter.current();
        _safeMint(_to, newItemId);
        userReputationNFT[_to] = newItemId; // Track the NFT ID for the user
        emit ReputationNFTMinted(_to, newItemId);
        return newItemId;
    }

    /// @notice Burns a Reputation NFT from a specified address.
    /// @dev Only addresses with MINTER_ROLE can call this.
    ///      This could be used if a user's reputation drops below a certain threshold.
    /// @param _from The address from which to burn the NFT.
    /// @param _tokenId The ID of the token to burn.
    function burnReputationNFT(address _from, uint256 _tokenId) external onlyRole(MINTER_ROLE) {
        require(userReputationNFT[_from] == _tokenId, "NFT does not belong to this user or is not tracked");
        _burn(_tokenId);
        delete userReputationNFT[_from]; // Remove the tracked NFT ID
        emit ReputationNFTUpdated(_from, _tokenId); // Use updated event for burning too
    }

    /// @notice Returns the token ID of the reputation NFT owned by a user.
    /// @param _user The address of the user.
    /// @return The token ID, or 0 if no NFT is owned.
    function getReputationNFTId(address _user) external view returns (uint256) {
        return userReputationNFT[_user];
    }

    // The tokenURI function can be overridden to point to a metadata JSON
    // which could dynamically reflect the user's current reputation score
    // or a visual representation of their badge.
    // function tokenURI(uint256 tokenId) public view override returns (string memory) {
    //     // Implement logic to return a dynamic URI based on tokenId or user's score
    //     return string(abi.encodePacked("https://your-api.com/nft-metadata/", Strings.toString(tokenId)));
    // }

    /// @notice Required override for Solidity multiple inheritance (ERC721, AccessControl)
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
