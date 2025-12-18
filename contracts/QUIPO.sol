// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OmneeToken.sol";

/**
 * @title QUIPO
 * @dev The Universal Ledger and Omnee Hub for AI Agents.
 * QUIPO serves as:
 * - The Universal Ledger for cross-chain operations
 * - The Omnee Hub managing MNEE/omMNEE conversions
 * - The bridging service for cross-chain asset transfers
 * Manages MNEE collateral, authorizes Agent Vectors, and enables asset conversions.
 */
contract QUIPO is Ownable {

    // 1. Configuration
    IERC20 public immutable officialMneeToken;
    OmneeToken public immutable omneeToken;
    
    // The specific MNEE contract address for the Hackathon (checksummed)
    address constant MNEE_ADDRESS = 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF;

    // 2. State
    mapping(address => bool) public authorizedAgents; // Whitelist of "Vectors" (AI Agents)
    mapping(bytes32 => bool) public processedCrossChainOps; // Replay protection
    mapping(address => uint256) public relayerFees; // Accumulated fees for relayer (Agent Listener)
    address public relayerAddress; // Address that can claim relayer fees

    // 3. Events for the "Agent Listener" (Node.js backend) to watch
    event CollateralLocked(address indexed agent, uint256 amount, string purpose);
    event RedemptionRequested(address indexed agent, uint256 amount, string destination, uint256 relayerFee);
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event RelayerFeeClaimed(address indexed relayer, uint256 amount);

    constructor() Ownable(msg.sender) {
        officialMneeToken = IERC20(MNEE_ADDRESS);
        
        // Deploy the derivative token and keep ownership
        omneeToken = new OmneeToken();
        
        // Initialize relayer address as owner (can be changed later)
        relayerAddress = msg.sender;
    }

    // --- MODIFIERS ---
    
    modifier onlyAgent() {
        require(authorizedAgents[msg.sender] || msg.sender == owner(), "QUIPO: Caller is not an authorized Agent Vector");
        _;
    }

    // --- ADMIN FUNCTIONS ---

    function authorizeAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = true;
        emit AgentAuthorized(_agent);
    }

    function revokeAgent(address _agent) external onlyOwner {
        require(authorizedAgents[_agent], "QUIPO: Agent is not authorized");
        authorizedAgents[_agent] = false;
        emit AgentRevoked(_agent);
    }

    function setRelayerAddress(address _relayer) external onlyOwner {
        relayerAddress = _relayer;
    }

    // --- CORE UNIVERSAL LEDGER LOGIC ---

    /**
     * @dev STEP 1: DEPOSIT
     * User/Agent locks real MNEE -> Gets omMNEE (1:1).
     * @param amount The amount of MNEE to lock (must approve Hub first).
     * @param metadata Purpose of deposit (e.g., "RWA Collateral for Real Estate").
     */
    function depositAndMint(uint256 amount, string calldata metadata) external onlyAgent {
        require(amount > 0, "QUIPO: Amount must be > 0");

        // 1. Pull MNEE from the agent to the Vault
        bool success = officialMneeToken.transferFrom(msg.sender, address(this), amount);
        require(success, "QUIPO: MNEE transfer failed");

        // 2. Mint omMNEE to the agent
        omneeToken.mint(msg.sender, amount);

        // 3. Emit event for the Ledger
        emit CollateralLocked(msg.sender, amount, metadata);
    }

    /**
     * @dev STEP 2: REDEEM
     * User/Agent burns omMNEE -> Gets real MNEE back.
     * @param amount The amount of omMNEE to burn.
     */
    function redeem(uint256 amount) external onlyAgent {
        require(omneeToken.balanceOf(msg.sender) >= amount, "QUIPO: Insufficient omMNEE balance");

        // 1. Burn the synthetic token
        omneeToken.burn(msg.sender, amount);

        // 2. Return the collateral (Real MNEE)
        bool success = officialMneeToken.transfer(msg.sender, amount);
        require(success, "QUIPO: MNEE return failed");

        emit RedemptionRequested(msg.sender, amount, "Ethereum Mainnet Redemption", 0);
    }

    /**
     * @dev STEP 3: CROSS-CHAIN "TELEPORT"
     * Allows an agent to "burn" here and signal a mint on another chain (e.g., Solana/BSV).
     * The Agent Listener (Node.js) sees this event and executes the action on the other side.
     * @param amount The amount of omMNEE to teleport (will be burned)
     * @param targetChain The destination chain name (e.g., "Solana", "BSV")
     * @param targetAddress The recipient address on the target chain
     * @param relayerFee The fee in omMNEE to pay the relayer for target chain gas costs
     */
    function teleportFunds(
        uint256 amount, 
        string calldata targetChain, 
        string calldata targetAddress,
        uint256 relayerFee
    ) external onlyAgent {
        require(omneeToken.balanceOf(msg.sender) >= amount + relayerFee, "QUIPO: Insufficient omMNEE (amount + fee)");
        require(relayerFee > 0, "QUIPO: Relayer fee must be > 0");

        // 1. Burn the teleported amount
        omneeToken.burn(msg.sender, amount);

        // 2. Collect relayer fee (burn from user, accumulate for relayer)
        // The relayer fee is burned from user and will be minted back to relayer when they claim
        // OR we can transfer it directly if we have a fee pool mechanism
        // For now, we'll burn it and track it, then relayer can claim equivalent MNEE
        omneeToken.burn(msg.sender, relayerFee);
        relayerFees[relayerAddress] += relayerFee;

        // 3. Emit the instruction for the AI Overseer to execute elsewhere
        // Note: The MNEE remains locked in THIS contract, backing the value on the new chain.
        // The relayerFee is included in the event so the Agent Listener knows how much it will receive.
        emit RedemptionRequested(
            msg.sender, 
            amount, 
            string(abi.encodePacked("Teleport to ", targetChain, ": ", targetAddress)),
            relayerFee
        );
    }

    /**
     * @dev Claim accumulated relayer fees
     * The relayer (Agent Listener) can claim accumulated fees to cover target chain gas costs.
     * Fees are paid out in MNEE (the underlying collateral).
     */
    function claimRelayerFees() external {
        require(msg.sender == relayerAddress, "QUIPO: Only relayer can claim fees");
        uint256 fees = relayerFees[msg.sender];
        require(fees > 0, "QUIPO: No fees to claim");

        // Reset fees
        relayerFees[msg.sender] = 0;

        // Transfer equivalent MNEE to relayer
        bool success = officialMneeToken.transfer(msg.sender, fees);
        require(success, "QUIPO: MNEE transfer failed");

        emit RelayerFeeClaimed(msg.sender, fees);
    }

    /**
     * @dev Get accumulated relayer fees for an address
     */
    function getRelayerFees(address relayer) external view returns (uint256) {
        return relayerFees[relayer];
    }
}
