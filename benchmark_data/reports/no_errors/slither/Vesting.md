Summary
 - [timestamp](#timestamp) (2 results) (Low)
 - [assembly](#assembly) (2 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [solc-version](#solc-version) (2 results) (Informational)
 - [immutable-states](#immutable-states) (5 results) (Optimization)
## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-0
[Vesting.vestedAmount()](new_contracts/zero_errors/Vesting.sol#L33-L42) uses timestamp for comparisons
	Dangerous comparisons:
	- [block.timestamp < cliff](new_contracts/zero_errors/Vesting.sol#L35)
	- [block.timestamp >= start + duration](new_contracts/zero_errors/Vesting.sol#L37)

new_contracts/zero_errors/Vesting.sol#L33-L42


 - [ ] ID-1
[Vesting.release()](new_contracts/zero_errors/Vesting.sol#L25-L31) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool)(block.timestamp >= cliff)](new_contracts/zero_errors/Vesting.sol#L26)
	- [require(bool)(unreleased > 0)](new_contracts/zero_errors/Vesting.sol#L28)

new_contracts/zero_errors/Vesting.sol#L25-L31


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-2
[SafeERC20._callOptionalReturn(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L159-L177) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L162-L172)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L159-L177


 - [ ] ID-3
[SafeERC20._callOptionalReturnBool(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L187-L197) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L191-L195)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L187-L197


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-4
2 different versions of Solidity are used:
	- Version constraint ^0.8.0 is used by:
		-[^0.8.0](new_contracts/zero_errors/Vesting.sol#L1)
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC1363.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC165.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)

new_contracts/zero_errors/Vesting.sol#L1


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-5
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC1363.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC165.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)

node_modules/@openzeppelin/contracts/interfaces/IERC1363.sol#L4


 - [ ] ID-6
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
	- [^0.8.0](new_contracts/zero_errors/Vesting.sol#L1)

new_contracts/zero_errors/Vesting.sol#L1


## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-7
[Vesting.token](new_contracts/zero_errors/Vesting.sol#L9) should be immutable 

new_contracts/zero_errors/Vesting.sol#L9


 - [ ] ID-8
[Vesting.duration](new_contracts/zero_errors/Vesting.sol#L13) should be immutable 

new_contracts/zero_errors/Vesting.sol#L13


 - [ ] ID-9
[Vesting.beneficiary](new_contracts/zero_errors/Vesting.sol#L10) should be immutable 

new_contracts/zero_errors/Vesting.sol#L10


 - [ ] ID-10
[Vesting.start](new_contracts/zero_errors/Vesting.sol#L11) should be immutable 

new_contracts/zero_errors/Vesting.sol#L11


 - [ ] ID-11
[Vesting.cliff](new_contracts/zero_errors/Vesting.sol#L12) should be immutable 

new_contracts/zero_errors/Vesting.sol#L12


