Summary
 - [assembly](#assembly) (2 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (2 results) (Informational)
 - [solc-version](#solc-version) (2 results) (Informational)
 - [naming-convention](#naming-convention) (1 results) (Informational)
 - [immutable-states](#immutable-states) (1 results) (Optimization)
## assembly
Impact: Informational
Confidence: High
 - [ ] ID-0
[SafeERC20._callOptionalReturn(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L159-L177) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L162-L172)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L159-L177


 - [ ] ID-1
[SafeERC20._callOptionalReturnBool(IERC20,bytes)](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L187-L197) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L191-L195)

node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L187-L197


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-2
2 different versions of Solidity are used:
	- Version constraint ^0.8.0 is used by:
		-[^0.8.0](new_contracts/zero_errors/MerkleDrop.sol#L2)
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC1363.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC165.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)

new_contracts/zero_errors/MerkleDrop.sol#L2


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-3
[Context._contextSuffixLength()](node_modules/@openzeppelin/contracts/utils/Context.sol#L25-L27) is never used and should be removed

node_modules/@openzeppelin/contracts/utils/Context.sol#L25-L27


 - [ ] ID-4
[Context._msgData()](node_modules/@openzeppelin/contracts/utils/Context.sol#L21-L23) is never used and should be removed

node_modules/@openzeppelin/contracts/utils/Context.sol#L21-L23


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-5
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC1363.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC165.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)

node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


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
	- [^0.8.0](new_contracts/zero_errors/MerkleDrop.sol#L2)

new_contracts/zero_errors/MerkleDrop.sol#L2


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-7
Parameter [MerkleAirdrop.setMerkleRoot(bytes32)._merkleRoot](new_contracts/zero_errors/MerkleDrop.sol#L29) is not in mixedCase

new_contracts/zero_errors/MerkleDrop.sol#L29


## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-8
[MerkleAirdrop.token](new_contracts/zero_errors/MerkleDrop.sol#L14) should be immutable 

new_contracts/zero_errors/MerkleDrop.sol#L14


