// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestMNEE
 * @dev A test ERC20 token with faucet functionality for local development and testing.
 * This allows users to mint test tokens without needing real MNEE.
 */
contract TestMNEE is ERC20 {
    // Maximum amount that can be requested per faucet call
    uint256 public constant MAX_FAUCET_AMOUNT = 10000 * 10**18; // 10,000 tokens
    
    // Cooldown period between faucet requests (in seconds)
    uint256 public constant FAUCET_COOLDOWN = 3600; // 1 hour
    
    // Mapping to track last faucet request time per address
    mapping(address => uint256) public lastFaucetRequest;
    
    // Event emitted when tokens are minted via faucet
    event FaucetMint(address indexed to, uint256 amount);

    constructor() ERC20("Test MNEE", "tMNEE") {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens for deployer
    }

    /**
     * @dev Faucet function to request test tokens.
     * Users can request up to MAX_FAUCET_AMOUNT tokens once per cooldown period.
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetRequest[msg.sender] + FAUCET_COOLDOWN,
            "TestMNEE: Faucet cooldown not expired"
        );
        
        lastFaucetRequest[msg.sender] = block.timestamp;
        _mint(msg.sender, MAX_FAUCET_AMOUNT);
        
        emit FaucetMint(msg.sender, MAX_FAUCET_AMOUNT);
    }

    /**
     * @dev Check if an address can request from the faucet.
     * @param user The address to check.
     * @return canRequest True if the user can request tokens.
     * @return timeUntilNextRequest Time remaining until next request (in seconds).
     */
    function canRequestFaucet(address user) external view returns (bool canRequest, uint256 timeUntilNextRequest) {
        uint256 lastRequest = lastFaucetRequest[user];
        uint256 nextRequestTime = lastRequest + FAUCET_COOLDOWN;
        
        if (block.timestamp >= nextRequestTime) {
            canRequest = true;
            timeUntilNextRequest = 0;
        } else {
            canRequest = false;
            timeUntilNextRequest = nextRequestTime - block.timestamp;
        }
    }
}


