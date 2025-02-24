# MerkleDrop Smart Contract Security Analysis

## Issue
**File:** MerkleDrop.sol


## Output

**SWC ID:** 107  
**Severity:** Med  
**Line:** 40

### Description
Reentrancy vulnerability during the execution of token.safeTransfer, as external calls are made before state changes are finalized.


---
 
**SWC ID:** 115  
**Severity:** Med  
**Line:** 28

### Description
Potential improper check at require(payouts[leaf] + payout <= amount), this condition should be well-checked to prevent any form of abuse.


---

**SWC ID:** 134  
**Severity:** Low  
**Line:** 30

### Description
Insufficient gas griefing vulnerability. A potential attacker can consume a large amount of gas by using a large Merkle proof in the claim function.


---

**SWC ID:** 131  
**Severity:** Low  
**Line:** 0

### Description
Absence of a mechanism to pause or halt the contract, which might be useful in case of an emergency or detected exploit.

---

**SWC ID:** 108  
**Severity:** Low  
**Line:** 18

### Description
Lack of event emission after merkleRoot is updated in setMerkleRoot, which would improve transparency and traceability.