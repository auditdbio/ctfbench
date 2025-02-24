Summary
 - [calls-loop](#calls-loop) (1 results) (Low)
 - [timestamp](#timestamp) (2 results) (Low)
 - [pragma](#pragma) (1 results) (Informational)
 - [solc-version](#solc-version) (2 results) (Informational)
## calls-loop
Impact: Low
Confidence: Medium
 - [ ] ID-0
[Airdrop.distribute()](new_contracts/gas_security/Airdrop.sol#L36-L50) has external calls inside a loop: [require(bool,string)(token.transfer(participants[i],amountPerParticipant),Transfer failed)](new_contracts/gas_security/Airdrop.sol#L48)

new_contracts/gas_security/Airdrop.sol#L36-L50


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-1
[Airdrop.distribute()](new_contracts/gas_security/Airdrop.sol#L36-L50) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(block.timestamp > registrationDeadline,Distribution not started)](new_contracts/gas_security/Airdrop.sol#L37)

new_contracts/gas_security/Airdrop.sol#L36-L50


 - [ ] ID-2
[Airdrop.register()](new_contracts/gas_security/Airdrop.sol#L27-L33) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(block.timestamp <= registrationDeadline,Registration closed)](new_contracts/gas_security/Airdrop.sol#L28)

new_contracts/gas_security/Airdrop.sol#L27-L33


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-3
2 different versions of Solidity are used:
	- Version constraint ^0.8.0 is used by:
		-[^0.8.0](new_contracts/gas_security/Airdrop.sol#L2)
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)

new_contracts/gas_security/Airdrop.sol#L2


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-4
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)

node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4


 - [ ] ID-5
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
	- [^0.8.0](new_contracts/gas_security/Airdrop.sol#L2)

new_contracts/gas_security/Airdrop.sol#L2


