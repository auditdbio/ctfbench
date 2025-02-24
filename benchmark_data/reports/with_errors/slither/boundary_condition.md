Summary
 - [solc-version](#solc-version) (1 results) (Informational)
 - [naming-convention](#naming-convention) (7 results) (Informational)
 - [immutable-states](#immutable-states) (2 results) (Optimization)
## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-0
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
	- [^0.8.0](new_contracts/boundary_condition/SuperToken.sol#L2)

new_contracts/boundary_condition/SuperToken.sol#L2


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-1
Parameter [SimpleToken.approve(address,uint256)._spender](new_contracts/boundary_condition/SuperToken.sol#L57) is not in mixedCase

new_contracts/boundary_condition/SuperToken.sol#L57


 - [ ] ID-2
Parameter [SimpleToken.approve(address,uint256)._value](new_contracts/boundary_condition/SuperToken.sol#L57) is not in mixedCase

new_contracts/boundary_condition/SuperToken.sol#L57


 - [ ] ID-3
Parameter [SimpleToken.transfer(address,uint256)._to](new_contracts/boundary_condition/SuperToken.sol#L51) is not in mixedCase

new_contracts/boundary_condition/SuperToken.sol#L51


 - [ ] ID-4
Parameter [SimpleToken.transferFrom(address,address,uint256)._from](new_contracts/boundary_condition/SuperToken.sol#L64) is not in mixedCase

new_contracts/boundary_condition/SuperToken.sol#L64


 - [ ] ID-5
Parameter [SimpleToken.transfer(address,uint256)._value](new_contracts/boundary_condition/SuperToken.sol#L51) is not in mixedCase

new_contracts/boundary_condition/SuperToken.sol#L51


 - [ ] ID-6
Parameter [SimpleToken.transferFrom(address,address,uint256)._to](new_contracts/boundary_condition/SuperToken.sol#L64) is not in mixedCase

new_contracts/boundary_condition/SuperToken.sol#L64


 - [ ] ID-7
Parameter [SimpleToken.transferFrom(address,address,uint256)._value](new_contracts/boundary_condition/SuperToken.sol#L64) is not in mixedCase

new_contracts/boundary_condition/SuperToken.sol#L64


## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-8
[SimpleToken.totalSupply](new_contracts/boundary_condition/SuperToken.sol#L9) should be immutable 

new_contracts/boundary_condition/SuperToken.sol#L9


 - [ ] ID-9
[SimpleToken.decimals](new_contracts/boundary_condition/SuperToken.sol#L8) should be immutable 

new_contracts/boundary_condition/SuperToken.sol#L8


