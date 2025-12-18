// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./omMNEE.sol";

/**
 * @title OmneeHub
 * @notice Main hub contract for locking MNEE and minting omMNEE
 * @dev Acts as a hyper-efficient "Central Bank" for Agents
 */
contract OmneeHub is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC20 public immutable mneeToken;
    omMNEE public immutable omMneeToken;

    struct Lock {
        address user;
        uint256 amount;
        uint256 timestamp;
        bool unlocked;
    }

    mapping(bytes32 => Lock) public locks;
    mapping(address => bytes32[]) public userLocks;
    
    uint256 public totalLocked;
    uint256 public lockCounter;

    event MNEELocked(address indexed user, uint256 amount, bytes32 indexed lockId);
    event MNEEUnlocked(address indexed user, uint256 amount, bytes32 indexed lockId);
    event omMNEEMinted(address indexed user, uint256 amount, bytes32 indexed lockId);

    constructor(address _mneeToken, address defaultAdmin) {
        require(_mneeToken != address(0), "OmneeHub: invalid MNEE token");
        
        mneeToken = IERC20(_mneeToken);
        omMneeToken = new omMNEE(address(this));
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(OPERATOR_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }

    /**
     * @notice Lock MNEE tokens and mint omMNEE
     * @param amount Amount of MNEE to lock
     * @return lockId Unique identifier for this lock
     */
    function lockAndMint(uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (bytes32 lockId) 
    {
        require(amount > 0, "OmneeHub: amount must be positive");
        
        // Generate unique lock ID
        lockId = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, lockCounter++));
        
        // Create lock record
        locks[lockId] = Lock({
            user: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            unlocked: false
        });
        
        userLocks[msg.sender].push(lockId);
        totalLocked += amount;
        
        // Transfer MNEE from user to this contract
        require(
            mneeToken.transferFrom(msg.sender, address(this), amount),
            "OmneeHub: MNEE transfer failed"
        );
        
        emit MNEELocked(msg.sender, amount, lockId);
        
        // Mint omMNEE to user
        omMneeToken.mint(msg.sender, amount, lockId);
        emit omMNEEMinted(msg.sender, amount, lockId);
    }

    /**
     * @notice Unlock MNEE by burning omMNEE
     * @param lockId ID of the lock to unlock
     */
    function unlockAndBurn(bytes32 lockId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Lock storage lock = locks[lockId];
        require(lock.user == msg.sender, "OmneeHub: not lock owner");
        require(!lock.unlocked, "OmneeHub: already unlocked");
        require(lock.amount > 0, "OmneeHub: invalid lock");
        
        // Burn omMNEE from user
        omMneeToken.burnFrom(msg.sender, lock.amount);
        
        // Mark as unlocked
        lock.unlocked = true;
        totalLocked -= lock.amount;
        
        // Transfer MNEE back to user
        require(
            mneeToken.transfer(msg.sender, lock.amount),
            "OmneeHub: MNEE transfer failed"
        );
        
        emit MNEEUnlocked(msg.sender, lock.amount, lockId);
    }

    /**
     * @notice Get all lock IDs for a user
     * @param user Address of the user
     * @return Array of lock IDs
     */
    function getUserLocks(address user) external view returns (bytes32[] memory) {
        return userLocks[user];
    }

    /**
     * @notice Get lock details
     * @param lockId ID of the lock
     * @return Lock details
     */
    function getLock(bytes32 lockId) external view returns (Lock memory) {
        return locks[lockId];
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

    /**
     * @notice Get the omMNEE token address
     */
    function getomMNEEAddress() external view returns (address) {
        return address(omMneeToken);
    }
}
