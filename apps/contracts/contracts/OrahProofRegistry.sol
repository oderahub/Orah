// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OrahProofRegistry
 * @notice Immutable registry for product origin proofs on Celo
 * @dev Stores proof metadata, Self Protocol DIDs, and verification status
 */
contract OrahProofRegistry is Ownable, ReentrancyGuard {

    // Struct to store proof data
    struct Proof {
        string batchId;           // Unique identifier for the product batch
        string metadataCID;       // IPFS CID containing detailed proof metadata
        string selfDID;           // Self Protocol Decentralized Identity for producer
        address producer;         // Ethereum address of the producer
        uint256 timestamp;        // Block timestamp when proof was created
        bool verified;            // Verification status by NoahAI
        string proofHash;         // SHA-256 hash of the AI-generated proof
        uint256 verificationFee;  // Fee paid for verification (in wei, cUSD)
    }

    // Mapping from batchId to Proof
    mapping(string => Proof) public proofs;

    // Mapping to check if a batchId exists
    mapping(string => bool) public proofExists;

    // Mapping from producer address to their batch IDs
    mapping(address => string[]) public producerBatches;

    // Array of all batch IDs for enumeration
    string[] public allBatchIds;

    // Verification fee in cUSD (18 decimals)
    uint256 public verificationFee = 1 * 10**18; // 1 cUSD default

    // Platform fee recipient
    address public feeRecipient;

    // Events
    event ProofCreated(
        string indexed batchId,
        address indexed producer,
        string metadataCID,
        string selfDID,
        uint256 timestamp
    );

    event ProofVerified(
        string indexed batchId,
        string proofHash,
        uint256 timestamp
    );

    event VerificationFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );

    event FeeRecipientUpdated(
        address oldRecipient,
        address newRecipient
    );

    /**
     * @notice Constructor to initialize the contract
     * @param _feeRecipient Address to receive verification fees
     */
    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Create a new proof of origin
     * @param _batchId Unique identifier for the product batch
     * @param _metadataCID IPFS CID containing proof metadata
     * @param _selfDID Self Protocol DID for producer verification
     */
    function createProof(
        string memory _batchId,
        string memory _metadataCID,
        string memory _selfDID
    ) external payable nonReentrant {
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(_metadataCID).length > 0, "Metadata CID cannot be empty");
        require(bytes(_selfDID).length > 0, "Self DID cannot be empty");
        require(!proofExists[_batchId], "Proof already exists for this batch");
        require(msg.value >= verificationFee, "Insufficient verification fee");

        // Create the proof
        Proof memory newProof = Proof({
            batchId: _batchId,
            metadataCID: _metadataCID,
            selfDID: _selfDID,
            producer: msg.sender,
            timestamp: block.timestamp,
            verified: false,
            proofHash: "",
            verificationFee: msg.value
        });

        proofs[_batchId] = newProof;
        proofExists[_batchId] = true;
        producerBatches[msg.sender].push(_batchId);
        allBatchIds.push(_batchId);

        // Transfer fee to recipient
        if (msg.value > 0) {
            (bool success, ) = feeRecipient.call{value: msg.value}("");
            require(success, "Fee transfer failed");
        }

        emit ProofCreated(
            _batchId,
            msg.sender,
            _metadataCID,
            _selfDID,
            block.timestamp
        );
    }

    /**
     * @notice Verify a proof with AI-generated hash (only callable by owner/backend)
     * @param _batchId Batch ID to verify
     * @param _proofHash SHA-256 hash from NoahAI validation
     */
    function verifyProof(
        string memory _batchId,
        string memory _proofHash
    ) external onlyOwner {
        require(proofExists[_batchId], "Proof does not exist");
        require(bytes(_proofHash).length > 0, "Proof hash cannot be empty");

        Proof storage proof = proofs[_batchId];
        require(!proof.verified, "Proof already verified");

        proof.verified = true;
        proof.proofHash = _proofHash;

        emit ProofVerified(_batchId, _proofHash, block.timestamp);
    }

    /**
     * @notice Get proof details for a batch
     * @param _batchId Batch ID to query
     * @return Proof struct containing all proof data
     */
    function getProof(string memory _batchId) external view returns (Proof memory) {
        require(proofExists[_batchId], "Proof does not exist");
        return proofs[_batchId];
    }

    /**
     * @notice Get all batches registered by a producer
     * @param _producer Producer address
     * @return Array of batch IDs
     */
    function getProducerBatches(address _producer) external view returns (string[] memory) {
        return producerBatches[_producer];
    }

    /**
     * @notice Get total number of proofs registered
     * @return Count of all proofs
     */
    function getTotalProofs() external view returns (uint256) {
        return allBatchIds.length;
    }

    /**
     * @notice Get batch ID by index
     * @param _index Index in the array
     * @return Batch ID at the given index
     */
    function getBatchIdByIndex(uint256 _index) external view returns (string memory) {
        require(_index < allBatchIds.length, "Index out of bounds");
        return allBatchIds[_index];
    }

    /**
     * @notice Update verification fee (only owner)
     * @param _newFee New fee amount in wei
     */
    function updateVerificationFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = verificationFee;
        verificationFee = _newFee;
        emit VerificationFeeUpdated(oldFee, _newFee);
    }

    /**
     * @notice Update fee recipient address (only owner)
     * @param _newRecipient New recipient address
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient address");
        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /**
     * @notice Check if a proof is verified
     * @param _batchId Batch ID to check
     * @return True if verified, false otherwise
     */
    function isProofVerified(string memory _batchId) external view returns (bool) {
        if (!proofExists[_batchId]) {
            return false;
        }
        return proofs[_batchId].verified;
    }
}
