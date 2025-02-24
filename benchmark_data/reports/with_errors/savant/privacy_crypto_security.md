# Audit Report 🎯

*Generated at 2025-02-18 03:21:55*

## 📊 Vulnerability Statistics

- Total vulnerabilities found: 1

---

## 🚨 Issue 1

### 📄 File: `MerkleDrop.sol`

### Original Code
```solidity
function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
    merkleRoot = _merkleRoot;
}
```

### Synopsis
The `setMerkleRoot` function allows instantaneous changes to the Merkle root without invalidating previously claimed leaves. This enables a boundary condition where users with valid leaves in both old and new roots can double-claim rewards up to their total amount if the owner reuses the same leaf across multiple roots.

### Technical Details
The vulnerability arises when the contract owner deploys multiple Merkle roots containing the same leaf (identical nonce, receiver, and amount). Each root change maintains the same `payouts` tracking for the leaf, allowing users to claim rewards incrementally across multiple root configurations until the total payout reaches the leaf's `amount`. While individual claims are within limits, the cumulative effect permits full fund drainage if the owner erroneously reuses leaves in updated roots.

### Proof of Concept
1. Owner deploys contract with root R1 containing leaf L1 (nonce=1, receiver=A, amount=100)
2. User claims 50 tokens under R1: `payouts[L1] = 50`
3. Owner updates to root R2 containing the same leaf L1
4. User claims remaining 50 tokens under R2: `payouts[L1] += 50 → 100`
5. Result: User receives 100 tokens as intended but through multiple root changes

If the owner creates R2 with a higher amount leaf L2 (nonce=1, receiver=A, amount=200):
6. User claims 200 tokens under R2 as new leaf: `payouts[L2] = 200`
7. Total received: 50 (from R1) + 200 (from R2) = 250 tokens due to reused nonce

### Impact Assessment
Severity: Critical  
Attackers can drain funds if the owner reuses leaves with increased amounts. Honest-but-mistaken configurations enable cumulative payouts exceeding intended limits. Worst-case scenario allows unlimited fund extraction through sequential root updates with escalating leaf amounts.

### Remediation
Modify the claim process to bind leaves to specific Merkle root versions:

1. Add root version tracking
2. Include root version in leaf hashes
3. Implement versioned payout tracking

```solidity
uint256 public rootVersion;
mapping(bytes32 => mapping(uint256 => uint256)) public payouts;

function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
    merkleRoot = _merkleRoot;
    rootVersion++; // Invalidate previous leaves
}
```



