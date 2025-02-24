# Voting Smart Contract Security Analysis

## Issue
**File:** Voting.sol


## Output

**SWC ID:** 101  
**Severity:** Med  
**Line:** 15

### Description
Using block timestamps for future-oriented concepts like vesting can lead to vulnerabilities due to miners having the ability to manipulate block timestamps to some extent.


---
 
**SWC ID:** 110  
**Severity:** High  
**Line:** 29

### Description
The lack of Zero Address Validation could result in transferring value to address(0) (zero address represents "null", leading to loss of value).


---

**SWC ID:** 107  
**Severity:** Low  
**Line:** 29

### Description
Checksum-aware addresses should be used to catch user input errors.


---

**SWC ID:** 134  
**Severity:** Low  
**Line:** 5

### Description
Force-feeding ether into this contract could lead to account balance inconsistencies since there is no payable fallback function implemented. This could affect funds accounting.
