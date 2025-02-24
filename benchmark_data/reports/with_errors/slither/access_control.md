Summary
 - [events-maths](#events-maths) (1 results) (Low)
 - [missing-zero-check](#missing-zero-check) (1 results) (Low)
 - [timestamp](#timestamp) (2 results) (Low)
 - [solc-version](#solc-version) (1 results) (Informational)
 - [cache-array-length](#cache-array-length) (1 results) (Optimization)
## events-maths
Impact: Low
Confidence: Medium
 - [ ] ID-0
[CTFVoting.extendVoting(uint256)](new_contracts/access_control/Voting.sol#L41-L43) should emit an event for: 
	- [votingDeadline += extraTime](new_contracts/access_control/Voting.sol#L42) 

new_contracts/access_control/Voting.sol#L41-L43


## missing-zero-check
Impact: Low
Confidence: Medium
 - [ ] ID-1
[CTFVoting.setOwner(address).newOwner](new_contracts/access_control/Voting.sol#L45) lacks a zero-check on :
		- [owner = newOwner](new_contracts/access_control/Voting.sol#L46)

new_contracts/access_control/Voting.sol#L45


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-2
[CTFVoting.addProposal(string)](new_contracts/access_control/Voting.sol#L36-L39) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(block.timestamp < votingDeadline,Voting ended)](new_contracts/access_control/Voting.sol#L37)

new_contracts/access_control/Voting.sol#L36-L39


 - [ ] ID-3
[CTFVoting.vote(uint256)](new_contracts/access_control/Voting.sol#L28-L34) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(block.timestamp < votingDeadline,Voting ended)](new_contracts/access_control/Voting.sol#L29)

new_contracts/access_control/Voting.sol#L28-L34


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-4
Version constraint ^0.8.0 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess
	- AbiReencodingHeadOverflowWithStaticArrayCleanup
	- DirtyBytesArrayToStorage
	- DataLocationChangeInInternalOverride
	- NestedCalldataArrayAbiReencodingSizeValidation
	- SignedImmutables
	- ABIDecodeTwoDimensionalArrayMemory
	- KeccakCaching.
It is used by:
	- [^0.8.0](new_contracts/access_control/Voting.sol#L2)

new_contracts/access_control/Voting.sol#L2


## cache-array-length
Impact: Optimization
Confidence: High
 - [ ] ID-5
Loop condition [i < proposals.length](new_contracts/access_control/Voting.sol#L51) should use cached array length instead of referencing `length` member of the storage array.
 
new_contracts/access_control/Voting.sol#L51


