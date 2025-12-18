// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Settlement
 * @notice Handles instant settlement on private agent networks
 * @dev Enables fast, low-cost settlements using omMNEE
 */
contract Settlement is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable omMneeToken;

    struct SettlementRequest {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        bool settled;
        bytes32 agentNetworkId;
    }

    mapping(bytes32 => SettlementRequest) public settlements;
    mapping(bytes32 => bytes32[]) public networkSettlements;
    
    uint256 public settlementCounter;
    uint256 public totalSettled;

    event SettlementInitiated(
        bytes32 indexed settlementId,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 agentNetworkId
    );
    event SettlementCompleted(bytes32 indexed settlementId);

    constructor(address _omMneeToken, address defaultAdmin) {
        require(_omMneeToken != address(0), "Settlement: invalid omMNEE token");
        
        omMneeToken = IERC20(_omMneeToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(AGENT_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }

    /**
     * @notice Initiate an instant settlement
     * @param from Sender address
     * @param to Receiver address
     * @param amount Amount to settle
     * @param agentNetworkId ID of the agent network
     * @return settlementId Unique identifier for this settlement
     */
    function initiateSettlement(
        address from,
        address to,
        uint256 amount,
        bytes32 agentNetworkId
    ) 
        external 
        onlyRole(AGENT_ROLE) 
        whenNotPaused 
        nonReentrant 
        returns (bytes32 settlementId) 
    {
        require(from != address(0), "Settlement: from is zero address");
        require(to != address(0), "Settlement: to is zero address");
        require(amount > 0, "Settlement: amount must be positive");
        
        settlementId = keccak256(
            abi.encodePacked(from, to, amount, block.timestamp, settlementCounter++)
        );
        
        settlements[settlementId] = SettlementRequest({
            from: from,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            settled: false,
            agentNetworkId: agentNetworkId
        });
        
        networkSettlements[agentNetworkId].push(settlementId);
        
        emit SettlementInitiated(settlementId, from, to, amount, agentNetworkId);
    }

    /**
     * @notice Complete a settlement by transferring omMNEE
     * @param settlementId ID of the settlement to complete
     */
    function completeSettlement(bytes32 settlementId) 
        external 
        onlyRole(AGENT_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        SettlementRequest storage settlement = settlements[settlementId];
        require(!settlement.settled, "Settlement: already settled");
        require(settlement.amount > 0, "Settlement: invalid settlement");
        
        settlement.settled = true;
        totalSettled += settlement.amount;
        
        // Transfer omMNEE from sender to receiver
        require(
            omMneeToken.transferFrom(settlement.from, settlement.to, settlement.amount),
            "Settlement: omMNEE transfer failed"
        );
        
        emit SettlementCompleted(settlementId);
    }

    /**
     * @notice Get all settlements for a network
     * @param agentNetworkId ID of the agent network
     * @return Array of settlement IDs
     */
    function getNetworkSettlements(bytes32 agentNetworkId) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return networkSettlements[agentNetworkId];
    }

    /**
     * @notice Get settlement details
     * @param settlementId ID of the settlement
     * @return Settlement details
     */
    function getSettlement(bytes32 settlementId) 
        external 
        view 
        returns (SettlementRequest memory) 
    {
        return settlements[settlementId];
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
