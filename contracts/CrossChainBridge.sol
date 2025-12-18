// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrossChainBridge
 * @notice Enables cross-chain payments without fragmentation
 * @dev Facilitates omMNEE transfers across different blockchain networks
 */
contract CrossChainBridge is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant BRIDGE_OPERATOR_ROLE = keccak256("BRIDGE_OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable omMneeToken;

    enum BridgeStatus { PENDING, COMPLETED, FAILED }

    struct BridgeRequest {
        address from;
        address to;
        uint256 amount;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint256 timestamp;
        BridgeStatus status;
        bytes32 nonce;
    }

    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(uint256 => bool) public supportedChains;
    mapping(address => bytes32[]) public userBridgeRequests;
    
    uint256 public bridgeCounter;
    uint256 public totalBridged;

    event BridgeInitiated(
        bytes32 indexed requestId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event BridgeCompleted(bytes32 indexed requestId);
    event BridgeFailed(bytes32 indexed requestId, string reason);
    event ChainSupported(uint256 indexed chainId);
    event ChainUnsupported(uint256 indexed chainId);

    constructor(address _omMneeToken, address defaultAdmin) {
        require(_omMneeToken != address(0), "CrossChainBridge: invalid omMNEE token");
        
        omMneeToken = IERC20(_omMneeToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(BRIDGE_OPERATOR_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        
        // Set current chain as supported by default
        supportedChains[block.chainid] = true;
    }

    /**
     * @notice Initiate a cross-chain bridge transfer
     * @param to Recipient address on target chain
     * @param amount Amount of omMNEE to bridge
     * @param targetChainId ID of the target blockchain
     * @return requestId Unique identifier for this bridge request
     */
    function initiateBridge(
        address to,
        uint256 amount,
        uint256 targetChainId
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (bytes32 requestId) 
    {
        require(to != address(0), "CrossChainBridge: to is zero address");
        require(amount > 0, "CrossChainBridge: amount must be positive");
        require(supportedChains[targetChainId], "CrossChainBridge: target chain not supported");
        require(targetChainId != block.chainid, "CrossChainBridge: cannot bridge to same chain");
        
        bytes32 nonce = keccak256(
            abi.encodePacked(msg.sender, to, amount, block.timestamp, bridgeCounter++)
        );
        
        requestId = keccak256(
            abi.encodePacked(msg.sender, to, amount, block.chainid, targetChainId, nonce)
        );
        
        bridgeRequests[requestId] = BridgeRequest({
            from: msg.sender,
            to: to,
            amount: amount,
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            timestamp: block.timestamp,
            status: BridgeStatus.PENDING,
            nonce: nonce
        });
        
        userBridgeRequests[msg.sender].push(requestId);
        
        // Lock omMNEE tokens in this contract
        require(
            omMneeToken.transferFrom(msg.sender, address(this), amount),
            "CrossChainBridge: token transfer failed"
        );
        
        emit BridgeInitiated(requestId, msg.sender, to, amount, block.chainid, targetChainId);
    }

    /**
     * @notice Complete a cross-chain bridge transfer (called by bridge operator)
     * @param requestId ID of the bridge request to complete
     */
    function completeBridge(bytes32 requestId) 
        external 
        onlyRole(BRIDGE_OPERATOR_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.status == BridgeStatus.PENDING, "CrossChainBridge: request not pending");
        require(request.amount > 0, "CrossChainBridge: invalid request");
        
        request.status = BridgeStatus.COMPLETED;
        totalBridged += request.amount;
        
        emit BridgeCompleted(requestId);
    }

    /**
     * @notice Mark a bridge request as failed and refund tokens
     * @param requestId ID of the bridge request
     * @param reason Reason for failure
     */
    function failBridge(bytes32 requestId, string calldata reason) 
        external 
        onlyRole(BRIDGE_OPERATOR_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.status == BridgeStatus.PENDING, "CrossChainBridge: request not pending");
        require(request.amount > 0, "CrossChainBridge: invalid request");
        
        request.status = BridgeStatus.FAILED;
        
        // Refund tokens to sender
        require(
            omMneeToken.transfer(request.from, request.amount),
            "CrossChainBridge: refund failed"
        );
        
        emit BridgeFailed(requestId, reason);
    }

    /**
     * @notice Add support for a new chain
     * @param chainId ID of the chain to support
     */
    function addSupportedChain(uint256 chainId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(!supportedChains[chainId], "CrossChainBridge: chain already supported");
        supportedChains[chainId] = true;
        emit ChainSupported(chainId);
    }

    /**
     * @notice Remove support for a chain
     * @param chainId ID of the chain to unsupport
     */
    function removeSupportedChain(uint256 chainId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(supportedChains[chainId], "CrossChainBridge: chain not supported");
        require(chainId != block.chainid, "CrossChainBridge: cannot unsupport current chain");
        supportedChains[chainId] = false;
        emit ChainUnsupported(chainId);
    }

    /**
     * @notice Get all bridge requests for a user
     * @param user Address of the user
     * @return Array of request IDs
     */
    function getUserBridgeRequests(address user) external view returns (bytes32[] memory) {
        return userBridgeRequests[user];
    }

    /**
     * @notice Get bridge request details
     * @param requestId ID of the bridge request
     * @return Bridge request details
     */
    function getBridgeRequest(bytes32 requestId) external view returns (BridgeRequest memory) {
        return bridgeRequests[requestId];
    }

    /**
     * @notice Check if a chain is supported
     * @param chainId ID of the chain to check
     * @return True if supported, false otherwise
     */
    function isChainSupported(uint256 chainId) external view returns (bool) {
        return supportedChains[chainId];
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
