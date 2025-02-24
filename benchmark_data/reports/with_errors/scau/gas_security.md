# AirDrop Smart Contract Security Analysis

## Issue
**File:** AirDrop.sol


## Output

**SWC ID:** 104  
**Severity:** Med  
**Line:** 37

### Description
There is a potential reentrancy issue in the distribute function as the external token.transfer function is called before updating the participant’s state. Use Checks-Effects-Interactions pattern to mitigate reentrancy attacks by updating the state before external calls.


---
 
**SWC ID:** 105  
**Severity:** Low  
**Line:** 18

### Description
The constructor of the Airdrop contract calls the register function. This allows the contract deployer to register their own address without passing the eligibility check. Consider removing the register call from the constructor.


---

**SWC ID:** 135  
**Severity:** Low  
**Line:** 35

### Description
The distribute function does not handle the scenario where the token balance is not evenly divisible by the number of participants, leading to potential loss of tokens.


---

**SWC ID:** 128  
**Severity:** Info  
**Line:** 0

### Description
Lack of event emissions for critical contract state changes, such as registration and distribution. Consider adding events to log these actions for better traceability and monitoring.