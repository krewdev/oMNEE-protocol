// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OmneeToken.sol";

/**
 * @title OmneeHub
 * @dev The "Central Bank" for AI Agents. 
 * Manages MNEE collateral and authorizes Agent Vectors.
 */
contract OmneeHub is Ownable {

    // 1. Configuration
    IERC20 public immutable officialMneeToken;
    OmneeToken public immutable omneeToken;
    
    // The specific MNEE contract address for the Hackathon
    address constant MNEE_ADDRESS = 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF;

    // 2. State
    mapping(address => bool) public authorizedAgents; // Whitelist of "Vectors" (AI Agents)
    mapping(bytes32 => bool) public processedCrossChainOps; // Replay protection

    // 3. Events for the "Agent Listener" (Node.js backend) to watch
    event CollateralLocked(address indexed agent, uint256 amount, string purpose);
    event RedemptionRequested(address indexed agent, uint256 amount, string destination);
    event AgentAuthorized(address indexed agent);

    constructor() Ownable(msg.sender) {
        officialMneeToken = IERC20(MNEE_ADDRESS);
        
        // Deploy the derivative token and keep ownership
        omneeToken = new OmneeToken(); 
    }

    // --- MODIFIERS ---
    
    modifier onlyAgent() {
        require(authorizedAgents[msg.sender] || msg.sender == owner(), "OMNEE: Caller is not an authorized Agent Vector");
        _;
    }

    // --- ADMIN FUNCTIONS ---

    function authorizeAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = true;
        emit AgentAuthorized(_agent);
    }

    // --- CORE UNIVERSAL LEDGER LOGIC ---

    /**
     * @dev STEP 1: DEPOSIT
     * User/Agent locks real MNEE -> Gets omMNEE (1:1).
     * @param amount The amount of MNEE to lock (must approve Hub first).
     * @param metadata Purpose of deposit (e.g., "RWA Collateral for Real Estate").
     */
    function depositAndMint(uint256 amount, string calldata metadata) external onlyAgent {
        require(amount > 0, "OMNEE: Amount must be > 0");

        // 1. Pull MNEE from the agent to the Vault
        bool success = officialMneeToken.transferFrom(msg.sender, address(this), amount);
        require(success, "OMNEE: MNEE transfer failed");

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
        require(omneeToken.balanceOf(msg.sender) >= amount, "OMNEE: Insufficient omMNEE balance");

        // 1. Burn the synthetic token
        omneeToken.burn(msg.sender, amount);

        // 2. Return the collateral (Real MNEE)
        bool success = officialMneeToken.transfer(msg.sender, amount);
        require(success, "OMNEE: MNEE return failed");

        emit RedemptionRequested(msg.sender, amount, "Ethereum Mainnet Redemption");
    }

    /**
     * @dev STEP 3: CROSS-CHAIN "TELEPORT"
     * Allows an agent to "burn" here and signal a mint on another chain (e.g., Solana/BSV).
     * The Agent Listener (Node.js) sees this event and executes the action on the other side.
     */
    function teleportFunds(uint256 amount, string calldata targetChain, string calldata targetAddress) external onlyAgent {
         require(omneeToken.balanceOf(msg.sender) >= amount, "OMNEE: Insufficient omMNEE");

         // 1. Burn locally
         omneeToken.burn(msg.sender, amount);

         // 2. Emit the instruction for the AI Overseer to execute elsewhere
         // Note: The MNEE remains locked in THIS contract, backing the value on the new chain.
         emit RedemptionRequested(msg.sender, amount, string(abi.encodePacked("Teleport to ", targetChain, ": ", targetAddress)));
    }
}
