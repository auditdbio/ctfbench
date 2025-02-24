# Voting Smart Contract Security Analysis

## Issue
**File:** Voting.sol


## Output

**Severity:** Low  

### Reentrancy vulnerabilities

### Description
The smart contract provided emits the 'ProposalExecuted' event after making an external call to 'proposalTarget.call(proposalData)'. This pattern is susceptible to reentrancy attacks because the state is updated before making the external call, which can potentially lead to a state being manipulated by a malicious contract during the callback. However, the severity of this issue is low because the external call is the last operation in the function, and the 'executed' state variable is set to true before the external call, which prevents the function from being called again. Additionally, since the state changes are done before the external call, they cannot be influenced by the callback.


```solidity
emit ProposalExecuted(msg.sender, success, returnData);
```

