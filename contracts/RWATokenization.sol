// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RWATokenization
 * @notice Tokenizes real-world assets (invoices, assets) as omMNEE-backed instruments
 * @dev Enables RWA representation using omMNEE as collateral
 */
contract RWATokenization is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable omMneeToken;

    enum AssetType { INVOICE, REAL_ESTATE, COMMODITY, OTHER }
    enum AssetStatus { ACTIVE, REDEEMED, DEFAULTED }

    struct RWAToken {
        bytes32 assetId;
        address issuer;
        address owner;
        uint256 collateralAmount;
        uint256 assetValue;
        AssetType assetType;
        AssetStatus status;
        uint256 issuanceTimestamp;
        uint256 maturityTimestamp;
        string assetMetadata; // IPFS hash or other metadata reference
    }

    mapping(bytes32 => RWAToken) public rwaTokens;
    mapping(address => bytes32[]) public ownerTokens;
    mapping(address => bytes32[]) public issuerTokens;
    
    uint256 public tokenCounter;
    uint256 public totalCollateral;

    event RWATokenIssued(
        bytes32 indexed tokenId,
        address indexed issuer,
        address indexed owner,
        uint256 collateralAmount,
        uint256 assetValue,
        AssetType assetType
    );
    event RWATokenRedeemed(bytes32 indexed tokenId, address indexed owner);
    event RWATokenTransferred(bytes32 indexed tokenId, address indexed from, address indexed to);
    event RWATokenDefaulted(bytes32 indexed tokenId);

    constructor(address _omMneeToken, address defaultAdmin) {
        require(_omMneeToken != address(0), "RWATokenization: invalid omMNEE token");
        
        omMneeToken = IERC20(_omMneeToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ISSUER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }

    /**
     * @notice Issue a new RWA token backed by omMNEE collateral
     * @param owner Initial owner of the RWA token
     * @param collateralAmount Amount of omMNEE to lock as collateral
     * @param assetValue Value of the underlying asset
     * @param assetType Type of the real-world asset
     * @param maturityTimestamp Maturity date for the asset
     * @param assetMetadata Metadata reference (e.g., IPFS hash)
     * @return tokenId Unique identifier for the RWA token
     */
    function issueRWAToken(
        address owner,
        uint256 collateralAmount,
        uint256 assetValue,
        AssetType assetType,
        uint256 maturityTimestamp,
        string calldata assetMetadata
    ) 
        external 
        onlyRole(ISSUER_ROLE) 
        whenNotPaused 
        nonReentrant 
        returns (bytes32 tokenId) 
    {
        require(owner != address(0), "RWATokenization: owner is zero address");
        require(collateralAmount > 0, "RWATokenization: collateral must be positive");
        require(assetValue > 0, "RWATokenization: asset value must be positive");
        require(maturityTimestamp > block.timestamp, "RWATokenization: invalid maturity");
        
        tokenId = keccak256(
            abi.encodePacked(msg.sender, owner, assetValue, block.timestamp, tokenCounter++)
        );
        
        rwaTokens[tokenId] = RWAToken({
            assetId: tokenId,
            issuer: msg.sender,
            owner: owner,
            collateralAmount: collateralAmount,
            assetValue: assetValue,
            assetType: assetType,
            status: AssetStatus.ACTIVE,
            issuanceTimestamp: block.timestamp,
            maturityTimestamp: maturityTimestamp,
            assetMetadata: assetMetadata
        });
        
        ownerTokens[owner].push(tokenId);
        issuerTokens[msg.sender].push(tokenId);
        totalCollateral += collateralAmount;
        
        // Lock omMNEE as collateral
        require(
            omMneeToken.transferFrom(msg.sender, address(this), collateralAmount),
            "RWATokenization: collateral transfer failed"
        );
        
        emit RWATokenIssued(tokenId, msg.sender, owner, collateralAmount, assetValue, assetType);
    }

    /**
     * @notice Redeem an RWA token and release collateral
     * @param tokenId ID of the RWA token to redeem
     */
    function redeemRWAToken(bytes32 tokenId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        RWAToken storage token = rwaTokens[tokenId];
        require(token.status == AssetStatus.ACTIVE, "RWATokenization: token not active");
        require(
            token.owner == msg.sender || hasRole(ISSUER_ROLE, msg.sender),
            "RWATokenization: not authorized"
        );
        
        token.status = AssetStatus.REDEEMED;
        totalCollateral -= token.collateralAmount;
        
        // Release collateral to issuer
        require(
            omMneeToken.transfer(token.issuer, token.collateralAmount),
            "RWATokenization: collateral release failed"
        );
        
        emit RWATokenRedeemed(tokenId, token.owner);
    }

    /**
     * @notice Transfer RWA token ownership
     * @param tokenId ID of the RWA token
     * @param newOwner Address of the new owner
     */
    function transferRWAToken(bytes32 tokenId, address newOwner) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        RWAToken storage token = rwaTokens[tokenId];
        require(token.owner == msg.sender, "RWATokenization: not owner");
        require(token.status == AssetStatus.ACTIVE, "RWATokenization: token not active");
        require(newOwner != address(0), "RWATokenization: new owner is zero address");
        
        address oldOwner = token.owner;
        token.owner = newOwner;
        
        ownerTokens[newOwner].push(tokenId);
        
        emit RWATokenTransferred(tokenId, oldOwner, newOwner);
    }

    /**
     * @notice Mark an RWA token as defaulted
     * @param tokenId ID of the RWA token
     */
    function markDefault(bytes32 tokenId) 
        external 
        onlyRole(ISSUER_ROLE) 
        whenNotPaused 
    {
        RWAToken storage token = rwaTokens[tokenId];
        require(token.status == AssetStatus.ACTIVE, "RWATokenization: token not active");
        require(token.issuer == msg.sender, "RWATokenization: not issuer");
        
        token.status = AssetStatus.DEFAULTED;
        
        emit RWATokenDefaulted(tokenId);
    }

    /**
     * @notice Get all RWA tokens owned by an address
     * @param owner Address of the owner
     * @return Array of token IDs
     */
    function getOwnerTokens(address owner) external view returns (bytes32[] memory) {
        return ownerTokens[owner];
    }

    /**
     * @notice Get all RWA tokens issued by an address
     * @param issuer Address of the issuer
     * @return Array of token IDs
     */
    function getIssuerTokens(address issuer) external view returns (bytes32[] memory) {
        return issuerTokens[issuer];
    }

    /**
     * @notice Get RWA token details
     * @param tokenId ID of the RWA token
     * @return RWA token details
     */
    function getRWAToken(bytes32 tokenId) external view returns (RWAToken memory) {
        return rwaTokens[tokenId];
    }

    /**
     * @notice Pause all operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause all operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
