# AI Audit

## Disclaimer
> **This report is AI-generated and may contain false positives.**  
> For a thorough and accurate analysis, we strongly recommend obtaining a manual audit with AuditOne.

---

## Issues

### 1. User Can Claim Twice if the First Claim is Done Just Before the Merkle Tree is Updated

#### **Input Code**
```solidity
function claim(
```

- **Severity:** 🟠 *Medium*  
- **Impact:**  
  A user who is entitled to an airdrop can claim twice if they first claim just before the Merkle tree is updated with a new root. This enables an attacker to get more tokens than they are entitled to.

#### **Description**
Let nonce `N` and address `A` be the proof for which the user is entitled to get some tokens.

1. The user calls `claim(nonce, A, amount, proof)` just before the owner updates the Merkle root.
2. `setMerkleRoot(bytes32 _merkleRoot)` is executed by the owner, updating the Merkle root.
3. In `verifyProof(...)`, the computed hash will be `keccak256(abi.encodePacked(nonce, A, amount))` because `N` and `A` correspond to the old Merkle root. Hence, it will be claimed again.

#### **Recommendations**
✅ When updating the Merkle root, the owner should also revoke the claims of all existing proofs.
