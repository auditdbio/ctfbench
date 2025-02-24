# MerkleDrop Smart Contract Security Analysis

## Issue
**File:** MerkleDrop.sol


## Output

**SWC ID:** 114  
**Severity:** High  
**Line:** 24

### Description
The function `setMerkleRoot` allows the owner of the contract to modify the merkle root without any restriction, which can potentially lead to fraudulent behavior by changing the airdrop conditions after deployment.


---
 
**SWC ID:** 107  
**Severity:** Med  
**Line:** 2

### Description
The contract does not implement a mechanism to reclaim unclaimed tokens after the airdrop ends. This might result in tokens being lost forever if not claimed.
