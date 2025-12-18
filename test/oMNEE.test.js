import { expect } from "chai";
import { ethers } from "hardhat";

describe("oMNEE Protocol", function () {
  let mockMNEE;
  let omneeHub;
  let omMNEEToken;
  let settlement;
  let rwaTokenization;
  let crossChainBridge;
  let owner;
  let user1;
  let user2;
  let operator;
  let ownerAddr;
  let user1Addr;
  let user2Addr;
  let operatorAddr;

  beforeEach(async function () {
    [owner, user1, user2, operator] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    user1Addr = await user1.getAddress();
    user2Addr = await user2.getAddress();
    operatorAddr = await operator.getAddress();

    // Deploy MockMNEE
    const MockMNEE = await ethers.getContractFactory("MockMNEE");
    mockMNEE = await MockMNEE.deploy();

    // Deploy OmneeHub (which deploys omMNEE)
    const OmneeHub = await ethers.getContractFactory("OmneeHub");
    omneeHub = await OmneeHub.deploy(await mockMNEE.getAddress(), ownerAddr);

    // Get omMNEE token address
    const omMNEEAddr = await omneeHub.getomMNEEAddress();
    omMNEEToken = await ethers.getContractAt("omMNEE", omMNEEAddr);

    // Deploy Settlement
    const Settlement = await ethers.getContractFactory("Settlement");
    settlement = await Settlement.deploy(omMNEEAddr, ownerAddr);

    // Deploy RWATokenization
    const RWATokenization = await ethers.getContractFactory("RWATokenization");
    rwaTokenization = await RWATokenization.deploy(omMNEEAddr, ownerAddr);

    // Deploy CrossChainBridge
    const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
    crossChainBridge = await CrossChainBridge.deploy(omMNEEAddr, ownerAddr);

    // Mint some MNEE to user1 for testing
    await mockMNEE.mint(user1Addr, ethers.parseEther("1000"));
  });

  describe("OmneeHub - Lock and Mint", function () {
    it("Should lock MNEE and mint omMNEE", async function () {
      const lockAmount = ethers.parseEther("100");
      
      // Approve OmneeHub to spend MNEE
      await mockMNEE.connect(user1).approve(await omneeHub.getAddress(), lockAmount);
      
      // Lock and mint
      const tx = await omneeHub.connect(user1).lockAndMint(lockAmount);
      await expect(tx).to.emit(omneeHub, "MNEELocked");
      await expect(tx).to.emit(omneeHub, "omMNEEMinted");
      
      // Check balances
      expect(await omMNEEToken.balanceOf(user1Addr)).to.equal(lockAmount);
      expect(await omneeHub.totalLocked()).to.equal(lockAmount);
    });

    it("Should unlock MNEE by burning omMNEE", async function () {
      const lockAmount = ethers.parseEther("100");
      
      // Lock and mint first
      await mockMNEE.connect(user1).approve(await omneeHub.getAddress(), lockAmount);
      const tx = await omneeHub.connect(user1).lockAndMint(lockAmount);
      const receipt = await tx.wait();
      
      // Find the lock ID from events
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = omneeHub.interface.parseLog(log);
          return parsed?.name === "MNEELocked";
        } catch {
          return false;
        }
      });
      
      const lockId = event ? omneeHub.interface.parseLog(event).args.lockId : null;
      expect(lockId).to.not.be.null;
      
      // Approve burning
      await omMNEEToken.connect(user1).approve(await omneeHub.getAddress(), lockAmount);
      
      // Unlock and burn
      const unlockTx = await omneeHub.connect(user1).unlockAndBurn(lockId);
      await expect(unlockTx).to.emit(omneeHub, "MNEEUnlocked");
      
      // Check balances
      expect(await omMNEEToken.balanceOf(user1Addr)).to.equal(0);
      expect(await omneeHub.totalLocked()).to.equal(0);
    });

    it("Should reject lock with zero amount", async function () {
      await expect(
        omneeHub.connect(user1).lockAndMint(0)
      ).to.be.revertedWith("OmneeHub: amount must be positive");
    });
  });

  describe("Settlement - Instant Settlement", function () {
    beforeEach(async function () {
      // Setup: Lock MNEE and mint omMNEE for user1
      const lockAmount = ethers.parseEther("100");
      await mockMNEE.connect(user1).approve(await omneeHub.getAddress(), lockAmount);
      await omneeHub.connect(user1).lockAndMint(lockAmount);
    });

    it("Should initiate a settlement", async function () {
      const AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGENT_ROLE"));
      await settlement.grantRole(AGENT_ROLE, ownerAddr);
      
      const amount = ethers.parseEther("10");
      const networkId = ethers.keccak256(ethers.toUtf8Bytes("network1"));
      
      const tx = await settlement.initiateSettlement(user1Addr, user2Addr, amount, networkId);
      await expect(tx).to.emit(settlement, "SettlementInitiated");
    });

    it("Should complete a settlement", async function () {
      const AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGENT_ROLE"));
      await settlement.grantRole(AGENT_ROLE, ownerAddr);
      
      const amount = ethers.parseEther("10");
      const networkId = ethers.keccak256(ethers.toUtf8Bytes("network1"));
      
      // Initiate settlement
      const initTx = await settlement.initiateSettlement(user1Addr, user2Addr, amount, networkId);
      const receipt = await initTx.wait();
      
      // Find settlement ID from events
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = settlement.interface.parseLog(log);
          return parsed?.name === "SettlementInitiated";
        } catch {
          return false;
        }
      });
      
      const settlementId = event ? settlement.interface.parseLog(event).args.settlementId : null;
      
      // Approve settlement contract to transfer omMNEE
      await omMNEEToken.connect(user1).approve(await settlement.getAddress(), amount);
      
      // Complete settlement
      const completeTx = await settlement.completeSettlement(settlementId);
      await expect(completeTx).to.emit(settlement, "SettlementCompleted");
      
      // Check balances
      expect(await omMNEEToken.balanceOf(user2Addr)).to.equal(amount);
    });
  });

  describe("RWATokenization", function () {
    beforeEach(async function () {
      // Setup: Lock MNEE and mint omMNEE for owner
      const lockAmount = ethers.parseEther("1000");
      await mockMNEE.mint(ownerAddr, lockAmount);
      await mockMNEE.approve(await omneeHub.getAddress(), lockAmount);
      await omneeHub.lockAndMint(lockAmount);
    });

    it("Should issue an RWA token", async function () {
      const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
      await rwaTokenization.grantRole(ISSUER_ROLE, ownerAddr);
      
      const collateral = ethers.parseEther("100");
      const assetValue = ethers.parseEther("150");
      const maturity = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
      
      // Approve RWA contract to use omMNEE
      await omMNEEToken.approve(await rwaTokenization.getAddress(), collateral);
      
      // Issue RWA token
      const tx = await rwaTokenization.issueRWAToken(
        user1Addr,
        collateral,
        assetValue,
        0, // AssetType.INVOICE
        maturity,
        "ipfs://metadata"
      );
      
      await expect(tx).to.emit(rwaTokenization, "RWATokenIssued");
      
      // Check total collateral
      expect(await rwaTokenization.totalCollateral()).to.equal(collateral);
    });

    it("Should redeem an RWA token", async function () {
      const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
      await rwaTokenization.grantRole(ISSUER_ROLE, ownerAddr);
      
      const collateral = ethers.parseEther("100");
      const assetValue = ethers.parseEther("150");
      const maturity = Math.floor(Date.now() / 1000) + 86400 * 30;
      
      await omMNEEToken.approve(await rwaTokenization.getAddress(), collateral);
      
      const issueTx = await rwaTokenization.issueRWAToken(
        user1Addr,
        collateral,
        assetValue,
        0,
        maturity,
        "ipfs://metadata"
      );
      
      const receipt = await issueTx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = rwaTokenization.interface.parseLog(log);
          return parsed?.name === "RWATokenIssued";
        } catch {
          return false;
        }
      });
      
      const tokenId = event ? rwaTokenization.interface.parseLog(event).args.tokenId : null;
      
      // Redeem token
      const redeemTx = await rwaTokenization.connect(user1).redeemRWAToken(tokenId);
      await expect(redeemTx).to.emit(rwaTokenization, "RWATokenRedeemed");
      
      // Check collateral returned
      expect(await rwaTokenization.totalCollateral()).to.equal(0);
    });
  });

  describe("CrossChainBridge", function () {
    beforeEach(async function () {
      // Setup: Lock MNEE and mint omMNEE for user1
      const lockAmount = ethers.parseEther("100");
      await mockMNEE.connect(user1).approve(await omneeHub.getAddress(), lockAmount);
      await omneeHub.connect(user1).lockAndMint(lockAmount);
    });

    it("Should initiate a cross-chain bridge transfer", async function () {
      const targetChainId = 137; // Polygon
      await crossChainBridge.addSupportedChain(targetChainId);
      
      const amount = ethers.parseEther("10");
      
      // Approve bridge to use omMNEE
      await omMNEEToken.connect(user1).approve(await crossChainBridge.getAddress(), amount);
      
      // Initiate bridge
      const tx = await crossChainBridge.connect(user1).initiateBridge(
        user2Addr,
        amount,
        targetChainId
      );
      
      await expect(tx).to.emit(crossChainBridge, "BridgeInitiated");
      
      // Check tokens are locked in bridge
      expect(await omMNEEToken.balanceOf(await crossChainBridge.getAddress())).to.equal(amount);
    });

    it("Should complete a bridge transfer", async function () {
      const BRIDGE_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_OPERATOR_ROLE"));
      await crossChainBridge.grantRole(BRIDGE_OPERATOR_ROLE, ownerAddr);
      
      const targetChainId = 137;
      await crossChainBridge.addSupportedChain(targetChainId);
      
      const amount = ethers.parseEther("10");
      await omMNEEToken.connect(user1).approve(await crossChainBridge.getAddress(), amount);
      
      const initTx = await crossChainBridge.connect(user1).initiateBridge(
        user2Addr,
        amount,
        targetChainId
      );
      
      const receipt = await initTx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = crossChainBridge.interface.parseLog(log);
          return parsed?.name === "BridgeInitiated";
        } catch {
          return false;
        }
      });
      
      const requestId = event ? crossChainBridge.interface.parseLog(event).args.requestId : null;
      
      // Complete bridge
      const completeTx = await crossChainBridge.completeBridge(requestId);
      await expect(completeTx).to.emit(crossChainBridge, "BridgeCompleted");
      
      // Check total bridged
      expect(await crossChainBridge.totalBridged()).to.equal(amount);
    });

    it("Should reject bridge to unsupported chain", async function () {
      const unsupportedChainId = 999;
      const amount = ethers.parseEther("10");
      
      await omMNEEToken.connect(user1).approve(await crossChainBridge.getAddress(), amount);
      
      await expect(
        crossChainBridge.connect(user1).initiateBridge(user2Addr, amount, unsupportedChainId)
      ).to.be.revertedWith("CrossChainBridge: target chain not supported");
    });
  });

  describe("omMNEE Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await omMNEEToken.name()).to.equal("omMNEE");
      expect(await omMNEEToken.symbol()).to.equal("omMNEE");
    });

    it("Should allow transfers", async function () {
      // Setup: mint some omMNEE
      const lockAmount = ethers.parseEther("100");
      await mockMNEE.connect(user1).approve(await omneeHub.getAddress(), lockAmount);
      await omneeHub.connect(user1).lockAndMint(lockAmount);
      
      const transferAmount = ethers.parseEther("10");
      
      // Transfer
      await omMNEEToken.connect(user1).transfer(user2Addr, transferAmount);
      
      expect(await omMNEEToken.balanceOf(user2Addr)).to.equal(transferAmount);
      expect(await omMNEEToken.balanceOf(user1Addr)).to.equal(lockAmount - transferAmount);
    });

    it("Should be pausable by pauser role", async function () {
      const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
      
      // Pause
      await omMNEEToken.pause();
      
      // Setup some tokens
      const lockAmount = ethers.parseEther("100");
      await mockMNEE.connect(user1).approve(await omneeHub.getAddress(), lockAmount);
      
      // Should fail when paused
      await expect(
        omneeHub.connect(user1).lockAndMint(lockAmount)
      ).to.be.reverted;
      
      // Unpause
      await omMNEEToken.unpause();
      
      // Should work now
      await omneeHub.connect(user1).lockAndMint(lockAmount);
      expect(await omMNEEToken.balanceOf(user1Addr)).to.equal(lockAmount);
    });
  });
});
