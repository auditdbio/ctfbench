# Lending Smart Contract Security Analysis

## Issue
**File:** Lending.sol


## Output

**SWC ID:** 104  
**Severity:** High  
**Line:** 92

### Description
Use of msg.sender in loan existence check allows for potential reentrancy. Changes to state, especially deleting loans, should be done before external calls.


---
 
**SWC ID:** 105  
**Severity:** High  
**Line:** 96

### Description
reentrancy attack potential due to external call msg.sender.call{value: collateral}("") which can exploit the withdrawal pattern used in repayLoan and liquidate functions.


---

**SWC ID:** 134  
**Severity:** High  
**Line:** 97

### Description
Unchecked call to low-level function msg.sender.call without handling the returned data. Ensure to validate after calls for success.


---

**SWC ID:** 134  
**Severity:** Med  
**Line:** 45

### Description
Lack of input validation for borrowAmount and principal in loan structure, which may lead to underflow/overflow or invalid states if manipulated improperly.