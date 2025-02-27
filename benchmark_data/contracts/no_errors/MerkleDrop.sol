// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAirdrop is Ownable {
    using SafeERC20 for IERC20;

    bytes32 public merkleRoot;
    IERC20 public token;

    mapping(bytes32 => bool) public paid;

    event Claimed(address indexed receiver, uint256 amount, bytes32 leafHash);

    constructor(IERC20 _token, bytes32 _merkleRoot) {
        token = _token;
        merkleRoot = _merkleRoot;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function claim(
        uint256 nonce,
        address receiver,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        bytes32 leaf = keccak256(abi.encodePacked(nonce, receiver, amount));
        
        require(!paid[leaf], "Airdrop already claimed");
        require(verifyProof(proof, merkleRoot, leaf), "Invalid proof");

        paid[leaf] = true;

        token.safeTransfer(receiver, amount);

        emit Claimed(receiver, amount, leaf);
    }

    function verifyProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == root;
    }
}