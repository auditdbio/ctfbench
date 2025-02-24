# AI Audit

## Disclaimer
> **This report is AI-generated and may contain false positives.**  
> For a thorough and accurate analysis, we strongly recommend obtaining a manual audit with AuditOne.

---

## Issues

### 1. Claim Does Not Work if Multiple Payouts Exist for a Leaf

#### **Input Code**
```solidity
require(payouts[leaf] + payout <= amount, "Not enough eligible amount");
```

- **Severity:** 🟠 *Medium*  
- **Impact:**  
  More than one entity is entitled to an airdrop, but only one of them can claim it.

#### **Description**
In `MerkleAirdrop.sol`, an airdrop can have multiple payouts for a single leaf (i.e., nonce, receiver, amount). Therefore, the following code is correct, and one entity can claim a part of the airdrop entitled to another one:

```solidity
function claim(
    uint96 nonce,
    address receiver,
    uint256 amount,
    uint256 payout,
    bytes32[] calldata proof
) external {
    bytes32 leaf = keccak256(abi.encodePacked(nonce, receiver, amount));

    require(payouts[leaf] + payout <= amount, "Not enough eligible amount");

    require(verifyProof(proof, merkleRoot, leaf), "Invalid proof");

    payouts[leaf] += payout;

    token.safeTransfer(receiver, payout);

    emit Claimed(receiver, amount, leaf);
}
```

However, the problem is that the expression in `require(payouts[leaf] + payout <= amount, "Not enough eligible amount");` can be false for all the entities entitled to a leaf. Thus, none of them can claim the airdrop. Consider the following scenario: Alice, Bob, and Charlie are entitled to an airdrop of 300 tokens, each of them can claim at most 100 tokens. Alice claims 100 tokens. Bob and Charlie can no longer claim their tokens because `payouts[leaf] + payout > amount` for both of them.

#### **Recommendations**
✅ One way to solve the problem would be to keep track of the total claimed amount of a leaf. This can be done by adding a new mapping, for example: `mapping(bytes32 => uint256) public totalPayouts;`

```solidity
function claim(
    uint96 nonce,
    address receiver,
    uint256 amount,
    uint256 payout,
    bytes32[] calldata proof
) external {
    bytes32 leaf = keccak256(abi.encodePacked(nonce, receiver, amount));

    require(totalPayouts[leaf] + payout <= amount, "Not enough eligible amount");

    require(verifyProof(proof, merkleRoot, leaf), "Invalid proof");

    totalPayouts[leaf] += payout;

    token.safeTransfer(receiver, payout);

    emit Claimed(receiver, amount, leaf);
}
```

However, this solution introduces a new vulnerability because it can be used for an airdrop of 300 tokens for one leaf to pay 100 tokens to each one of 3 different addresses. Therefore, I would recommend applying a method similar to the one used in `AirdropFacet.sol` to prevent duplicate claims.
