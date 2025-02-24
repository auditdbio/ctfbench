# Vesting Smart Contract Security Analysis

## Issue
**File:** Vesting.sol


## Output

**SWC ID:** 101  
**Severity:** Med  
**Line:** 13

### Description
This contract allows for Vesting of ERC20 tokens over a specific duration with a cliff period. However, no checks are in place for the token balance of the contract, which could lead to a situation where the contract has insufficient tokens to fulfill the vesting schedule, potentially causing failed transfers.


---
 
**SWC ID:** 101  
**Severity:** Low  
**Line:** 13

### Description
The constructor requires a nonzero beneficiary address, but there is no check to ensure that the specified token address is a contract. If a random address or zero address is accidentally passed, it could lock real tokens sent to this contract.

---

**SWC ID:** 117  
**Severity:** Low  
**Line:** 23

### Description
The release function can be called by anyone, which means anyone can release the vested funds to the beneficiary. It might be intended, but allowing external parties to execute the release on behalf of the beneficiary could expose the contract to unnecessary interactions.

---
 
**SWC ID:** 107  
**Severity:** Info  
**Line:** 23

### Description
Arithmetic operations like addition and multiplication are used when calculating `released` and `vestedAmount()`. In Solidity versions below 0.8.0, such operations could overflow. However, since this contract uses Solidity ^0.8.0, these operations will revert on overflow, mitigating the risk.