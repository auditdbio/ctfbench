# Voting Smart Contract Security Analysis

## Issue
**File:** Voting.sol


## Output

**Severity:** Low  

### Missing Events For Critical Arithmetic

### Description
The static analysis report indicates that the function 'extendVoting' in the 'CTFVoting' contract should emit an event when the 'votingDeadline' state variable is updated. This is a standard practice to ensure transparency and provide a way for off-chain clients to react to changes in the contract state. The provided code for the 'extendVoting' function does not include an event emission after the 'votingDeadline' is updated, which is a missed opportunity for transparency and can cause issues in tracking the contract state.


```votingDeadline += extraTime;```


---
 
**Severity:** Low  

### Missing Zero Address Validation

### Description
The function 'setOwner' in the provided smart contract does not include a check to ensure that the address being set as the new owner is not the zero address (0x0). This can lead to a situation where the ownership of the contract is effectively lost, as the zero address cannot execute transactions or interact with the contract in a meaningful way. The lack of a zero address check in the 'setOwner' function allows for this potential vulnerability.

```owner = newOwner;```

---


**Severity:** Low  

### Block timestamp

### Description
The smart contract in question uses the block.timestamp for comparisons when checking if the current time is before the voting deadline. This can be an issue because the timestamp can be manipulated by miners to a certain extent, which may result in the voting period being extended or proposals being added after the supposed deadline. While this is generally considered a low-severity issue, it could still be a concern in cases where the contract's functionality relies heavily on the precision of time-based checks.

```require(block.timestamp < votingDeadline, "Voting ended");```

---

**Severity:** Low  

### Block timestamp

### Description
The smart contract in question uses the block.timestamp for comparisons when checking if the current time is before the voting deadline. This can be an issue because miners can manipulate the timestamp of the block they are trying to mine to some extent. While the Ethereum Yellow Paper specifies that the timestamp must be greater than the parent block's timestamp, and it's generally expected to increase, the actual increment is not strictly controlled. Miners can set the timestamp to be up to 900 seconds (15 minutes) in the future. This can potentially be exploited to influence the outcome of the vote if the 15-minute window is significant to the voting deadline.


```require(block.timestamp < votingDeadline, "Voting ended");```
