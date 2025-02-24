# Voting Smart Contract Security Analysis

## Issue
**File:** Voting.sol


## Output

**SWC ID:** 105  
**Severity:** High  
**Line:** 36

### Description
The contract allows the owner to change ownership arbitrarily without any checks or restrictions, which may lead to unauthorized loss of control over the contract if the `setOwner` function is called by an attacker with owner privileges.

---
 
**SWC ID:** 114  
**Severity:** Low  
**Line:** 30

### Description
The `extendVoting` function can be misused by the owner to indefinitely prolong the voting period, which may not be the intended behavior.

---

**SWC ID:** 128  
**Severity:** Low  
**Line:** 23

### Description
The function `vote` does not prevent a known reentrancy vulnerability when updating the `voteCount` and `hasVoted` mapping, although in this specific context, it may not pose an immediate threat due to the simple logic.