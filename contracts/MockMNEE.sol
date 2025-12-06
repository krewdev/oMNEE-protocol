// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockMNEE
 * @notice Mock MNEE token for testing purposes
 * @dev Simple ERC20 token with minting capability
 */
contract MockMNEE is ERC20 {
    constructor() ERC20("Mock MNEE", "MNEE") {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @notice Mint new tokens (for testing only - DO NOT USE IN PRODUCTION)
     * @dev This function has no access control and is only for testing purposes
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
