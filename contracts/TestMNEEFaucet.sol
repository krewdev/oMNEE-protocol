// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestMNEEFaucet
 * @dev A test faucet contract with configurable cooldown for development/testing.
 * This version allows the owner to set a shorter cooldown period for testing purposes.
 */
contract TestMNEEFaucet is Ownable {
    // The token contract address
    IERC20 public immutable mneeToken;
    
    // Maximum amount that can be requested per faucet call
    uint256 public constant MAX_FAUCET_AMOUNT = 10000 * 10**18; // 10,000 tokens
    
    // Cooldown period between faucet requests (in seconds) - configurable for testing
    uint256 public faucetCooldown;
    
    // Mapping to track last faucet request time per address
    mapping(address => uint256) public lastFaucetRequest;
    
    // Event emitted when tokens are distributed via faucet
    event FaucetRequest(address indexed to, uint256 amount);
    event FaucetFunded(address indexed funder, uint256 amount);
    event FaucetWithdrawn(address indexed to, uint256 amount);
    event CooldownUpdated(uint256 newCooldown);

    constructor(address _mneeTokenAddress, uint256 _initialCooldown) Ownable(msg.sender) {
        require(_mneeTokenAddress != address(0), "TestMNEEFaucet: Invalid token address");
        mneeToken = IERC20(_mneeTokenAddress);
        faucetCooldown = _initialCooldown;
    }

    /**
     * @dev Set the cooldown period (owner only, for testing)
     * @param _newCooldown The new cooldown period in seconds
     */
    function setCooldown(uint256 _newCooldown) external onlyOwner {
        faucetCooldown = _newCooldown;
        emit CooldownUpdated(_newCooldown);
    }

    /**
     * @dev Faucet function to request test tokens.
     * Users can request up to MAX_FAUCET_AMOUNT tokens once per cooldown period.
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetRequest[msg.sender] + faucetCooldown,
            "TestMNEEFaucet: Faucet cooldown not expired"
        );
        
        require(
            mneeToken.balanceOf(address(this)) >= MAX_FAUCET_AMOUNT,
            "TestMNEEFaucet: Insufficient tokens in faucet"
        );
        
        lastFaucetRequest[msg.sender] = block.timestamp;
        
        bool success = mneeToken.transfer(msg.sender, MAX_FAUCET_AMOUNT);
        require(success, "TestMNEEFaucet: Token transfer failed");
        
        emit FaucetRequest(msg.sender, MAX_FAUCET_AMOUNT);
    }

    /**
     * @dev Check if an address can request from the faucet.
     * @param user The address to check.
     * @return canRequest True if the user can request tokens.
     * @return timeUntilNextRequest Time remaining until next request (in seconds).
     */
    function canRequestFaucet(address user) external view returns (bool canRequest, uint256 timeUntilNextRequest) {
        uint256 lastRequest = lastFaucetRequest[user];
        uint256 nextRequestTime = lastRequest + faucetCooldown;
        uint256 faucetBalance = mneeToken.balanceOf(address(this));
        
        if (block.timestamp >= nextRequestTime && faucetBalance >= MAX_FAUCET_AMOUNT) {
            canRequest = true;
            timeUntilNextRequest = 0;
        } else {
            canRequest = false;
            if (block.timestamp < nextRequestTime) {
                timeUntilNextRequest = nextRequestTime - block.timestamp;
            } else {
                timeUntilNextRequest = 0; // Can't request due to insufficient balance
            }
        }
    }

    /**
     * @dev Fund the faucet with tokens.
     * @param amount The amount of tokens to fund (must approve this contract first).
     */
    function fundFaucet(uint256 amount) external {
        require(amount > 0, "TestMNEEFaucet: Amount must be > 0");
        
        bool success = mneeToken.transferFrom(msg.sender, address(this), amount);
        require(success, "TestMNEEFaucet: Token transfer failed");
        
        emit FaucetFunded(msg.sender, amount);
    }

    /**
     * @dev Withdraw tokens from the faucet (owner only).
     * @param amount The amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "TestMNEEFaucet: Amount must be > 0");
        require(
            mneeToken.balanceOf(address(this)) >= amount,
            "TestMNEEFaucet: Insufficient balance"
        );
        
        bool success = mneeToken.transfer(owner(), amount);
        require(success, "TestMNEEFaucet: Token transfer failed");
        
        emit FaucetWithdrawn(owner(), amount);
    }

    /**
     * @dev Get the current balance of the faucet.
     * @return The current balance of tokens in the faucet.
     */
    function getFaucetBalance() external view returns (uint256) {
        return mneeToken.balanceOf(address(this));
    }
}

