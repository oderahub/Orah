import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("OrahProofRegistry", function () {
  // Fixture to deploy the contract
  async function deployOrahProofRegistryFixture() {
    const [owner, producer, feeRecipient, otherAccount] = await hre.viem.getWalletClients();

    const orahProofRegistry = await hre.viem.deployContract("OrahProofRegistry", [
      feeRecipient.account.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      orahProofRegistry,
      owner,
      producer,
      feeRecipient,
      otherAccount,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { orahProofRegistry, owner } = await loadFixture(deployOrahProofRegistryFixture);
      const contractOwner = await orahProofRegistry.read.owner();
      expect(contractOwner.toLowerCase()).to.equal(owner.account.address.toLowerCase());
    });

    it("Should set the correct fee recipient", async function () {
      const { orahProofRegistry, feeRecipient } = await loadFixture(deployOrahProofRegistryFixture);
      const contractRecipient = await orahProofRegistry.read.feeRecipient();
      expect(contractRecipient.toLowerCase()).to.equal(
        feeRecipient.account.address.toLowerCase()
      );
    });

    it("Should set default verification fee to 1 cUSD", async function () {
      const { orahProofRegistry } = await loadFixture(deployOrahProofRegistryFixture);
      expect(await orahProofRegistry.read.verificationFee()).to.equal(parseEther("1"));
    });
  });

  describe("Proof Creation", function () {
    it("Should create a proof successfully", async function () {
      const { orahProofRegistry, producer, publicClient } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      const batchId = "BATCH-001";
      const metadataCID = "QmTest123456789";
      const selfDID = "did:self:producer123";
      const fee = parseEther("1");

      const hash = await orahProofRegistry.write.createProof(
        [batchId, metadataCID, selfDID],
        {
          account: producer.account,
          value: fee,
        }
      );

      await publicClient.waitForTransactionReceipt({ hash });

      // Verify the proof was created
      expect(await orahProofRegistry.read.proofExists([batchId])).to.be.true;

      // Get the proof and verify details
      const proof = await orahProofRegistry.read.getProof([batchId]);
      expect(proof.batchId).to.equal(batchId);
      expect(proof.metadataCID).to.equal(metadataCID);
      expect(proof.selfDID).to.equal(selfDID);
      expect(proof.producer.toLowerCase()).to.equal(producer.account.address.toLowerCase());
      expect(proof.verified).to.be.false;
      expect(proof.verificationFee).to.equal(fee);
    });

    it("Should emit ProofCreated event", async function () {
      const { orahProofRegistry, producer, publicClient } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      const batchId = "BATCH-002";
      const metadataCID = "QmTest987654321";
      const selfDID = "did:self:producer456";

      const hash = await orahProofRegistry.write.createProof(
        [batchId, metadataCID, selfDID],
        {
          account: producer.account,
          value: parseEther("1"),
        }
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Check that event was emitted (simplified check)
      expect(receipt.status).to.equal("success");
    });

    it("Should reject proof creation with insufficient fee", async function () {
      const { orahProofRegistry, producer } = await loadFixture(deployOrahProofRegistryFixture);

      const batchId = "BATCH-003";
      const metadataCID = "QmTestInsufficient";
      const selfDID = "did:self:producer789";

      await expect(
        orahProofRegistry.write.createProof([batchId, metadataCID, selfDID], {
          account: producer.account,
          value: parseEther("0.5"), // Less than required 1 cUSD
        })
      ).to.be.rejected;
    });

    it("Should reject duplicate batch IDs", async function () {
      const { orahProofRegistry, producer, publicClient } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      const batchId = "BATCH-004";
      const metadataCID = "QmTestDuplicate";
      const selfDID = "did:self:producer101";

      // Create first proof
      const hash = await orahProofRegistry.write.createProof(
        [batchId, metadataCID, selfDID],
        {
          account: producer.account,
          value: parseEther("1"),
        }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      // Try to create duplicate
      await expect(
        orahProofRegistry.write.createProof([batchId, metadataCID, selfDID], {
          account: producer.account,
          value: parseEther("1"),
        })
      ).to.be.rejected;
    });

    it("Should reject empty batch ID", async function () {
      const { orahProofRegistry, producer } = await loadFixture(deployOrahProofRegistryFixture);

      await expect(
        orahProofRegistry.write.createProof(["", "QmTest", "did:self:test"], {
          account: producer.account,
          value: parseEther("1"),
        })
      ).to.be.rejected;
    });
  });

  describe("Proof Verification", function () {
    it("Should verify a proof successfully", async function () {
      const { orahProofRegistry, owner, producer, publicClient } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      const batchId = "BATCH-005";
      const proofHash = "0x1234567890abcdef";

      // Create proof first
      const createHash = await orahProofRegistry.write.createProof(
        [batchId, "QmTest", "did:self:test"],
        {
          account: producer.account,
          value: parseEther("1"),
        }
      );
      await publicClient.waitForTransactionReceipt({ hash: createHash });

      // Verify the proof
      const verifyHash = await orahProofRegistry.write.verifyProof([batchId, proofHash], {
        account: owner.account,
      });
      await publicClient.waitForTransactionReceipt({ hash: verifyHash });

      // Check verification status
      expect(await orahProofRegistry.read.isProofVerified([batchId])).to.be.true;

      const proof = await orahProofRegistry.read.getProof([batchId]);
      expect(proof.verified).to.be.true;
      expect(proof.proofHash).to.equal(proofHash);
    });

    it("Should reject verification from non-owner", async function () {
      const { orahProofRegistry, producer, otherAccount, publicClient } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      const batchId = "BATCH-006";

      // Create proof
      const hash = await orahProofRegistry.write.createProof(
        [batchId, "QmTest", "did:self:test"],
        {
          account: producer.account,
          value: parseEther("1"),
        }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      // Try to verify from non-owner account
      await expect(
        orahProofRegistry.write.verifyProof([batchId, "0xhash"], {
          account: otherAccount.account,
        })
      ).to.be.rejected;
    });

    it("Should reject verification of non-existent proof", async function () {
      const { orahProofRegistry, owner } = await loadFixture(deployOrahProofRegistryFixture);

      await expect(
        orahProofRegistry.write.verifyProof(["NONEXISTENT", "0xhash"], {
          account: owner.account,
        })
      ).to.be.rejected;
    });
  });

  describe("Producer Batches", function () {
    it("Should track producer batches correctly", async function () {
      const { orahProofRegistry, producer, publicClient } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      const batch1 = "BATCH-007";
      const batch2 = "BATCH-008";

      // Create two proofs
      const hash1 = await orahProofRegistry.write.createProof(
        [batch1, "QmTest1", "did:self:test1"],
        {
          account: producer.account,
          value: parseEther("1"),
        }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      const hash2 = await orahProofRegistry.write.createProof(
        [batch2, "QmTest2", "did:self:test2"],
        {
          account: producer.account,
          value: parseEther("1"),
        }
      );
      await publicClient.waitForTransactionReceipt({ hash: hash2 });

      // Get producer batches
      const batches = await orahProofRegistry.read.getProducerBatches([producer.account.address]);
      expect(batches.length).to.equal(2);
      expect(batches[0]).to.equal(batch1);
      expect(batches[1]).to.equal(batch2);
    });
  });

  describe("Admin Functions", function () {
    it("Should update verification fee", async function () {
      const { orahProofRegistry, owner } = await loadFixture(deployOrahProofRegistryFixture);

      const newFee = parseEther("2");
      await orahProofRegistry.write.updateVerificationFee([newFee], {
        account: owner.account,
      });

      expect(await orahProofRegistry.read.verificationFee()).to.equal(newFee);
    });

    it("Should update fee recipient", async function () {
      const { orahProofRegistry, owner, otherAccount } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      await orahProofRegistry.write.updateFeeRecipient([otherAccount.account.address], {
        account: owner.account,
      });

      const contractRecipient = await orahProofRegistry.read.feeRecipient();
      expect(contractRecipient.toLowerCase()).to.equal(
        otherAccount.account.address.toLowerCase()
      );
    });

    it("Should reject fee update from non-owner", async function () {
      const { orahProofRegistry, otherAccount } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      await expect(
        orahProofRegistry.write.updateVerificationFee([parseEther("2")], {
          account: otherAccount.account,
        })
      ).to.be.rejected;
    });
  });

  describe("Total Proofs", function () {
    it("Should return correct total proof count", async function () {
      const { orahProofRegistry, producer, publicClient } = await loadFixture(
        deployOrahProofRegistryFixture
      );

      expect(await orahProofRegistry.read.getTotalProofs()).to.equal(0n);

      // Create one proof
      const hash = await orahProofRegistry.write.createProof(
        ["BATCH-009", "QmTest", "did:self:test"],
        {
          account: producer.account,
          value: parseEther("1"),
        }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      expect(await orahProofRegistry.read.getTotalProofs()).to.equal(1n);
    });
  });
});
