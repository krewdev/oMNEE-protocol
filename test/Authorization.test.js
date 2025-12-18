import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("QuipoHub Authorization System", function () {
  let hub, omToken, mneeToken;
  let owner, agent1, agent2, unauthorized;
  let ownerSigner, agent1Signer, agent2Signer, unauthorizedSigner;

  beforeEach(async function () {
    // Get signers
    [ownerSigner, agent1Signer, agent2Signer, unauthorizedSigner] = await ethers.getSigners();
    owner = await ownerSigner.getAddress();
    agent1 = await agent1Signer.getAddress();
    agent2 = await agent2Signer.getAddress();
    unauthorized = await unauthorizedSigner.getAddress();

    // Deploy TestMNEE token (or use existing if available)
    const TestMNEE = await ethers.getContractFactory("TestMNEE");
    mneeToken = await TestMNEE.deploy();
    await mneeToken.waitForDeployment();

    // Deploy QuipoHub (which deploys OmneeToken)
    const QuipoHub = await ethers.getContractFactory("QuipoHub");
    hub = await QuipoHub.deploy();
    await hub.waitForDeployment();

    // Get omToken address
    const omTokenAddress = await hub.omneeToken();
    omToken = await ethers.getContractAt("OmneeToken", omTokenAddress);

    // Mint some MNEE to agents for testing
    // TestMNEE mints 1M tokens to deployer, so we transfer from owner
    const mintAmount = ethers.parseEther("10000");
    await mneeToken.transfer(agent1, mintAmount);
    await mneeToken.transfer(agent2, mintAmount);
    await mneeToken.transfer(unauthorized, mintAmount);
  });

  describe("Authorization", function () {
    it("Should allow owner to authorize an agent", async function () {
      await expect(hub.authorizeAgent(agent1))
        .to.emit(hub, "AgentAuthorized")
        .withArgs(agent1);

      expect(await hub.authorizedAgents(agent1)).to.be.true;
    });

    it("Should not allow non-owner to authorize agents", async function () {
      await expect(
        hub.connect(agent1Signer).authorizeAgent(agent2)
      ).to.be.revertedWithCustomError(hub, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to revoke an agent", async function () {
      // First authorize
      await hub.authorizeAgent(agent1);
      expect(await hub.authorizedAgents(agent1)).to.be.true;

      // Then revoke
      await expect(hub.revokeAgent(agent1))
        .to.emit(hub, "AgentRevoked")
        .withArgs(agent1);

      expect(await hub.authorizedAgents(agent1)).to.be.false;
    });

    it("Should not allow revoking non-authorized agent", async function () {
      await expect(
        hub.revokeAgent(agent1)
      ).to.be.revertedWith("QUIPO: Agent is not authorized");
    });

    it("Should not allow non-owner to revoke agents", async function () {
      await hub.authorizeAgent(agent1);
      
      await expect(
        hub.connect(agent1Signer).revokeAgent(agent1)
      ).to.be.revertedWithCustomError(hub, "OwnableUnauthorizedAccount");
    });
  });

  describe("Authorized Agent Operations", function () {
    beforeEach(async function () {
      // Authorize agents
      await hub.authorizeAgent(agent1);
      await hub.authorizeAgent(agent2);
    });

    it("Should allow authorized agent to deposit and mint", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Approve first
      await mneeToken.connect(agent1Signer).approve(await hub.getAddress(), depositAmount);
      
      // Deposit
      await expect(
        hub.connect(agent1Signer).depositAndMint(depositAmount, "Test deposit")
      )
        .to.emit(hub, "CollateralLocked")
        .withArgs(agent1, depositAmount, "Test deposit");

      // Check omMNEE balance
      expect(await omToken.balanceOf(agent1)).to.equal(depositAmount);
    });

    it("Should not allow unauthorized agent to deposit", async function () {
      const depositAmount = ethers.parseEther("100");
      await mneeToken.connect(unauthorizedSigner).approve(await hub.getAddress(), depositAmount);
      
      await expect(
        hub.connect(unauthorizedSigner).depositAndMint(depositAmount, "Test")
      ).to.be.revertedWith("QUIPO: Caller is not an authorized Agent Vector");
    });

    it("Should prevent revoked agent from depositing", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Authorize, deposit, then revoke
      await mneeToken.connect(agent1Signer).approve(await hub.getAddress(), depositAmount);
      await hub.connect(agent1Signer).depositAndMint(depositAmount, "Test");
      
      // Revoke
      await hub.revokeAgent(agent1);
      
      // Try to deposit again (should fail)
      await mneeToken.connect(agent1Signer).approve(await hub.getAddress(), depositAmount);
      await expect(
        hub.connect(agent1Signer).depositAndMint(depositAmount, "Test 2")
      ).to.be.revertedWith("QUIPO: Caller is not an authorized Agent Vector");
    });

    it("Should allow authorized agent to redeem", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Deposit first
      await mneeToken.connect(agent1Signer).approve(await hub.getAddress(), depositAmount);
      await hub.connect(agent1Signer).depositAndMint(depositAmount, "Test");
      
      // Redeem
      const redeemAmount = ethers.parseEther("50");
      await expect(
        hub.connect(agent1Signer).redeem(redeemAmount)
      )
        .to.emit(hub, "RedemptionRequested");

      // Check balances
      expect(await omToken.balanceOf(agent1)).to.equal(depositAmount - redeemAmount);
      expect(await mneeToken.balanceOf(agent1)).to.be.gte(redeemAmount);
    });

    it("Should prevent revoked agent from redeeming", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Deposit
      await mneeToken.connect(agent1Signer).approve(await hub.getAddress(), depositAmount);
      await hub.connect(agent1Signer).depositAndMint(depositAmount, "Test");
      
      // Revoke
      await hub.revokeAgent(agent1);
      
      // Try to redeem (should fail)
      await expect(
        hub.connect(agent1Signer).redeem(ethers.parseEther("50"))
      ).to.be.revertedWith("QUIPO: Caller is not an authorized Agent Vector");
    });
  });

  describe("Owner Privileges", function () {
    it("Owner should be able to perform operations without authorization", async function () {
      const depositAmount = ethers.parseEther("100");
      
      // Owner doesn't need to be authorized
      await mneeToken.mint(owner, depositAmount);
      await mneeToken.approve(await hub.getAddress(), depositAmount);
      
      await expect(
        hub.depositAndMint(depositAmount, "Owner deposit")
      )
        .to.emit(hub, "CollateralLocked");

      expect(await omToken.balanceOf(owner)).to.equal(depositAmount);
    });
  });
});

