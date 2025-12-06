// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OmneeToken (omMNEE)
 * @dev The Universal Settlement Token for Agents.
 * It represents 1:1 backed MNEE held in the OmneeHub.
 */
contract OmneeToken is ERC20, Ownable {
    
    // Event to log rich metadata for Agentic tracking (RWA details, Task IDs)
    event OmniTransfer(address indexed from, address indexed to, uint256 value, string metadata);

    constructor() ERC20("Omni MNEE", "omMNEE") Ownable(msg.sender) {}

    /**
     * @dev Only the OmneeHub (owner) can mint this. 
     * This ensures the supply never exceeds the locked MNEE collateral.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Only the OmneeHub (owner) can burn this during redemption.
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev An 'Agentic Transfer' that allows attaching data to money.
     * Useful for RWA tokenization (e.g., "Transferring for Invoice #992").
     */
    function transferWithMetadata(address to, uint256 value, string calldata metadata) external returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        emit OmniTransfer(owner, to, value, metadata);
        return true;
    }
}
