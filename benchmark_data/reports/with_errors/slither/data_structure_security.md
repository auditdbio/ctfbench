Summary
 - [incorrect-equality](#incorrect-equality) (1 results) (Medium)
 - [reentrancy-events](#reentrancy-events) (1 results) (Low)
 - [timestamp](#timestamp) (2 results) (Low)
 - [assembly](#assembly) (1 results) (Informational)
 - [solc-version](#solc-version) (1 results) (Informational)
 - [low-level-calls](#low-level-calls) (1 results) (Informational)
 - [naming-convention](#naming-convention) (2 results) (Informational)
## incorrect-equality
Impact: Medium
Confidence: High
 - [ ] ID-0
[Vesting.deposit()](new_contracts/data_structure_security/Vesting.sol#L14-L21) uses a dangerous strict equality:
	- [releaseTime[msg.sender] == 0](new_contracts/data_structure_security/Vesting.sol#L17)

new_contracts/data_structure_security/Vesting.sol#L14-L21


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-1
Reentrancy in [Vesting.processRelease(uint256,address)](new_contracts/data_structure_security/Vesting.sol#L27-L41):
	External calls:
	- [(success,None) = _recipient.call{value: _amount}()](new_contracts/data_structure_security/Vesting.sol#L38)
	Event emitted after the call(s):
	- [Released(msg.sender,_recipient,_amount)](new_contracts/data_structure_security/Vesting.sol#L40)

new_contracts/data_structure_security/Vesting.sol#L27-L41


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-2
[Vesting.processRelease(uint256,address)](new_contracts/data_structure_security/Vesting.sol#L27-L41) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(block.timestamp >= releaseTime[msg.sender],Funds locked)](new_contracts/data_structure_security/Vesting.sol#L34)

new_contracts/data_structure_security/Vesting.sol#L27-L41


 - [ ] ID-3
[Vesting.deposit()](new_contracts/data_structure_security/Vesting.sol#L14-L21) uses timestamp for comparisons
	Dangerous comparisons:
	- [releaseTime[msg.sender] == 0](new_contracts/data_structure_security/Vesting.sol#L17)

new_contracts/data_structure_security/Vesting.sol#L14-L21


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-4
[Vesting.processRelease(uint256,address)](new_contracts/data_structure_security/Vesting.sol#L27-L41) uses assembly
	- [INLINE ASM](new_contracts/data_structure_security/Vesting.sol#L29-L31)

new_contracts/data_structure_security/Vesting.sol#L27-L41


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-5
Version constraint ^0.8.17 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.17](new_contracts/data_structure_security/Vesting.sol#L2)

new_contracts/data_structure_security/Vesting.sol#L2


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-6
Low level call in [Vesting.processRelease(uint256,address)](new_contracts/data_structure_security/Vesting.sol#L27-L41):
	- [(success,None) = _recipient.call{value: _amount}()](new_contracts/data_structure_security/Vesting.sol#L38)

new_contracts/data_structure_security/Vesting.sol#L27-L41


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-7
Parameter [Vesting.processRelease(uint256,address)._amount](new_contracts/data_structure_security/Vesting.sol#L27) is not in mixedCase

new_contracts/data_structure_security/Vesting.sol#L27


 - [ ] ID-8
Parameter [Vesting.processReleaseForMyself(uint256)._amount](new_contracts/data_structure_security/Vesting.sol#L23) is not in mixedCase

new_contracts/data_structure_security/Vesting.sol#L23


