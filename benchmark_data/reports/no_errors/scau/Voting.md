# Voting Smart Contract Security Analysis

## Issue
**File:** Voting.sol


## Output

**SWC ID:** 104  
**Severity:** High  
**Line:** 53

### Description
The contract does not correctly prevent a reentrant call to executeProposal(), due to the external call to proposalTarget.call(proposalData) before setting the "executed" flag. An attacker could exploit this by causing executeProposal to be called multiple times before the "executed" flag is set.


---
 
**SWC ID:** 105  
**Severity:** Med  
**Line:** 40

### Description
The contract checks that voting power is greater than zero before allowing vote() to proceed, but it does not account for a rapidly changing voting power balance (e.g., by transferring tokens back and forth between addresses). Consider implementing a checkpoint-based mechanism.


---

**SWC ID:** 106  
**Severity:** Low  
**Line:** 41

### Description
An attacker with enough voting power could call vote() multiple times using different addresses that they control before executing the proposal. There's no mechanism to ensure that a user only votes once across multiple addresses.
