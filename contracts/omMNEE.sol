// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title omMNEE
 * @notice Programmable, cross-chain derivative token minted by locking MNEE
 * @dev ERC20 token with access control, burnable, pausable features
 */
contract omMNEE is ERC20, ERC20Burnable, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    event Minted(address indexed to, uint256 amount, bytes32 indexed lockId);
    event BridgeTransfer(address indexed from, address indexed to, uint256 amount, uint256 indexed chainId);

    constructor(address defaultAdmin) ERC20("omMNEE", "omMNEE") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }

    /**
     * @notice Mint new omMNEE tokens when MNEE is locked
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     * @param lockId Unique identifier for the locked MNEE
     */
    function mint(address to, uint256 amount, bytes32 lockId) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(to != address(0), "omMNEE: mint to zero address");
        require(amount > 0, "omMNEE: mint amount must be positive");
        
        _mint(to, amount);
        emit Minted(to, amount, lockId);
    }

    /**
     * @notice Bridge tokens to another chain
     * @param from Address tokens are bridged from
     * @param amount Amount of tokens to bridge
     * @param targetChainId Target chain ID
     */
    function bridgeTransfer(address from, uint256 amount, uint256 targetChainId) 
        external 
        onlyRole(BRIDGE_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(from != address(0), "omMNEE: bridge from zero address");
        require(amount > 0, "omMNEE: bridge amount must be positive");
        
        _burn(from, amount);
        emit BridgeTransfer(from, address(0), amount, targetChainId);
    }

    /**
     * @notice Pause all token operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause all token operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
