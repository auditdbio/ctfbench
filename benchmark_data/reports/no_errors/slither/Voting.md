Summary
 - [reentrancy-events](#reentrancy-events) (1 results) (Low)
 - [solc-version](#solc-version) (1 results) (Informational)
 - [low-level-calls](#low-level-calls) (1 results) (Informational)
## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-0
Reentrancy in [Voting.executeProposal()](new_contracts/zero_errors/Voting.sol#L55-L64):
	External calls:
	- [(success,returnData) = proposalTarget.call(proposalData)](new_contracts/zero_errors/Voting.sol#L60)
	Event emitted after the call(s):
	- [ProposalExecuted(msg.sender,success,returnData)](new_contracts/zero_errors/Voting.sol#L63)

new_contracts/zero_errors/Voting.sol#L55-L64


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-1
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
	- [^0.8.0](new_contracts/zero_errors/Voting.sol#L2)

new_contracts/zero_errors/Voting.sol#L2


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-2
Low level call in [Voting.executeProposal()](new_contracts/zero_errors/Voting.sol#L55-L64):
	- [(success,returnData) = proposalTarget.call(proposalData)](new_contracts/zero_errors/Voting.sol#L60)

new_contracts/zero_errors/Voting.sol#L55-L64


